import { redirect } from "@sveltejs/kit";
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login");
  }
  if (locals.user.role !== "lawyer" && locals.user.role !== "admin") {
    throw redirect(303, "/dashboard/client");
  }
  return {
    user: locals.user
  };
};
export {
  load
};
