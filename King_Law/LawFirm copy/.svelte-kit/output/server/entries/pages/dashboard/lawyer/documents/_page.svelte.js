import { a as attr } from "../../../../../chunks/attributes.js";
import { T as Toast, S as Skeleton } from "../../../../../chunks/Skeleton.js";
import { S as Search } from "../../../../../chunks/search.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let searchQuery = "";
    Toast($$renderer2);
    $$renderer2.push(`<!----> <div><div class="mb-6"><a href="/dashboard/lawyer" class="text-gold hover:underline text-sm">← Back to Dashboard</a></div> <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"><h1 class="font-title text-4xl">All Documents</h1> <div class="relative w-full sm:w-64">`);
    Search($$renderer2, {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
    });
    $$renderer2.push(`<!----> <input type="text"${attr("value", searchQuery)} placeholder="Search documents..." class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"/></div></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-4">`);
      Skeleton($$renderer2, { class: "h-12 w-full" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { class: "h-12 w-full" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { class: "h-12 w-full" });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
