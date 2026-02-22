import { json, error } from "@sveltejs/kit";
import { d as db, a as staffCodes } from "../../../../../../chunks/index3.js";
import { and, eq, isNull } from "drizzle-orm";
import { v as validateSessionToken } from "../../../../../../chunks/auth.js";
async function requireAdmin(cookies) {
  const sessionToken = cookies.get("auth_session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }
  const { user: sessionUser } = await validateSessionToken(sessionToken);
  if (!sessionUser || sessionUser.role !== "admin") {
    throw error(403, "Admin access required");
  }
  return sessionUser;
}
const DELETE = async ({ params, cookies }) => {
  await requireAdmin(cookies);
  try {
    const { id } = params;
    const result = await db.delete(staffCodes).where(and(eq(staffCodes.id, id), isNull(staffCodes.assignedToUserId)));
    return json({ success: true });
  } catch (err) {
    console.error("Failed to delete staff code:", err);
    throw error(500, "Failed to delete staff code");
  }
};
export {
  DELETE
};
