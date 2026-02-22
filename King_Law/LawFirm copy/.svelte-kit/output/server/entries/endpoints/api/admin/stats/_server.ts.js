import { json, error } from "@sveltejs/kit";
import { d as db, u as user, a as staffCodes } from "../../../../../chunks/index3.js";
import { count, isNull } from "drizzle-orm";
import { v as validateSessionToken } from "../../../../../chunks/auth.js";
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
const GET = async ({ cookies }) => {
  await requireAdmin(cookies);
  try {
    const users = await db.select().from(user);
    const totalUsers = users.length;
    const lawyers = users.filter((u) => u.role === "lawyer").length;
    const staff = users.filter((u) => u.role === "staff").length;
    const clients = users.filter((u) => u.role === "client").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const unusedCodesResult = await db.select({ count: count() }).from(staffCodes).where(isNull(staffCodes.assignedToUserId));
    const unusedCodes = unusedCodesResult[0]?.count || 0;
    return json({
      totalUsers,
      lawyers,
      staff,
      clients,
      admins,
      unusedCodes
    });
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    throw error(500, "Failed to fetch stats");
  }
};
export {
  GET
};
