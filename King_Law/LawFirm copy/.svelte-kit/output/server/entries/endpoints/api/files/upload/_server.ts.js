import { error, json } from "@sveltejs/kit";
import { v as validateSessionToken } from "../../../../../chunks/auth.js";
import { e as generateUniqueFileName, u as uploadLawyerFile, f as uploadClientFile, h as uploadCaseFile, i as uploadPublicFile } from "../../../../../chunks/s3.js";
const POST = async ({ request, cookies }) => {
  const sessionToken = cookies.get("auth_session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }
  const { user } = await validateSessionToken(sessionToken);
  if (!user) {
    throw error(401, "Invalid session");
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");
    const caseId = formData.get("caseId");
    if (!file) {
      throw error(400, "No file provided");
    }
    if (!folder) {
      throw error(400, "Folder type required");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = generateUniqueFileName(file.name);
    const contentType = file.type || "application/octet-stream";
    let result;
    switch (folder) {
      case "public/images":
      case "public/videos":
      case "public/assets": {
        if (user.role !== "lawyer" && user.role !== "admin") {
          throw error(403, "Not authorized to upload to public folder");
        }
        const folderType = folder.split("/")[1];
        result = await uploadPublicFile(folderType, fileName, buffer, contentType);
        break;
      }
      case "case": {
        if (user.role !== "lawyer" && user.role !== "admin") {
          throw error(403, "Not authorized to upload case files");
        }
        if (!caseId) {
          throw error(400, "Case ID required for case uploads");
        }
        result = await uploadCaseFile(caseId, fileName, buffer, contentType, user.id);
        break;
      }
      case "client": {
        if (user.role !== "client" && user.role !== "admin") {
          throw error(403, "Not authorized");
        }
        result = await uploadClientFile(user.id, fileName, buffer, contentType);
        break;
      }
      case "lawyer": {
        if (user.role !== "lawyer" && user.role !== "admin") {
          throw error(403, "Not authorized");
        }
        result = await uploadLawyerFile(user.id, fileName, buffer, contentType);
        break;
      }
      default:
        throw error(400, "Invalid folder type");
    }
    return json({
      success: true,
      key: result.key,
      url: result.url || null,
      fileName
    });
  } catch (err) {
    console.error("File upload error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to upload file");
  }
};
export {
  POST
};
