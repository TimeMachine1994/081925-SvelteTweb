import { a4 as ensure_array_like, a3 as stringify } from "../../../../chunks/index2.js";
import { c as casesStore, m as messagesStore } from "../../../../chunks/messages.svelte.js";
import { d as documentsStore } from "../../../../chunks/documents.svelte.js";
import { i as invoicesStore } from "../../../../chunks/invoices.svelte.js";
import { S as StatCard } from "../../../../chunks/StatCard.js";
import { B as Badge } from "../../../../chunks/Badge.js";
import { E as EmptyState } from "../../../../chunks/EmptyState.js";
import { F as Folder_open, D as Dollar_sign, T as Tabs, C as Clipboard_list } from "../../../../chunks/Tabs.js";
import { B as Briefcase } from "../../../../chunks/briefcase.js";
import { R as Receipt } from "../../../../chunks/receipt.js";
import { M as Message_square } from "../../../../chunks/message-square.js";
import { F as File_text } from "../../../../chunks/file-text.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import { a as attr } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeCases = casesStore.cases.filter((c) => c.case.status === "active").length;
    let documentsCount = documentsStore.documents.length;
    let unreadMessages = messagesStore.unreadCounts.total;
    let activeTab = "cases";
    const tabs = [
      {
        id: "cases",
        label: "My Cases",
        icon: Briefcase,
        badge: void 0
      },
      { id: "invoices", label: "Invoices", icon: Receipt }
    ];
    let dynamicTabs = tabs.map((t) => t.id === "cases" ? { ...t, badge: casesStore.cases.length || void 0 } : t);
    function formatCurrency(cents) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    }
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div><h1 class="font-title text-4xl mb-8">Client Dashboard</h1> `);
      if (casesStore.error || messagesStore.error || documentsStore.error || invoicesStore.error) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-center"><p class="text-red-800 dark:text-red-200 font-medium">${escape_html(casesStore.error || messagesStore.error || documentsStore.error || invoicesStore.error)}</p> <button class="mt-2 text-sm text-gold hover:underline">Try again</button></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="grid md:grid-cols-4 gap-6 mb-8">`);
      StatCard($$renderer3, {
        label: "Active Cases",
        value: activeCases,
        icon: Folder_open,
        onclick: () => activeTab = "cases"
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Unpaid Invoices",
        value: formatCurrency(invoicesStore.invoices.filter((i) => i.invoice.status !== "paid").reduce((sum, i) => sum + (i.invoice.amount - (i.invoice.paidAmount || 0)), 0)),
        icon: Dollar_sign,
        iconClass: "text-gold",
        href: "/dashboard/client/invoices"
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Unread Messages",
        value: unreadMessages,
        icon: Message_square
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Documents",
        value: documentsCount,
        icon: File_text,
        href: "/dashboard/client/documents"
      });
      $$renderer3.push(`<!----></div> `);
      Tabs($$renderer3, {
        tabs: dynamicTabs,
        get activeTab() {
          return activeTab;
        },
        set activeTab($$value) {
          activeTab = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "cases") {
        $$renderer3.push("<!--[-->");
        if (casesStore.cases.length > 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="grid md:grid-cols-2 gap-4"><!--[-->`);
          const each_array = ensure_array_like(casesStore.cases);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let caseItem = each_array[$$index];
            $$renderer3.push(`<a${attr("href", `/dashboard/client/case/${stringify(caseItem.case.id)}`)} class="bg-background border border-border rounded-lg p-6 hover:border-gold transition-all hover:shadow-lg group"><div class="flex justify-between items-start mb-2"><h3 class="font-semibold text-lg group-hover:text-gold transition-colors">${escape_html(caseItem.case.title)}</h3> `);
            Badge($$renderer3, { variant: caseItem.case.status });
            $$renderer3.push(`<!----></div> `);
            if (caseItem.case.description) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<p class="text-sm text-muted-foreground mb-4 line-clamp-2">${escape_html(caseItem.case.description)}</p>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> <div class="text-xs text-muted-foreground">Updated: ${escape_html(formatDate(caseItem.case.updatedAt))}</div></a>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          EmptyState($$renderer3, {
            icon: Clipboard_list,
            title: "No Active Cases",
            description: "You don't have any cases yet. Contact us to get started.",
            actionLabel: "Contact Us",
            actionHref: "/contact"
          });
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
        if (activeTab === "invoices") {
          $$renderer3.push("<!--[-->");
          if (invoicesStore.invoices.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="bg-background border border-border rounded-lg overflow-hidden"><table class="w-full"><thead class="bg-muted"><tr><th class="text-left px-6 py-3 text-sm font-semibold">Description</th><th class="text-left px-6 py-3 text-sm font-semibold">Amount</th><th class="text-left px-6 py-3 text-sm font-semibold hidden sm:table-cell">Due Date</th><th class="text-left px-6 py-3 text-sm font-semibold">Status</th><th class="text-right px-6 py-3 text-sm font-semibold">Actions</th></tr></thead><tbody><!--[-->`);
            const each_array_1 = ensure_array_like(invoicesStore.invoices);
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let { invoice } = each_array_1[$$index_1];
              $$renderer3.push(`<tr class="border-t border-border hover:bg-muted/50"><td class="px-6 py-4">${escape_html(invoice.description)}</td><td class="px-6 py-4 font-semibold">${escape_html(formatCurrency(invoice.amount))}</td><td class="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">${escape_html(formatDate(invoice.dueDate))}</td><td class="px-6 py-4">`);
              Badge($$renderer3, {
                variant: invoice.status === "paid" ? "paid" : invoice.status === "partial" ? "partial" : "unpaid"
              });
              $$renderer3.push(`<!----></td><td class="px-6 py-4 text-right">`);
              if (invoice.status !== "paid") {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<a${attr("href", `/dashboard/client/invoices/${stringify(invoice.id)}/pay`)} class="text-gold hover:underline text-sm">Pay Now</a>`);
              } else {
                $$renderer3.push("<!--[!-->");
              }
              $$renderer3.push(`<!--]--></td></tr>`);
            }
            $$renderer3.push(`<!--]--></tbody></table></div>`);
          } else {
            $$renderer3.push("<!--[!-->");
            EmptyState($$renderer3, {
              icon: Receipt,
              title: "No Invoices",
              description: "No invoices have been created yet."
            });
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
