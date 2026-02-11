function parseCSV(csvText, columnMapping) {
  const lines = csvText.trim().split("\n");
  const events = [];
  const errors = [];
  if (lines.length < 2) {
    return { events: [], errors: ["CSV must have a header row and at least one data row"] };
  }
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim());
  const headersLower = headers.map((h) => h.toLowerCase());
  const columnMap = {
    date: -1,
    time: -1,
    title: -1,
    description: -1,
    exhibitId: -1,
    mediaUrl: -1,
    category: -1,
    tooltip: -1
  };
  if (columnMapping) {
    if (columnMapping.date) columnMap.date = headers.indexOf(columnMapping.date);
    if (columnMapping.title) columnMap.title = headers.indexOf(columnMapping.title);
    if (columnMapping.description) columnMap.description = headers.indexOf(columnMapping.description);
    if (columnMapping.time) columnMap.time = headers.indexOf(columnMapping.time);
    if (columnMapping.exhibitId) columnMap.exhibitId = headers.indexOf(columnMapping.exhibitId);
    if (columnMapping.mediaUrl) columnMap.mediaUrl = headers.indexOf(columnMapping.mediaUrl);
    if (columnMapping.category) columnMap.category = headers.indexOf(columnMapping.category);
    if (columnMapping.tooltip) columnMap.tooltip = headers.indexOf(columnMapping.tooltip);
  } else {
    columnMap.date = headersLower.indexOf("date");
    columnMap.time = headersLower.indexOf("time");
    columnMap.title = headersLower.indexOf("title");
    columnMap.description = headersLower.indexOf("description");
    columnMap.exhibitId = headersLower.indexOf("exhibit_id");
    columnMap.mediaUrl = headersLower.indexOf("media_url");
    columnMap.category = headersLower.indexOf("category");
    columnMap.tooltip = headersLower.indexOf("tooltip");
  }
  console.log("Column mapping:", columnMapping);
  console.log("Headers:", headers);
  console.log("Resolved columnMap:", columnMap);
  const warnings = [];
  if (columnMap.date === -1) {
    warnings.push("Missing required column mapping: Date. Please remap columns in settings.");
  }
  if (columnMap.title === -1) {
    warnings.push("Missing required column mapping: Title. Please remap columns in settings.");
  }
  if (columnMap.date === -1 || columnMap.title === -1) {
    return {
      events: [],
      errors: warnings,
      needsRemapping: true,
      availableColumns: headers
    };
  }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const dateStr = values[columnMap.date] || "";
    const timeStr = columnMap.time !== -1 ? values[columnMap.time] : void 0;
    const title = values[columnMap.title] || "";
    if (!dateStr || !title) {
      errors.push(`Row ${i + 1}: Missing date or title`);
      continue;
    }
    const parsedDate = parseDate(dateStr, timeStr);
    if (!parsedDate) {
      errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
      continue;
    }
    events.push({
      id: `event-${i}`,
      date: dateStr,
      time: timeStr,
      title,
      description: columnMap.description !== -1 ? values[columnMap.description] : void 0,
      exhibitId: columnMap.exhibitId !== -1 ? values[columnMap.exhibitId] : void 0,
      mediaUrl: columnMap.mediaUrl !== -1 ? values[columnMap.mediaUrl] : void 0,
      category: columnMap.category !== -1 ? values[columnMap.category] : void 0,
      tooltip: columnMap.tooltip !== -1 ? values[columnMap.tooltip] : void 0,
      parsedDate
    });
  }
  events.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  return { events, errors };
}
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
function parseDate(dateStr, timeStr) {
  let date = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    date = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [month, day, year] = dateStr.split("/").map(Number);
    date = new Date(year, month - 1, day);
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
    const [month, day, year] = dateStr.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  if (timeStr) {
    const timeParts = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
      const ampm = timeParts[4];
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      date.setHours(hours, minutes, seconds);
    }
  }
  return date;
}
async function fetchGoogleSheetsCSV(url) {
  let csvUrl = url;
  if (url.includes("docs.google.com/spreadsheets")) {
    if (url.includes("/pub") || url.includes("output=csv") || url.includes("format=csv")) {
      if (url.includes("output=csv") || url.includes("format=csv")) {
        csvUrl = url;
      } else {
        csvUrl = url.includes("?") ? `${url}&output=csv` : `${url}?output=csv`;
      }
    } else {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const spreadsheetId = match[1];
        const gidMatch = url.match(/gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : "0";
        csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
      }
    }
  }
  console.log("Fetching CSV from:", csvUrl);
  const response = await fetch(csvUrl, {
    redirect: "follow",
    headers: {
      "Accept": "text/csv,text/plain,*/*"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error("Access denied. Make sure the spreadsheet is published to the web.");
  }
  return text;
}
export {
  fetchGoogleSheetsCSV as f,
  parseCSV as p
};
