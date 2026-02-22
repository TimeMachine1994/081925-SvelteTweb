import { error, json } from "@sveltejs/kit";
import { d as db, s as systemSettings } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
const POST = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();
    if (!password) {
      throw error(400, "Password is required");
    }
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.key, "staff_signup_password")).limit(1);
    if (settings.length === 0) {
      console.error("Staff signup password not configured");
      throw error(500, "Staff registration is not configured. Please contact an administrator.");
    }
    const storedHash = settings[0].value;
    const isValid = await verify(storedHash, password);
    if (!isValid) {
      throw error(401, "Invalid staff password");
    }
    cookies.set("staff_verified", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 30
      // 30 minutes
    });
    return json({ success: true });
  } catch (err) {
    console.error("Staff password verification error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to verify password");
  }
};
export {
  POST
};
