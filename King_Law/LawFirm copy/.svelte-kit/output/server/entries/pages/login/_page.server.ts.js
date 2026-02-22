import { fail, redirect } from "@sveltejs/kit";
import { d as db, u as user } from "../../../chunks/index3.js";
import { b as verifyPassword, g as generateSessionToken, c as createSession, S as SESSION_COOKIE_NAME, d as dev } from "../../../chunks/auth.js";
import { eq } from "drizzle-orm";
const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get("email")?.toString();
    const password = data.get("password")?.toString();
    if (!email || !password) {
      return fail(400, { error: "Email and password are required" });
    }
    const normalizedEmail = email.toLowerCase();
    const existingUser = await db.select().from(user).where(eq(user.email, normalizedEmail)).limit(1);
    if (existingUser.length === 0) {
      return fail(400, { error: "Invalid email or password" });
    }
    const dbUser = existingUser[0];
    const validPassword = await verifyPassword(dbUser.passwordHash, password);
    if (!validPassword) {
      return fail(400, { error: "Invalid email or password" });
    }
    const sessionToken = generateSessionToken();
    await createSession(sessionToken, dbUser.id);
    cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      secure: !dev,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    const redirectPath = dbUser.role === "lawyer" || dbUser.role === "admin" ? "/dashboard/lawyer" : "/dashboard/client";
    redirect(303, redirectPath);
  }
};
export {
  actions
};
