import { json } from "@sveltejs/kit";
import { d as db, u as user } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const GET = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = locals.user.role;
  if (userRole !== "lawyer" && userRole !== "admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }
  const staffUsers = await db.select({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  }).from(user).where(eq(user.role, "staff")).all();
  return json({ staff: staffUsers });
};
export {
  GET
};
