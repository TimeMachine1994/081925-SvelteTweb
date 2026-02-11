import { e as escape_html } from "../../../../../chunks/escaping.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { form } = $$props;
    $$renderer2.push(`<h1>Login/Register</h1> <form method="post" action="?/login"><label>Username <input name="username" class="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"/></label> <label>Password <input type="password" name="password" class="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"/></label> <button class="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">Login</button> <button formaction="?/register" class="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">Register</button></form> <p style="color: red">${escape_html(form?.message ?? "")}</p>`);
  });
}
export {
  _page as default
};
