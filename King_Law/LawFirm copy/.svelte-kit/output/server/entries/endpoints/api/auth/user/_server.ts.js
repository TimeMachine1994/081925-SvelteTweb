import { error, json } from "@sveltejs/kit";
const GET = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  return json({ user: locals.user });
};
export {
  GET
};
