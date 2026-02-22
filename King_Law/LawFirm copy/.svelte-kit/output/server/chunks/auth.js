import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { d as db, g as session, u as user } from "./index3.js";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { verify, hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { D as DEV } from "./false.js";
const dev = DEV;
const adapter = new DrizzleSQLiteAdapter(db, session, user);
new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      role: attributes.role,
      phoneNumber: attributes.phoneNumber
    };
  }
});
function generateId(length = 15) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}
function generateSessionToken() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}
async function createSession(token, userId) {
  console.log("📝 createSession called for userId:", userId);
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  console.log("Generated sessionId:", sessionId.substring(0, 10) + "...");
  const sessionData = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1e3 * 60 * 60 * 24 * 30)
    // 30 days
  };
  console.log("Session expires at:", sessionData.expiresAt.toISOString());
  await db.insert(session).values(sessionData);
  console.log("✅ Session inserted into database");
  return sessionData;
}
async function validateSessionToken(token) {
  console.log("🔍 validateSessionToken called");
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  console.log("Looking for sessionId:", sessionId.substring(0, 10) + "...");
  const result = await db.select({ user, session }).from(session).innerJoin(user, eq(session.userId, user.id)).where(eq(session.id, sessionId));
  if (result.length < 1) {
    console.log("❌ No session found in database");
    return { session: null, user: null };
  }
  console.log("✅ Session found in database");
  const { user: dbUser, session: dbSession } = result[0];
  console.log("Session user:", { id: dbUser.id, email: dbUser.email, role: dbUser.role });
  console.log("Session expires:", new Date(dbSession.expiresAt).toISOString());
  const expiresAt = new Date(dbSession.expiresAt);
  if (Date.now() >= expiresAt.getTime()) {
    console.log("❌ Session expired, deleting...");
    await db.delete(session).where(eq(session.id, sessionId));
    return { session: null, user: null };
  }
  console.log("✅ Session is valid");
  if (Date.now() >= expiresAt.getTime() - 1e3 * 60 * 60 * 24 * 15) {
    console.log("🔄 Extending session expiration...");
    dbSession.expiresAt = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 30);
    await db.update(session).set({ expiresAt: dbSession.expiresAt }).where(eq(session.id, sessionId));
    console.log("✅ Session extended to:", dbSession.expiresAt.toISOString());
  }
  return { session: dbSession, user: dbUser };
}
async function invalidateSession(sessionId) {
  console.log("🗑️ Invalidating session:", sessionId.substring(0, 10) + "...");
  await db.delete(session).where(eq(session.id, sessionId));
  console.log("✅ Session deleted");
}
async function hashPassword(password) {
  console.log("🔐 Hashing password with Argon2...");
  const hashed = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });
  console.log("✅ Password hash generated");
  return hashed;
}
async function verifyPassword(hash2, password) {
  console.log("🔍 Verifying password against hash...");
  const isValid = await verify(hash2, password);
  console.log("Password verification result:", isValid ? "✅ MATCH" : "❌ NO MATCH");
  return isValid;
}
const SESSION_COOKIE_NAME = "auth_session";
export {
  SESSION_COOKIE_NAME as S,
  generateId as a,
  verifyPassword as b,
  createSession as c,
  dev as d,
  generateSessionToken as g,
  hashPassword as h,
  invalidateSession as i,
  validateSessionToken as v
};
