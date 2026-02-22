import { error, json } from "@sveltejs/kit";
import { d as db, a as staffCodes, u as user } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { a as generateId, g as generateSessionToken, c as createSession, S as SESSION_COOKIE_NAME } from "../../../../../chunks/auth.js";
const POST = async ({ request, cookies }) => {
  try {
    const staffVerified = cookies.get("staff_verified");
    if (staffVerified !== "true") {
      throw error(401, "Staff verification required. Please enter the staff password first.");
    }
    const { email, password, firstName, lastName, phoneNumber, employeeNumber } = await request.json();
    if (!email || !password || !firstName || !lastName || !employeeNumber) {
      throw error(400, "Required fields are missing");
    }
    if (password.length < 8) {
      throw error(400, "Password must be at least 8 characters");
    }
    const codeResults = await db.select().from(staffCodes).where(eq(staffCodes.employeeNumber, employeeNumber.toUpperCase())).limit(1);
    if (codeResults.length === 0) {
      throw error(400, "Invalid employee number. Please contact your administrator.");
    }
    const staffCode = codeResults[0];
    if (staffCode.assignedToUserId) {
      throw error(400, "This employee number has already been used.");
    }
    const existingUsers = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUsers.length > 0) {
      throw error(400, "Username or email already exists");
    }
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
    const userId = generateId();
    const [newUser] = await db.insert(user).values({
      id: userId,
      email,
      passwordHash,
      role: staffCode.role,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null
    }).returning();
    await db.update(staffCodes).set({
      assignedToUserId: userId,
      usedAt: Math.floor(Date.now() / 1e3)
    }).where(eq(staffCodes.id, staffCode.id));
    const token = generateSessionToken();
    await createSession(token, userId);
    cookies.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      // set to true in production
      maxAge: 60 * 60 * 24 * 30
      // 30 days
    });
    cookies.delete("staff_verified", { path: "/" });
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
    console.error("Staff registration error:", err);
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
