import { error, json } from "@sveltejs/kit";
import { v as validateSessionToken } from "../../../../../chunks/auth.js";
import { g as getPresignedDownloadUrl } from "../../../../../chunks/s3.js";
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
    const { key } = await request.json();
    if (!key) {
      throw error(400, "File key required");
    }
    const isPrivate = key.startsWith("private/");
    if (isPrivate) {
      if (key.startsWith("private/clients/")) {
        const clientId = key.split("/")[2];
        if (user.role === "client" && clientId !== user.id) {
          throw error(403, "Not authorized to access this file");
        }
        if (user.role === "staff") {
        }
      } else if (key.startsWith("private/lawyers/")) {
        const lawyerId = key.split("/")[2];
        if (user.role === "lawyer" && lawyerId !== user.id) {
          throw error(403, "Not authorized to access this file");
        }
        if (user.role === "client" || user.role === "staff") {
          throw error(403, "Not authorized to access this file");
        }
      } else if (key.startsWith("private/cases/")) {
        if (user.role === "client") {
          throw error(403, "Please access case files through your case dashboard");
        }
      }
    }
    const url = await getPresignedDownloadUrl(key, 3600);
    return json({
      success: true,
      url,
      expiresIn: 3600
    });
  } catch (err) {
    console.error("File download error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to generate download URL");
  }
};
export {
  POST
};
