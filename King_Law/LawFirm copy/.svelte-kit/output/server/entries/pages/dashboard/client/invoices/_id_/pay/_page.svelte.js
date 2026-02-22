import { Z as store_get, a9 as head, _ as unsubscribe_stores } from "../../../../../../../chunks/index2.js";
import { p as page } from "../../../../../../../chunks/stores.js";
import { A as Arrow_left } from "../../../../../../../chunks/arrow-left.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    store_get($$store_subs ??= {}, "$page", page).params.id;
    head("g5adwb", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Pay Invoice | King Law</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-5xl mx-auto"><a href="/dashboard/client/invoices" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">`);
    Arrow_left($$renderer2, { class: "w-4 h-4" });
    $$renderer2.push(`<!----> Back to Invoices</a> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center justify-center py-24"><svg class="w-8 h-8 animate-spin text-gold" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
