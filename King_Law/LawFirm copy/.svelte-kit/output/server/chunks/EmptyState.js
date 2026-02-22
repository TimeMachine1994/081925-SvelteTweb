import { a as attr } from "./attributes.js";
import { e as escape_html } from "./escaping.js";
function EmptyState($$renderer, $$props) {
  let { icon: Icon, title, description, actionLabel, actionHref } = $$props;
  $$renderer.push(`<div class="bg-background border border-border rounded-lg p-8 text-center">`);
  if (Icon) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<!---->`);
    Icon($$renderer, { class: "w-12 h-12 mb-4 text-muted-foreground mx-auto" });
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> <h3 class="font-semibold text-lg mb-2">${escape_html(title)}</h3> `);
  if (description) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<p class="text-muted-foreground mb-4">${escape_html(description)}</p>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> `);
  if (actionLabel && actionHref) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<a${attr("href", actionHref)} class="inline-block bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors">${escape_html(actionLabel)}</a>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
export {
  EmptyState as E
};
