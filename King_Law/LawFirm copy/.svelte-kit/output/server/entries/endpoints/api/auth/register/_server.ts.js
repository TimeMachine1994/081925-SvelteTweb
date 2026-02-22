import { error, json } from "@sveltejs/kit";
import { d as db, u as user } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { a as generateId, g as generateSessionToken, c as createSession, S as SESSION_COOKIE_NAME } from "../../../../../chunks/auth.js";
const POST = async ({ request, cookies }) => {
  console.log("\n========== API REGISTRATION REQUEST ==========");
  try {
    const body = await request.json();
    console.log("📥 Request body received:", {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      role: body.role,
      hasPassword: !!body.password
    });
    const { email, password, firstName, lastName, phoneNumber, role, accessCode } = body;
    if (!email || !password || !firstName || !lastName) {
      console.log("❌ Missing required fields");
      throw error(400, "Required fields are missing");
    }
    console.log("✅ Required fields present");
    if (password.length < 8) {
      console.log("❌ Password too short");
      throw error(400, "Password must be at least 8 characters");
    }
    console.log("✅ Password length OK");
    if (role && role !== "client") {
      console.log("❌ Non-client role attempted via client registration");
      throw error(400, "Staff must register via /staff-sign-up");
    }
    console.log("✅ Role check passed");
    console.log("🔍 Checking if email exists:", email);
    const existingUsers = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUsers.length > 0) {
      console.log("❌ Email already exists");
      throw error(400, "Email already exists");
    }
    console.log("✅ Email is available");
    console.log("🔐 Hashing password...");
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
    console.log("✅ Password hashed");
    const userId = generateId();
    console.log("🆔 Generated user ID:", userId);
    console.log("💾 Inserting user into database...");
    const insertData = {
      id: userId,
      email,
      passwordHash,
      role: role || "client",
      firstName,
      lastName,
      phoneNumber: phoneNumber || null
    };
    console.log("📝 Insert data:", { ...insertData, passwordHash: "[REDACTED]" });
    let newUser;
    try {
      const result = await db.insert(user).values(insertData).returning();
      newUser = result[0];
      console.log("✅ User inserted:", { id: newUser.id, email: newUser.email });
    } catch (dbError) {
      console.error("❌ DATABASE INSERT ERROR:", dbError);
      throw dbError;
    }
    console.log("🎫 Creating session...");
    let session;
    try {
      const token = generateSessionToken();
      session = await createSession(token, userId);
      console.log("✅ Session created:", session.id.substring(0, 10) + "...");
      cookies.set(SESSION_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        // set to true in production
        maxAge: 60 * 60 * 24 * 30
        // 30 days
      });
      console.log("🍪 Session cookie set with name:", SESSION_COOKIE_NAME);
    } catch (sessionError) {
      console.error("❌ SESSION CREATION ERROR:", sessionError);
      throw sessionError;
    }
    console.log("========== REGISTRATION SUCCESS ==========\n");
    return json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (err) {
    console.error("❌❌❌ REGISTRATION ERROR ❌❌❌");
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", err instanceof Error ? err.message : String(err));
    console.error("Error details:", err);
    if (err instanceof Error && err.stack) {
      console.error("Stack trace:", err.stack);
    }
    if (err instanceof Response) throw err;
    if (err?.status && err?.body) throw err;
    const errMsg = err?.message || String(err);
    if (errMsg.includes("UNIQUE constraint failed") && errMsg.includes("email")) {
      throw error(400, "An account with this email already exists");
    }
    if (errMsg.includes("UNIQUE constraint failed")) {
      throw error(400, "An account with this information already exists");
    }
    throw error(500, "Registration failed. Please try again later.");
  }
};
export {
  POST
};
