import { json } from "@sveltejs/kit";
import { i as invalidateSession, S as SESSION_COOKIE_NAME } from "../../../../../chunks/auth.js";
const POST = async ({ locals, cookies }) => {
  if (!locals.session) {
    return json({ success: false });
  }
  await invalidateSession(locals.session.id);
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  return json({ success: true });
};
export {
  POST
};
