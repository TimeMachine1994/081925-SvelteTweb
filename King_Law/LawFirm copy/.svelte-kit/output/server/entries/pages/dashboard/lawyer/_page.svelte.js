import { $ as sanitize_props, a0 as spread_props, a1 as slot, Z as store_get, _ as unsubscribe_stores, a4 as ensure_array_like, a3 as stringify } from "../../../../chunks/index2.js";
import { p as page } from "../../../../chunks/stores.js";
import { g as goto } from "../../../../chunks/client.js";
import { a as attr } from "../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import { S as StatCard } from "../../../../chunks/StatCard.js";
import { B as Badge } from "../../../../chunks/Badge.js";
import { E as EmptyState } from "../../../../chunks/EmptyState.js";
import { F as Folder_open, D as Dollar_sign, T as Tabs, C as Clipboard_list } from "../../../../chunks/Tabs.js";
import { L as Layout_dashboard } from "../../../../chunks/layout-dashboard.js";
import { B as Briefcase } from "../../../../chunks/briefcase.js";
import { F as File_text } from "../../../../chunks/file-text.js";
import { R as Receipt } from "../../../../chunks/receipt.js";
import { C as Circle_check_big } from "../../../../chunks/circle-check-big.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { P as Paperclip } from "../../../../chunks/paperclip.js";
import { M as Message_square } from "../../../../chunks/message-square.js";
import { S as Search } from "../../../../chunks/search.js";
function Download($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 15V3" }],
    ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { "d": "m7 10 5 5 5-5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "download" },
    $$sanitized_props,
    {
      /**
       * @component @name Download
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTVWMyIgLz4KICA8cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCIgLz4KICA8cGF0aCBkPSJtNyAxMCA1IDUgNS01IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/download
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
function User_plus($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    ["line", { "x1": "19", "x2": "19", "y1": "8", "y2": "14" }],
    ["line", { "x1": "22", "x2": "16", "y1": "11", "y2": "11" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user-plus" },
    $$sanitized_props,
    {
      /**
       * @component @name UserPlus
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIgLz4KICA8bGluZSB4MT0iMTkiIHgyPSIxOSIgeTE9IjgiIHkyPSIxNCIgLz4KICA8bGluZSB4MT0iMjIiIHgyPSIxNiIgeTE9IjExIiB5Mj0iMTEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/user-plus
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
function X($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M18 6 6 18" }],
    ["path", { "d": "m6 6 12 12" }]
  ];
  Icon($$renderer, spread_props([
    { name: "x" },
    $$sanitized_props,
    {
      /**
       * @component @name X
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTggNiA2IDE4IiAvPgogIDxwYXRoIGQ9Im02IDYgMTIgMTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/x
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
function CreateCaseModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false } = $$props;
    let clients = [];
    let submitting = false;
    let formData = { clientId: "", title: "", description: "", status: "pending" };
    let searchQuery = "";
    let selectedClient = clients.find((c) => c.id === formData.clientId);
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="button" tabindex="-1"><div class="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true"><div class="flex items-center justify-between p-6 border-b border-border"><h2 class="font-title text-2xl">Create New Case</h2> <button class="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Close modal"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <form class="p-6 space-y-6">`);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="client" class="block text-sm font-medium mb-2">Client <span class="text-red-500">*</span></label> `);
      if (selectedClient) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center justify-between p-3 border border-border rounded-md bg-muted"><div><div class="font-medium">${escape_html(selectedClient.firstName)} ${escape_html(selectedClient.lastName)}</div> <div class="text-sm text-muted-foreground">${escape_html(selectedClient.email)}</div></div> <button type="button" class="text-sm text-gold hover:underline">Change</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="relative"><input type="text"${attr("value", searchQuery)} placeholder="Search clients by name or email..." class="w-full px-3 py-2 border border-input rounded-md bg-background"/> `);
        {
          $$renderer2.push("<!--[!-->");
          {
            $$renderer2.push("<!--[!-->");
            {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div><label for="title" class="block text-sm font-medium mb-2">Case Title <span class="text-red-500">*</span></label> <input type="text" id="title"${attr("value", formData.title)} maxlength="100" placeholder="e.g., Personal Injury - Car Accident" required class="w-full px-3 py-2 border border-input rounded-md bg-background"/> <div class="text-xs text-muted-foreground mt-1">${escape_html(formData.title.length)}/100 characters</div></div> <div><label for="description" class="block text-sm font-medium mb-2">Description <span class="text-red-500">*</span></label> <textarea id="description" rows="4" placeholder="Provide details about the case..." required class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none">`);
      const $$body = escape_html(formData.description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> <div class="text-xs text-muted-foreground mt-1">${escape_html(formData.description.length)} characters (minimum 20)</div></div> <div><label for="status" class="block text-sm font-medium mb-2">Initial Status</label> `);
      $$renderer2.select(
        {
          id: "status",
          value: formData.status,
          class: "w-full px-3 py-2 border border-input rounded-md bg-background"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "pending" }, ($$renderer4) => {
            $$renderer4.push(`Pending`);
          });
          $$renderer3.option({ value: "active" }, ($$renderer4) => {
            $$renderer4.push(`Active`);
          });
        }
      );
      $$renderer2.push(`</div> <div class="flex gap-3 justify-end pt-4 border-t border-border"><button type="button"${attr("disabled", submitting, true)} class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50">Cancel</button> <button type="submit"${attr("disabled", true, true)} class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Create Case")}</button></div></form></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    let activeTab = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("tab") || "overview";
    let showCreateCaseModal = false;
    let searchQuery = "";
    let statusFilter = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("status") || "all";
    function navigateToTab(tab, status) {
      const params = new URLSearchParams();
      params.set("tab", tab);
      if (status) params.set("status", status);
      goto(`?${params.toString()}`, {});
      activeTab = tab;
      if (status) statusFilter = status;
    }
    let hiddenClientIds = /* @__PURE__ */ new Set();
    let alertCount = (data.newClients?.filter((c) => !hiddenClientIds.has(c.id))?.length || 0) + (data.uncategorizedThreads?.length || 0);
    const tabDefs = [
      { id: "overview", label: "Overview", icon: Layout_dashboard },
      { id: "cases", label: "Cases", icon: Briefcase },
      { id: "documents", label: "Documents", icon: File_text },
      { id: "invoices", label: "Invoices", icon: Receipt }
    ];
    let tabs = tabDefs.map((t) => {
      if (t.id === "overview" && alertCount > 0) return { ...t, badge: alertCount };
      if (t.id === "cases") return { ...t, badge: data.cases.length || void 0 };
      return t;
    });
    let filteredCases = data.cases.filter(({ case: c, client }) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false) || `${client.firstName} ${client.lastName}`.toLowerCase().includes(q) || client.email.toLowerCase().includes(q);
    });
    let visibleNewClients = data.newClients?.filter((c) => !hiddenClientIds.has(c.id)) || [];
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    function formatCurrency(cents) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    }
    function formatDate(date) {
      const timestamp = typeof date === "number" ? date * 1e3 : date;
      return new Date(timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div><div class="flex justify-between items-center mb-6"><h1 class="font-title text-4xl">Lawyer Dashboard</h1> <button class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors text-sm">+ New Case</button></div> <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">`);
      StatCard($$renderer3, {
        label: "Total Cases",
        value: data.stats.totalCases,
        icon: Folder_open,
        onclick: () => navigateToTab("cases")
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Active Cases",
        value: data.stats.activeCases,
        icon: Circle_check_big,
        iconClass: "text-green-600",
        onclick: () => navigateToTab("cases", "active")
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Documents",
        value: data.stats.totalDocuments,
        icon: File_text,
        onclick: () => navigateToTab("documents")
      });
      $$renderer3.push(`<!----> `);
      StatCard($$renderer3, {
        label: "Total Revenue",
        value: formatCurrency(data.stats.totalRevenue),
        icon: Dollar_sign,
        iconClass: "text-gold",
        onclick: () => navigateToTab("invoices")
      });
      $$renderer3.push(`<!----></div> `);
      Tabs($$renderer3, {
        tabs,
        get activeTab() {
          return activeTab;
        },
        set activeTab($$value) {
          activeTab = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "overview") {
        $$renderer3.push("<!--[-->");
        if (visibleNewClients.length > 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-5 mb-6"><div class="flex items-start gap-3">`);
          User_plus($$renderer3, { class: "w-6 h-6 text-blue-600 shrink-0 mt-0.5" });
          $$renderer3.push(`<!----> <div class="flex-1"><div class="flex justify-between items-center mb-3"><h3 class="font-semibold">New Client Registrations (${escape_html(visibleNewClients.length)})</h3> <button class="text-xs text-blue-600 hover:underline">See All Clients</button></div> <div class="space-y-3"><!--[-->`);
          const each_array = ensure_array_like(visibleNewClients);
          for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
            let client = each_array[$$index_1];
            $$renderer3.push(`<div class="bg-background border border-border rounded-lg p-4"><div class="flex justify-between items-start mb-2"><div><div class="font-semibold">${escape_html(client.firstName)} ${escape_html(client.lastName)}</div> <div class="text-sm text-muted-foreground">${escape_html(client.email)}`);
            if (client.phoneNumber) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`• ${escape_html(client.phoneNumber)}`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="text-xs text-muted-foreground mt-1">Registered: ${escape_html(formatDate(client.createdAt))}</div></div> <div class="flex gap-2 items-center shrink-0"><button class="text-xs text-blue-600 hover:underline">Messages</button> <button class="bg-gold hover:bg-gold-dark text-black px-3 py-1.5 rounded text-xs font-semibold">Create Case</button> <button class="text-gray-400 hover:text-red-500 p-1" title="Hide">`);
            X($$renderer3, { class: "w-4 h-4" });
            $$renderer3.push(`<!----></button></div></div> `);
            if (client.files && client.files.length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="mt-2 pt-2 border-t border-border"><div class="text-xs font-medium mb-1 flex items-center gap-1">`);
              Paperclip($$renderer3, { class: "w-3 h-3" });
              $$renderer3.push(`<!----> Files (${escape_html(client.files.length)})</div> <div class="space-y-1"><!--[-->`);
              const each_array_1 = ensure_array_like(client.files);
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let file = each_array_1[$$index];
                $$renderer3.push(`<div class="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5"><span class="truncate flex-1">${escape_html(file.name)}</span> <span class="text-muted-foreground ml-2">${escape_html(formatFileSize(file.size))}</span> <a${attr("href", `/api/files/download?key=${stringify(encodeURIComponent(file.key))}`)} class="text-gold hover:underline ml-2 inline-flex items-center gap-1">`);
                Download($$renderer3, { class: "w-3 h-3" });
                $$renderer3.push(`<!----></a></div>`);
              }
              $$renderer3.push(`<!--]--></div></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div>`);
          }
          $$renderer3.push(`<!--]--></div></div></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.uncategorizedThreads && data.uncategorizedThreads.length > 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-5 mb-6"><div class="flex items-start gap-3">`);
          Message_square($$renderer3, { class: "w-6 h-6 text-yellow-600 shrink-0 mt-0.5" });
          $$renderer3.push(`<!----> <div class="flex-1"><h3 class="font-semibold mb-3">Uncategorized Messages</h3> <div class="space-y-2"><!--[-->`);
          const each_array_2 = ensure_array_like(data.uncategorizedThreads);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let thread = each_array_2[$$index_2];
            $$renderer3.push(`<div class="bg-background border border-border rounded-lg p-3"><div class="flex justify-between items-center mb-1"><div><span class="font-medium text-sm">${escape_html(thread.client.firstName)} ${escape_html(thread.client.lastName)}</span> <span class="text-xs text-muted-foreground ml-2">${escape_html(thread.messages.length)} msg${escape_html(thread.messages.length !== 1 ? "s" : "")}</span></div> <div class="flex gap-2"><button class="text-xs text-blue-600 hover:underline">View</button> <button class="text-xs bg-gold hover:bg-gold-dark text-black px-2 py-1 rounded font-semibold">Create Case</button></div></div> <p class="text-xs text-muted-foreground italic bg-muted/50 rounded p-2 mt-1 line-clamp-2">"${escape_html(thread.messages[thread.messages.length - 1]?.content?.slice(0, 120))}${escape_html((thread.messages[thread.messages.length - 1]?.content?.length || 0) > 120 ? "..." : "")}"</p></div>`);
          }
          $$renderer3.push(`<!--]--></div></div></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (visibleNewClients.length === 0 && (!data.uncategorizedThreads || data.uncategorizedThreads.length === 0)) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="bg-background border border-border rounded-lg p-8 text-center">`);
          Circle_check_big($$renderer3, { class: "w-10 h-10 text-green-500 mx-auto mb-3" });
          $$renderer3.push(`<!----> <h3 class="font-semibold text-lg mb-1">All caught up!</h3> <p class="text-sm text-muted-foreground">No pending client registrations or uncategorized messages.</p></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
        if (activeTab === "cases") {
          $$renderer3.push("<!--[-->");
          if (data.cases.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="flex flex-col sm:flex-row gap-3 mb-4"><div class="flex-1 relative"><input type="text"${attr("value", searchQuery)} placeholder="Search cases..." class="w-full px-4 py-2 pl-10 border border-input rounded-md bg-background text-sm"/> `);
            Search($$renderer3, {
              class: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            });
            $$renderer3.push(`<!----></div> `);
            $$renderer3.select(
              {
                value: statusFilter,
                class: "px-3 py-2 border border-input rounded-md bg-background text-sm"
              },
              ($$renderer4) => {
                $$renderer4.option({ value: "all" }, ($$renderer5) => {
                  $$renderer5.push(`All Statuses`);
                });
                $$renderer4.option({ value: "active" }, ($$renderer5) => {
                  $$renderer5.push(`Active`);
                });
                $$renderer4.option({ value: "pending" }, ($$renderer5) => {
                  $$renderer5.push(`Pending`);
                });
                $$renderer4.option({ value: "closed" }, ($$renderer5) => {
                  $$renderer5.push(`Closed`);
                });
              }
            );
            $$renderer3.push(`</div> `);
            if (filteredCases.length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<p class="text-xs text-muted-foreground mb-3">Showing ${escape_html(filteredCases.length)} of ${escape_html(data.cases.length)} case${escape_html(data.cases.length !== 1 ? "s" : "")}</p> <div class="grid md:grid-cols-2 gap-4"><!--[-->`);
              const each_array_3 = ensure_array_like(filteredCases);
              for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                let { case: caseItem, client } = each_array_3[$$index_3];
                $$renderer3.push(`<a${attr("href", `/dashboard/lawyer/case/${stringify(caseItem.id)}`)} class="bg-background border border-border rounded-lg p-5 hover:border-gold transition-all hover:shadow-lg group"><div class="flex justify-between items-start mb-2"><h3 class="font-semibold group-hover:text-gold transition-colors">${escape_html(caseItem.title)}</h3> `);
                Badge($$renderer3, { variant: caseItem.status });
                $$renderer3.push(`<!----></div> <div class="text-sm text-muted-foreground mb-2">${escape_html(client.firstName)} ${escape_html(client.lastName)}</div> `);
                if (caseItem.description) {
                  $$renderer3.push("<!--[-->");
                  $$renderer3.push(`<p class="text-xs text-muted-foreground mb-3 line-clamp-2">${escape_html(caseItem.description)}</p>`);
                } else {
                  $$renderer3.push("<!--[!-->");
                }
                $$renderer3.push(`<!--]--> <div class="text-xs text-muted-foreground">Updated: ${escape_html(formatDate(caseItem.updatedAt))}</div></a>`);
              }
              $$renderer3.push(`<!--]--></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<div class="bg-background border border-border rounded-lg p-8 text-center"><p class="text-muted-foreground">No cases match your search.</p> <button class="text-gold hover:underline text-sm mt-2">Clear filters</button></div>`);
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            EmptyState($$renderer3, {
              icon: Clipboard_list,
              title: "No Cases Yet",
              description: "Create your first case to get started."
            });
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
          if (activeTab === "documents") {
            $$renderer3.push("<!--[-->");
            if (data.documents.length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto"><table class="w-full"><thead class="bg-muted"><tr><th class="text-left px-4 py-3 text-sm font-semibold">File</th><th class="text-left px-4 py-3 text-sm font-semibold hidden md:table-cell">Client</th><th class="text-left px-4 py-3 text-sm font-semibold hidden lg:table-cell">Case</th><th class="text-left px-4 py-3 text-sm font-semibold hidden sm:table-cell">Size</th><th class="text-left px-4 py-3 text-sm font-semibold hidden sm:table-cell">Uploaded</th><th class="text-right px-4 py-3 text-sm font-semibold">Actions</th></tr></thead><tbody><!--[-->`);
              const each_array_4 = ensure_array_like(data.documents);
              for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
                let doc = each_array_4[$$index_4];
                $$renderer3.push(`<tr class="border-t border-border hover:bg-muted/50 transition-colors"><td class="px-4 py-3 font-medium text-sm">${escape_html(doc.fileName)}</td><td class="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">${escape_html(doc.uploaderFirstName || "")} ${escape_html(doc.uploaderLastName || "")}</td><td class="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">${escape_html(doc.caseTitle || "N/A")}</td><td class="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">${escape_html((doc.fileSize / 1024).toFixed(1))} KB</td><td class="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">${escape_html(formatDate(doc.uploadedAt))}</td><td class="px-4 py-3 text-right"><a${attr("href", `/api/documents/${stringify(doc.id)}`)} class="text-gold hover:underline text-sm inline-flex items-center gap-1">`);
                Download($$renderer3, { class: "w-3.5 h-3.5" });
                $$renderer3.push(`<!----> Download</a></td></tr>`);
              }
              $$renderer3.push(`<!--]--></tbody></table></div> <div class="mt-3 text-right"><a href="/dashboard/lawyer/documents" class="text-sm text-gold hover:underline">View all documents →</a></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              EmptyState($$renderer3, {
                icon: File_text,
                title: "No Documents Yet",
                description: "Documents uploaded to cases will appear here."
              });
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            if (activeTab === "invoices") {
              $$renderer3.push("<!--[-->");
              if (data.invoices.length > 0) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<div class="bg-background border border-border rounded-lg overflow-hidden"><table class="w-full"><thead class="bg-muted"><tr><th class="text-left px-6 py-3 text-sm font-semibold">Description</th><th class="text-left px-6 py-3 text-sm font-semibold">Amount</th><th class="text-left px-6 py-3 text-sm font-semibold hidden sm:table-cell">Due Date</th><th class="text-left px-6 py-3 text-sm font-semibold">Status</th></tr></thead><tbody><!--[-->`);
                const each_array_5 = ensure_array_like(data.invoices);
                for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
                  let invoice = each_array_5[$$index_5];
                  $$renderer3.push(`<tr class="border-t border-border hover:bg-muted/50 transition-colors"><td class="px-6 py-4 text-sm">${escape_html(invoice.description)}</td><td class="px-6 py-4 font-semibold text-sm">${escape_html(formatCurrency(invoice.amount))}</td><td class="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">${escape_html(formatDate(invoice.dueDate))}</td><td class="px-6 py-4">`);
                  Badge($$renderer3, {
                    variant: invoice.status === "paid" ? "paid" : invoice.status === "partial" ? "partial" : "unpaid"
                  });
                  $$renderer3.push(`<!----></td></tr>`);
                }
                $$renderer3.push(`<!--]--></tbody></table></div>`);
              } else {
                $$renderer3.push("<!--[!-->");
                EmptyState($$renderer3, {
                  icon: Receipt,
                  title: "No Invoices Yet",
                  description: "Invoices created for cases will appear here."
                });
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div> `);
      CreateCaseModal($$renderer3, {
        get open() {
          return showCreateCaseModal;
        },
        set open($$value) {
          showCreateCaseModal = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
