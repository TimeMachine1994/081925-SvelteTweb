import { g as goto } from "../../../../chunks/client.js";
import { a as authStore } from "../../../../chunks/auth.svelte.js";
const load = async () => {
  if (typeof window === "undefined") return {};
  await authStore.fetchUser();
  if (!authStore.user) {
    goto();
    return {};
  }
  if (authStore.user.role !== "admin") {
    goto(authStore.dashboardRoute);
    return {};
  }
  return {};
};
export {
  load
};
