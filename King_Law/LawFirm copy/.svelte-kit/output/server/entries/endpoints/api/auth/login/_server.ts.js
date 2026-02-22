import { error, json } from "@sveltejs/kit";
import { d as db, u as user } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { g as generateSessionToken, c as createSession, S as SESSION_COOKIE_NAME } from "../../../../../chunks/auth.js";
const POST = async ({ request, cookies }) => {
  console.log("\n========== LOGIN ATTEMPT ==========");
  try {
    const { email, password } = await request.json();
    console.log("📧 Login attempt for email:", email);
    if (!email || !password) {
      console.log("❌ Missing email or password");
      throw error(400, "Email and password are required");
    }
    console.log("🔍 Searching for user...");
    let [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (!existingUser) {
      console.log("🔍 Trying lowercase email...");
      [existingUser] = await db.select().from(user).where(eq(user.email, email.toLowerCase())).limit(1);
    }
    if (!existingUser) {
      console.log("❌ User not found for email:", email);
      throw error(400, "Invalid email or password");
    }
    console.log("✅ User found:", { id: existingUser.id, email: existingUser.email, role: existingUser.role });
    console.log("🔐 Verifying password...");
    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
    if (!validPassword) {
      console.log("❌ Password verification failed");
      throw error(400, "Invalid email or password");
    }
    console.log("✅ Password verified");
    console.log("🎫 Creating session...");
    const token = generateSessionToken();
    const session = await createSession(token, existingUser.id);
    console.log("✅ Session created");
    cookies.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      // set to true in production
      maxAge: 60 * 60 * 24 * 30
      // 30 days
    });
    console.log("🍪 Cookie set with name:", SESSION_COOKIE_NAME);
    console.log("========== LOGIN SUCCESS ==========\n");
    return json({
      success: true,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName
      }
    });
  } catch (err) {
    console.error("❌❌❌ LOGIN ERROR ❌❌❌");
    console.error("Error:", err);
    if (err instanceof Response) throw err;
    if (err?.status && err?.body) throw err;
    throw error(500, "Login failed. Please try again.");
  }
};
export {
  POST
};
