import { a as attr } from "../../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let newPassword = "";
    let confirmPassword = "";
    let loading = false;
    $$renderer2.push(`<div><div class="mb-8"><h1 class="text-3xl font-title">Settings</h1> <p class="text-muted-foreground mt-1">Configure system settings</p></div> <div class="bg-card border border-border rounded-lg p-6 max-w-xl"><h2 class="text-lg font-semibold mb-4">Staff Sign-Up Password</h2> <p class="text-sm text-muted-foreground mb-4">This password is required for staff members to access the registration page at /staff-sign-up</p> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="space-y-4"><div><label for="newPassword" class="block text-sm font-medium mb-2">New Password</label> <input type="password" id="newPassword"${attr("value", newPassword)} class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label> <input type="password" id="confirmPassword"${attr("value", confirmPassword)} class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <button${attr("disabled", loading, true)} class="bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50">${escape_html("Update Password")}</button></div></div></div>`);
  });
}
export {
  _page as default
};
