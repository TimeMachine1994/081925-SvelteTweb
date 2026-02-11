import { a as sessionCookieName, v as validateSessionToken, s as setSessionTokenCookie, d as deleteSessionTokenCookie } from "../chunks/auth.js";
import "../chunks/index3.js";
const handleAuth = async ({ event, resolve }) => {
  let sessionToken = event.cookies.get(sessionCookieName);
  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }
  const { session, user: user$1 } = await validateSessionToken(sessionToken);
  if (session) {
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    deleteSessionTokenCookie(event);
  }
  event.locals.user = user$1;
  event.locals.session = session;
  return resolve(event);
};
const handle = handleAuth;
export {
  handle
};
