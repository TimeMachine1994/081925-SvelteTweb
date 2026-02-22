import { S as SESSION_COOKIE_NAME, v as validateSessionToken } from "./auth.js";
const handle = async ({ event, resolve }) => {
  console.log("\n🌐 [HOOKS] Request to:", event.url.pathname);
  const token = event.cookies.get(SESSION_COOKIE_NAME);
  if (!token) {
    console.log("🔓 [HOOKS] No session cookie found - user is not authenticated");
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }
  console.log("🍪 [HOOKS] Session cookie found:", token.substring(0, 10) + "...");
  const { session, user } = await validateSessionToken(token);
  if (user) {
    console.log("✅ [HOOKS] User authenticated:", { username: user.username, role: user.role });
  } else {
    console.log("❌ [HOOKS] Session validation failed - no user found");
  }
  event.locals.session = session;
  event.locals.user = user;
  return resolve(event);
};
export {
  handle
};
