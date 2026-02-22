import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let password = "";
    let loading = false;
    $$renderer2.push(`<div class="min-h-screen flex items-center justify-center bg-background p-4"><div class="w-full max-w-md"><div class="text-center mb-8"><h1 class="font-title text-4xl mb-2">Staff Sign Up</h1> <p class="text-muted-foreground">Enter the staff access password to continue</p></div> <div class="bg-card border border-border rounded-lg p-6 shadow-lg"><form>`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-6"><label for="password" class="block text-sm font-medium mb-2">Staff Password</label> <input type="password" id="password"${attr("value", password)} required placeholder="Enter staff access password" class="w-full px-3 py-2 border border-input rounded-md bg-background"/> <p class="text-xs text-muted-foreground mt-1">Contact your administrator if you don't have the password</p></div> <button type="submit"${attr("disabled", loading, true)} class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Continue")}</button> <p class="text-center mt-4 text-sm">Are you a client? <a href="/register" class="text-gold hover:underline">Register here</a></p></form></div></div></div>`);
  });
}
export {
  _page as default
};
