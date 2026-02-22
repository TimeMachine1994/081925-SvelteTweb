import { error, json } from "@sveltejs/kit";
import { d as db, u as user } from "../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const GET = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  if (locals.user.role !== "lawyer" && locals.user.role !== "admin") {
    throw error(403, "Forbidden");
  }
  try {
    const role = url.searchParams.get("role");
    let users;
    if (role) {
      users = await db.select({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt
      }).from(user).where(eq(user.role, role));
    } else {
      users = await db.select({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt
      }).from(user);
    }
    return json({ users });
  } catch (err) {
    console.error("Fetch users error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch users");
  }
};
export {
  GET
};
