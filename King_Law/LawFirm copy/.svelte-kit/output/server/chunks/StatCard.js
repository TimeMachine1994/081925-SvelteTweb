import { a2 as attr_class, a3 as stringify } from "./index2.js";
import { a as attr } from "./attributes.js";
import { e as escape_html } from "./escaping.js";
function StatCard($$renderer, $$props) {
  let {
    label,
    value,
    icon: Icon,
    href,
    onclick,
    iconClass = "text-muted-foreground"
  } = $$props;
  const interactiveClass = "hover:border-gold hover:shadow-md transition-all cursor-pointer";
  if (href) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<a${attr("href", href)}${attr_class(`bg-background border border-border rounded-lg p-6 ${stringify(interactiveClass)} block`)}>`);
    if (Icon) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<!---->`);
      Icon($$renderer, { class: `w-8 h-8 mb-2 ${stringify(iconClass)}` });
      $$renderer.push(`<!---->`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--> <div class="text-2xl font-bold">${escape_html(value)}</div> <div class="text-sm text-muted-foreground">${escape_html(label)}</div></a>`);
  } else {
    $$renderer.push("<!--[!-->");
    if (onclick) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<button${attr_class(`bg-background border border-border rounded-lg p-6 ${stringify(interactiveClass)} block w-full text-left`)}>`);
      if (Icon) {
        $$renderer.push("<!--[-->");
        $$renderer.push(`<!---->`);
        Icon($$renderer, { class: `w-8 h-8 mb-2 ${stringify(iconClass)}` });
        $$renderer.push(`<!---->`);
      } else {
        $$renderer.push("<!--[!-->");
      }
      $$renderer.push(`<!--]--> <div class="text-2xl font-bold">${escape_html(value)}</div> <div class="text-sm text-muted-foreground">${escape_html(label)}</div></button>`);
    } else {
      $$renderer.push("<!--[!-->");
      $$renderer.push(`<div class="bg-background border border-border rounded-lg p-6">`);
      if (Icon) {
        $$renderer.push("<!--[-->");
        $$renderer.push(`<!---->`);
        Icon($$renderer, { class: `w-8 h-8 mb-2 ${stringify(iconClass)}` });
        $$renderer.push(`<!---->`);
      } else {
        $$renderer.push("<!--[!-->");
      }
      $$renderer.push(`<!--]--> <div class="text-2xl font-bold">${escape_html(value)}</div> <div class="text-sm text-muted-foreground">${escape_html(label)}</div></div>`);
    }
    $$renderer.push(`<!--]-->`);
  }
  $$renderer.push(`<!--]-->`);
}
export {
  StatCard as S
};
