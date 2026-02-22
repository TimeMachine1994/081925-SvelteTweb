import { $ as sanitize_props, a0 as spread_props, a1 as slot, a9 as head, a4 as ensure_array_like, a3 as stringify } from "../../../../../chunks/index2.js";
import { i as invoicesStore } from "../../../../../chunks/invoices.svelte.js";
import { B as Badge } from "../../../../../chunks/Badge.js";
import { E as EmptyState } from "../../../../../chunks/EmptyState.js";
import { A as Arrow_left } from "../../../../../chunks/arrow-left.js";
import { R as Receipt } from "../../../../../chunks/receipt.js";
import { I as Icon } from "../../../../../chunks/Icon.js";
import { C as Circle_check_big } from "../../../../../chunks/circle-check-big.js";
import { e as escape_html } from "../../../../../chunks/escaping.js";
import { a as attr } from "../../../../../chunks/attributes.js";
function Circle_alert($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "12" }],
    [
      "line",
      { "x1": "12", "x2": "12.01", "y1": "16", "y2": "16" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjgiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMi4wMSIgeTE9IjE2IiB5Mj0iMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-alert
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Clock($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 6v6l4 2" }],
    ["circle", { "cx": "12", "cy": "12", "r": "10" }]
  ];
  Icon($$renderer, spread_props([
    { name: "clock" },
    $$sanitized_props,
    {
      /**
       * @component @name Clock
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgNnY2bDQgMiIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/clock
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Credit_card($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "rect",
      { "width": "20", "height": "14", "x": "2", "y": "5", "rx": "2" }
    ],
    ["line", { "x1": "2", "x2": "22", "y1": "10", "y2": "10" }]
  ];
  Icon($$renderer, spread_props([
    { name: "credit-card" },
    $$sanitized_props,
    {
      /**
       * @component @name CreditCard
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHg9IjIiIHk9IjUiIHJ4PSIyIiAvPgogIDxsaW5lIHgxPSIyIiB4Mj0iMjIiIHkxPSIxMCIgeTI9IjEwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/credit-card
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function formatCurrency(cents) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    }
    function formatDate(timestamp) {
      const date = typeof timestamp === "number" ? new Date(timestamp * 1e3) : new Date(timestamp);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    function remainingBalance(invoice) {
      return invoice.amount - (invoice.paidAmount || 0);
    }
    function isOverdue(invoice) {
      if (invoice.status === "paid") return false;
      const dueDate = typeof invoice.dueDate === "number" ? invoice.dueDate * 1e3 : new Date(invoice.dueDate).getTime();
      return dueDate < Date.now();
    }
    let unpaidInvoices = invoicesStore.invoices.filter((i) => i.invoice.status !== "paid");
    let paidInvoices = invoicesStore.invoices.filter((i) => i.invoice.status === "paid");
    let totalOwed = unpaidInvoices.reduce((sum, i) => sum + remainingBalance(i.invoice), 0);
    head("1bfmb9c", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>My Invoices | King Law</title>`);
      });
    });
    $$renderer2.push(`<div><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"><div><a href="/dashboard/client" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors mb-2">`);
    Arrow_left($$renderer2, { class: "w-4 h-4" });
    $$renderer2.push(`<!----> Back to Dashboard</a> <h1 class="font-title text-4xl">My Invoices</h1></div> `);
    if (totalOwed > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-king-blue text-white rounded-xl px-6 py-4 text-center sm:text-right"><p class="text-white/60 text-xs uppercase tracking-wider mb-1">Total Balance Due</p> <p class="text-2xl font-bold text-gold">${escape_html(formatCurrency(totalOwed))}</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (invoicesStore.loading) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center justify-center py-16"><svg class="w-8 h-8 animate-spin text-gold" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (invoicesStore.error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center"><p class="text-red-800 dark:text-red-200 font-medium">${escape_html(invoicesStore.error)}</p> <button class="mt-2 text-sm text-gold hover:underline">Try again</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (invoicesStore.invoices.length === 0) {
          $$renderer2.push("<!--[-->");
          EmptyState($$renderer2, {
            icon: Receipt,
            title: "No Invoices",
            description: "You don't have any invoices yet. Invoices will appear here when your attorney creates them."
          });
        } else {
          $$renderer2.push("<!--[!-->");
          if (unpaidInvoices.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="mb-8"><h2 class="font-title text-2xl mb-4 flex items-center gap-2">`);
            Circle_alert($$renderer2, { class: "w-5 h-5 text-gold" });
            $$renderer2.push(`<!----> Outstanding Invoices</h2> <div class="space-y-4"><!--[-->`);
            const each_array = ensure_array_like(unpaidInvoices);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let { invoice, case: caseInfo } = each_array[$$index];
              $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-6 hover:border-gold transition-all"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-3 mb-2"><h3 class="font-semibold text-lg truncate">${escape_html(invoice.description)}</h3> `);
              Badge($$renderer2, { variant: invoice.status === "partial" ? "partial" : "unpaid" });
              $$renderer2.push(`<!----> `);
              if (isOverdue(invoice)) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div> `);
              if (caseInfo) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<p class="text-sm text-muted-foreground mb-2">Case: ${escape_html(caseInfo.title)}</p>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm"><span class="text-muted-foreground">`);
              Clock($$renderer2, { class: "w-3.5 h-3.5 inline -mt-0.5 mr-1" });
              $$renderer2.push(`<!----> Due: ${escape_html(formatDate(invoice.dueDate))}</span> <span>Total: <strong>${escape_html(formatCurrency(invoice.amount))}</strong></span> `);
              if (invoice.paidAmount > 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<span class="text-green-600">Paid: ${escape_html(formatCurrency(invoice.paidAmount))}</span>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <span class="text-king-blue font-semibold">Remaining: ${escape_html(formatCurrency(remainingBalance(invoice)))}</span></div></div> <div class="flex items-center gap-3 shrink-0"><a${attr("href", `/dashboard/client/invoices/${stringify(invoice.id)}/pay`)} class="inline-flex items-center gap-2 bg-king-blue hover:bg-king-blue-light text-white font-semibold px-6 py-3 rounded-lg transition-all hover:shadow-lg">`);
              Credit_card($$renderer2, { class: "w-4 h-4" });
              $$renderer2.push(`<!----> Pay Bill</a></div></div></div>`);
            }
            $$renderer2.push(`<!--]--></div></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (paidInvoices.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div><h2 class="font-title text-2xl mb-4 flex items-center gap-2">`);
            Circle_check_big($$renderer2, { class: "w-5 h-5 text-green-600" });
            $$renderer2.push(`<!----> Paid Invoices</h2> <div class="space-y-3"><!--[-->`);
            const each_array_1 = ensure_array_like(paidInvoices);
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let { invoice, case: caseInfo } = each_array_1[$$index_1];
              $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-5 opacity-80"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div class="min-w-0"><div class="flex items-center gap-3 mb-1"><h3 class="font-semibold truncate">${escape_html(invoice.description)}</h3> `);
              Badge($$renderer2, { variant: "paid" });
              $$renderer2.push(`<!----></div> `);
              if (caseInfo) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<p class="text-sm text-muted-foreground">Case: ${escape_html(caseInfo.title)}</p>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div> <div class="text-right shrink-0"><p class="font-semibold">${escape_html(formatCurrency(invoice.amount))}</p> `);
              if (invoice.paidAt) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<p class="text-xs text-muted-foreground">Paid ${escape_html(formatDate(invoice.paidAt))}</p>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div></div></div>`);
            }
            $$renderer2.push(`<!--]--></div></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
