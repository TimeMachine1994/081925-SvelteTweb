import { redirect } from "@sveltejs/kit";
import { i as invalidateSession, S as SESSION_COOKIE_NAME } from "../../../chunks/auth.js";
async function handleLogout(locals, cookies) {
  if (locals.session) {
    await invalidateSession(locals.session.id);
  }
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  throw redirect(303, "/");
}
const POST = async ({ locals, cookies }) => {
  return handleLogout(locals, cookies);
};
const GET = async ({ locals, cookies }) => {
  return handleLogout(locals, cookies);
};
export {
  GET,
  POST
};
