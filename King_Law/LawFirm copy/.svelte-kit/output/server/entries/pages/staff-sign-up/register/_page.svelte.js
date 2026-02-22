import { a as attr } from "../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let firstName = "";
    let lastName = "";
    let email = "";
    let phoneNumber = "";
    let password = "";
    let confirmPassword = "";
    let employeeNumber = "";
    let loading = false;
    $$renderer2.push(`<div class="min-h-screen flex items-center justify-center bg-background p-4"><div class="w-full max-w-md"><div class="text-center mb-8"><h1 class="font-title text-4xl mb-2">Staff Registration</h1> <p class="text-muted-foreground">Create your staff account</p></div> <div class="bg-card border border-border rounded-lg p-6 shadow-lg"><form>`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"><label for="employeeNumber" class="block text-sm font-medium mb-2">Employee Number</label> <input type="text" id="employeeNumber"${attr("value", employeeNumber)} required placeholder="e.g., EMP001" class="w-full px-3 py-2 border border-input rounded-md bg-background uppercase"/> <p class="text-xs text-muted-foreground mt-1">Your employee number determines your role. Contact HR if you don't have one.</p></div> <div class="grid grid-cols-2 gap-4 mb-4"><div><label for="firstName" class="block text-sm font-medium mb-2">First Name</label> <input type="text" id="firstName"${attr("value", firstName)} required class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="lastName" class="block text-sm font-medium mb-2">Last Name</label> <input type="text" id="lastName"${attr("value", lastName)} required class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div></div> <div class="mb-4"><label for="email" class="block text-sm font-medium mb-2">Email</label> <input type="email" id="email"${attr("value", email)} required class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div class="mb-4"><label for="phoneNumber" class="block text-sm font-medium mb-2">Phone Number (Optional)</label> <input type="tel" id="phoneNumber"${attr("value", phoneNumber)} class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div class="mb-4"><label for="password" class="block text-sm font-medium mb-2">Password</label> <input type="password" id="password"${attr("value", password)} required minlength="8" class="w-full px-3 py-2 border border-input rounded-md bg-background"/> <p class="text-xs text-muted-foreground mt-1">Minimum 8 characters</p></div> <div class="mb-6"><label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label> <input type="password" id="confirmPassword"${attr("value", confirmPassword)} required class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <button type="submit"${attr("disabled", loading, true)} class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Create Account")}</button> <p class="text-center mt-4 text-sm">Already have an account? <a href="/login" class="text-gold hover:underline">Sign in</a></p></form></div></div></div>`);
  });
}
export {
  _page as default
};
