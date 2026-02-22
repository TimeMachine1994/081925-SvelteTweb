import { error, json } from "@sveltejs/kit";
import { v as validateSessionToken } from "../../../../../chunks/auth.js";
import { l as listFiles, a as listLawyerFiles, b as listClientFiles, c as listCaseFiles } from "../../../../../chunks/s3.js";
const GET = async ({ url, cookies }) => {
  const sessionToken = cookies.get("auth_session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }
  const { user } = await validateSessionToken(sessionToken);
  if (!user) {
    throw error(401, "Invalid session");
  }
  try {
    const folder = url.searchParams.get("folder");
    const id = url.searchParams.get("id");
    if (!folder) {
      throw error(400, "Folder type required");
    }
    let files = [];
    switch (folder) {
      case "case": {
        if (user.role === "client") {
          throw error(403, "Not authorized");
        }
        if (!id) {
          throw error(400, "Case ID required");
        }
        files = await listCaseFiles(id);
        break;
      }
      case "client": {
        const clientId = user.role === "client" ? user.id : id;
        if (!clientId) {
          throw error(400, "Client ID required");
        }
        if (user.role === "client" && clientId !== user.id) {
          throw error(403, "Not authorized");
        }
        files = await listClientFiles(clientId);
        break;
      }
      case "lawyer": {
        const lawyerId = user.role === "lawyer" ? user.id : id;
        if (!lawyerId) {
          throw error(400, "Lawyer ID required");
        }
        if (user.role === "lawyer" && lawyerId !== user.id) {
          throw error(403, "Not authorized");
        }
        if (user.role === "client" || user.role === "staff") {
          throw error(403, "Not authorized");
        }
        files = await listLawyerFiles(lawyerId);
        break;
      }
      case "public": {
        const subFolder = url.searchParams.get("subFolder") || "";
        files = await listFiles(`public/${subFolder}`);
        break;
      }
      default:
        throw error(400, "Invalid folder type");
    }
    const formattedFiles = files.map((file) => ({
      key: file.key,
      name: file.key.split("/").pop() || file.key,
      size: file.size,
      lastModified: file.lastModified.toISOString()
    }));
    return json({
      success: true,
      files: formattedFiles
    });
  } catch (err) {
    console.error("File list error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to list files");
  }
};
export {
  GET
};
