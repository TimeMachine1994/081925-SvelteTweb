import { error, json } from "@sveltejs/kit";
import { v as validateSessionToken } from "../../../../../chunks/auth.js";
import { d as deleteFile } from "../../../../../chunks/s3.js";
const DELETE = async ({ request, cookies }) => {
  const sessionToken = cookies.get("auth_session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }
  const { user } = await validateSessionToken(sessionToken);
  if (!user) {
    throw error(401, "Invalid session");
  }
  try {
    const { key } = await request.json();
    if (!key) {
      throw error(400, "File key required");
    }
    if (key.startsWith("public/")) {
      if (user.role !== "lawyer" && user.role !== "admin") {
        throw error(403, "Not authorized to delete public files");
      }
    } else if (key.startsWith("private/clients/")) {
      const clientId = key.split("/")[2];
      if (user.role === "client" && clientId !== user.id) {
        throw error(403, "Not authorized to delete this file");
      }
      if (user.role === "staff") {
        throw error(403, "Staff cannot delete files");
      }
    } else if (key.startsWith("private/lawyers/")) {
      const lawyerId = key.split("/")[2];
      if (user.role === "lawyer" && lawyerId !== user.id) {
        throw error(403, "Not authorized to delete this file");
      }
      if (user.role === "client" || user.role === "staff") {
        throw error(403, "Not authorized to delete this file");
      }
    } else if (key.startsWith("private/cases/")) {
      if (user.role !== "lawyer" && user.role !== "admin") {
        throw error(403, "Not authorized to delete case files");
      }
    }
    await deleteFile(key);
    return json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (err) {
    console.error("File delete error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to delete file");
  }
};
export {
  DELETE
};
