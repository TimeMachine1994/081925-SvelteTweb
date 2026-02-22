import { redirect } from "@sveltejs/kit";
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login");
  }
  if (locals.user.role !== "client") {
    throw redirect(303, "/dashboard/lawyer");
  }
  return {
    user: locals.user
  };
};
export {
  load
};
