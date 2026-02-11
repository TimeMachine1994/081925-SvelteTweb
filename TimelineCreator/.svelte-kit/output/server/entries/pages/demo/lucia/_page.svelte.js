import { e as escape_html } from "../../../../chunks/escaping.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    $$renderer2.push(`<h1>Hi, ${escape_html(data.user.username)}!</h1> <p>Your user ID is ${escape_html(data.user.id)}.</p> <form method="post" action="?/logout"><button>Sign out</button></form>`);
  });
}
export {
  _page as default
};
