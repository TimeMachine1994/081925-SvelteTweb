import { json } from "@sveltejs/kit";
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ valid: false, error: "Unauthorized" }, { status: 401 });
  }
  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return json({ valid: false, error: "URL is required" }, { status: 400 });
  }
  if (!url.includes("docs.google.com/spreadsheets")) {
    return json({
      valid: false,
      error: "Invalid URL. Please provide a Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/...)"
    });
  }
  let csvUrl;
  if (url.includes("/pub") || url.includes("output=csv") || url.includes("format=csv")) {
    if (url.includes("output=csv") || url.includes("format=csv")) {
      csvUrl = url;
    } else {
      csvUrl = url.includes("?") ? `${url}&output=csv` : `${url}?output=csv`;
    }
  } else {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return json({
        valid: false,
        error: "Could not extract spreadsheet ID from URL. Make sure you're using a valid Google Sheets URL."
      });
    }
    const spreadsheetId = match[1];
    const gidMatch = url.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }
  try {
    console.log("Fetching CSV from:", csvUrl);
    const response = await fetch(csvUrl, {
      redirect: "follow",
      headers: {
        "Accept": "text/csv,text/plain,*/*"
      }
    });
    console.log("Response status:", response.status, response.statusText);
    if (!response.ok) {
      if (response.status === 404) {
        return json({
          valid: false,
          error: "Spreadsheet not found. Make sure the URL is correct and the sheet is published."
        });
      }
      if (response.status === 403 || response.status === 401) {
        return json({
          valid: false,
          error: 'Access denied. Make sure the spreadsheet is published to the web or shared as "Anyone with the link can view".'
        });
      }
      return json({
        valid: false,
        error: `Failed to fetch spreadsheet: ${response.status} ${response.statusText}`
      });
    }
    const csvText = await response.text();
    console.log("CSV text length:", csvText.length, "First 200 chars:", csvText.substring(0, 200));
    if (csvText.trim().startsWith("<!DOCTYPE") || csvText.trim().startsWith("<html") || csvText.includes("<title>Sign in")) {
      return json({
        valid: false,
        error: "Access denied. The spreadsheet must be published to the web. Go to File → Share → Publish to web, then use that link."
      });
    }
    const lines = csvText.trim().split("\n");
    if (lines.length < 1) {
      return json({
        valid: false,
        error: "Spreadsheet appears to be empty"
      });
    }
    const columns = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(parseCSVLine(line));
      }
    }
    return json({
      valid: true,
      columns,
      rows,
      totalRows: lines.length - 1
    });
  } catch (err) {
    console.error("Error validating sheets URL:", err);
    return json({
      valid: false,
      error: "Failed to connect to Google Sheets. Please check the URL and try again."
    });
  }
};
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}
export {
  POST
};
