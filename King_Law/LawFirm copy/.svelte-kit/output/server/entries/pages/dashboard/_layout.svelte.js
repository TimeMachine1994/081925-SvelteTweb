import "clsx";
import { $ as sanitize_props, a0 as spread_props, a1 as slot, a2 as attr_class, a3 as stringify, a4 as ensure_array_like, Z as store_get, _ as unsubscribe_stores } from "../../../chunks/index2.js";
import { p as page } from "../../../chunks/stores.js";
import { L as Layout_dashboard } from "../../../chunks/layout-dashboard.js";
import { U as Users, K as Key_round, S as Settings, C as Chevron_right } from "../../../chunks/users.js";
import { R as Receipt } from "../../../chunks/receipt.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import { S as Search } from "../../../chunks/search.js";
import { g as goto } from "../../../chunks/client.js";
import { o as onDestroy, t as tick } from "../../../chunks/index-server.js";
import { F as File_text } from "../../../chunks/file-text.js";
import { a as authStore } from "../../../chunks/auth.svelte.js";
function createThemeStore() {
  let mode = "system";
  function getSystemPreference() {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(m) {
    if (typeof document === "undefined") return;
    const resolved = m === "system" ? getSystemPreference() : m;
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
  function init() {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme");
    if (stored && ["light", "dark", "system"].includes(stored)) {
      mode = stored;
    }
    applyTheme(mode);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (mode === "system") {
        applyTheme("system");
      }
    });
  }
  function setMode(m) {
    mode = m;
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", m);
    }
    applyTheme(m);
  }
  function toggle() {
    const resolved = mode === "system" ? getSystemPreference() : mode;
    setMode(resolved === "dark" ? "light" : "dark");
  }
  return {
    get mode() {
      return mode;
    },
    get isDark() {
      if (typeof window === "undefined") return false;
      return mode === "dark" || mode === "system" && getSystemPreference() === "dark";
    },
    init,
    setMode,
    toggle
  };
}
const themeStore = createThemeStore();
function Bell($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }],
    [
      "path",
      {
        "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "bell" },
    $$sanitized_props,
    {
      /**
       * @component @name Bell
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuMjY4IDIxYTIgMiAwIDAgMCAzLjQ2NCAwIiAvPgogIDxwYXRoIGQ9Ik0zLjI2MiAxNS4zMjZBMSAxIDAgMCAwIDQgMTdoMTZhMSAxIDAgMCAwIC43NC0xLjY3M0MxOS40MSAxMy45NTYgMTggMTIuNDk5IDE4IDhBNiA2IDAgMCAwIDYgOGMwIDQuNDk5LTEuNDExIDUuOTU2LTIuNzM4IDcuMzI2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/bell
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
function Chevron_left($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "m15 18-6-6 6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTgtNi02IDYtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-left
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
function Log_out($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m16 17 5-5-5-5" }],
    ["path", { "d": "M21 12H9" }],
    ["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "log-out" },
    $$sanitized_props,
    {
      /**
       * @component @name LogOut
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMTcgNS01LTUtNSIgLz4KICA8cGF0aCBkPSJNMjEgMTJIOSIgLz4KICA8cGF0aCBkPSJNOSAyMUg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/log-out
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
function Menu($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M4 5h16" }],
    ["path", { "d": "M4 12h16" }],
    ["path", { "d": "M4 19h16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "menu" },
    $$sanitized_props,
    {
      /**
       * @component @name Menu
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCA1aDE2IiAvPgogIDxwYXRoIGQ9Ik00IDEyaDE2IiAvPgogIDxwYXRoIGQ9Ik00IDE5aDE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/menu
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
function Moon($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "moon" },
    $$sanitized_props,
    {
      /**
       * @component @name Moon
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAuOTg1IDEyLjQ4NmE5IDkgMCAxIDEtOS40NzMtOS40NzJjLjQwNS0uMDIyLjYxNy40Ni40MDIuODAzYTYgNiAwIDAgMCA4LjI2OCA4LjI2OGMuMzQ0LS4yMTUuODI1LS4wMDQuODAzLjQwMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/moon
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
function Sun($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "4" }],
    ["path", { "d": "M12 2v2" }],
    ["path", { "d": "M12 20v2" }],
    ["path", { "d": "m4.93 4.93 1.41 1.41" }],
    ["path", { "d": "m17.66 17.66 1.41 1.41" }],
    ["path", { "d": "M2 12h2" }],
    ["path", { "d": "M20 12h2" }],
    ["path", { "d": "m6.34 17.66-1.41 1.41" }],
    ["path", { "d": "m19.07 4.93-1.41 1.41" }]
  ];
  Icon($$renderer, spread_props([
    { name: "sun" },
    $$sanitized_props,
    {
      /**
       * @component @name Sun
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiAvPgogIDxwYXRoIGQ9Ik0xMiAydjIiIC8+CiAgPHBhdGggZD0iTTEyIDIwdjIiIC8+CiAgPHBhdGggZD0ibTQuOTMgNC45MyAxLjQxIDEuNDEiIC8+CiAgPHBhdGggZD0ibTE3LjY2IDE3LjY2IDEuNDEgMS40MSIgLz4KICA8cGF0aCBkPSJNMiAxMmgyIiAvPgogIDxwYXRoIGQ9Ik0yMCAxMmgyIiAvPgogIDxwYXRoIGQ9Im02LjM0IDE3LjY2LTEuNDEgMS40MSIgLz4KICA8cGF0aCBkPSJtMTkuMDcgNC45My0xLjQxIDEuNDEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/sun
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
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { user, collapsed = false } = $$props;
    const navItems = {
      client: [
        {
          icon: Layout_dashboard,
          label: "Dashboard",
          href: "/dashboard/client"
        },
        {
          icon: Receipt,
          label: "Invoices",
          href: "/dashboard/client/invoices"
        }
      ],
      lawyer: [
        {
          icon: Layout_dashboard,
          label: "Dashboard",
          href: "/dashboard/lawyer"
        }
      ],
      staff: [
        {
          icon: Layout_dashboard,
          label: "Dashboard",
          href: "/dashboard/staff"
        }
      ],
      admin: [
        {
          icon: Layout_dashboard,
          label: "Dashboard",
          href: "/dashboard/admin"
        },
        { icon: Users, label: "Users", href: "/dashboard/admin/users" },
        {
          icon: Key_round,
          label: "Staff Codes",
          href: "/dashboard/admin/staff-codes"
        },
        {
          icon: Settings,
          label: "Settings",
          href: "/dashboard/admin/settings"
        }
      ]
    };
    let items = navItems[user?.role] || [];
    function isActive(href) {
      const current = store_get($$store_subs ??= {}, "$page", page).url.pathname;
      if (href === `/dashboard/${user?.role}`) {
        return current === href;
      }
      return current.startsWith(href);
    }
    const roleBadgeColors = {
      client: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      lawyer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      staff: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
      admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
    };
    $$renderer2.push(`<aside${attr_class(`flex flex-col h-full bg-king-blue text-white transition-all duration-300 ${stringify(collapsed ? "w-16" : "w-60")}`)}><div class="flex items-center justify-between px-3 h-16 border-b border-white/10 shrink-0">`);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a${attr("href", `/dashboard/${stringify(user?.role)}`)} class="flex items-center gap-2"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-8 w-auto"/></a>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<a${attr("href", `/dashboard/${stringify(user?.role)}`)} class="mx-auto"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-8 w-auto"/></a>`);
    }
    $$renderer2.push(`<!--]--> <button class="p-1 rounded hover:bg-white/10 transition-colors hidden lg:block"${attr("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar")}>`);
    if (collapsed) {
      $$renderer2.push("<!--[-->");
      Chevron_right($$renderer2, { class: "w-4 h-4" });
    } else {
      $$renderer2.push("<!--[!-->");
      Chevron_left($$renderer2, { class: "w-4 h-4" });
    }
    $$renderer2.push(`<!--]--></button></div> <nav class="flex-1 overflow-y-auto py-4 px-2"><ul class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(items);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      const active = isActive(item.href);
      $$renderer2.push(`<li><a${attr("href", item.href)}${attr_class(`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${stringify(active ? "bg-gold text-king-blue" : "text-white/70 hover:bg-white/10 hover:text-white")}`)}${attr("aria-label", collapsed ? item.label : void 0)}${attr("title", collapsed ? item.label : void 0)}><!---->`);
      item.icon($$renderer2, { class: "w-5 h-5 shrink-0" });
      $$renderer2.push(`<!----> `);
      if (!collapsed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span>${escape_html(item.label)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></a></li>`);
    }
    $$renderer2.push(`<!--]--></ul></nav> <div class="border-t border-white/10 px-3 py-4 shrink-0">`);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a href="/dashboard/profile" class="flex items-center gap-3 mb-3 px-2 py-2 -mx-1 rounded-md hover:bg-white/10 transition-colors"><div class="w-8 h-8 rounded-full bg-gold text-king-blue flex items-center justify-center text-sm font-bold shrink-0">${escape_html(user?.firstName?.[0])}${escape_html(user?.lastName?.[0])}</div> <div class="min-w-0"><p class="text-sm font-medium truncate">${escape_html(user?.firstName)} ${escape_html(user?.lastName)}</p> <span${attr_class(`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${stringify(roleBadgeColors[user?.role] || "")}`)}>${escape_html(user?.role)}</span></div></a>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<a href="/dashboard/profile" class="flex justify-center mb-3"${attr("title", `${stringify(user?.firstName)} ${stringify(user?.lastName)} — View Profile`)}><div class="w-8 h-8 rounded-full bg-gold text-king-blue flex items-center justify-center text-sm font-bold hover:ring-2 hover:ring-gold/50 transition-all">${escape_html(user?.firstName?.[0])}${escape_html(user?.lastName?.[0])}</div></a>`);
    }
    $$renderer2.push(`<!--]--> <button class="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors" aria-label="Logout">`);
    Log_out($$renderer2, { class: "w-5 h-5 shrink-0" });
    $$renderer2.push(`<!----> `);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span>Logout</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button></div></aside>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const segmentLabels = {
  dashboard: "Dashboard",
  client: "Client",
  lawyer: "Lawyer",
  admin: "Admin",
  staff: "Staff",
  cases: "Cases",
  case: "Case",
  documents: "Documents",
  invoices: "Invoices",
  messages: "Messages",
  settings: "Settings",
  users: "Users",
  "staff-codes": "Staff Codes",
  "audit-log": "Audit Log",
  "pay-bill": "Pay Bill"
};
function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [];
  if (segments[0] !== "dashboard") return [];
  const role = segments[1];
  if (!role) return [];
  crumbs.push({
    label: "Dashboard",
    href: `/dashboard/${role}`
  });
  for (let i = 2; i < segments.length; i++) {
    const segment = segments[i];
    const href = "/" + segments.slice(0, i + 1).join("/");
    if (segment.length > 8 && !segmentLabels[segment]) {
      const parentLabel = segmentLabels[segments[i - 1]] || segments[i - 1];
      crumbs.push({
        label: `${parentLabel} Detail`,
        href
      });
    } else {
      crumbs.push({
        label: segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href
      });
    }
  }
  return crumbs;
}
function createNotificationsStore() {
  let notifications = [];
  let loading = false;
  function addNotification(n) {
    notifications = [
      {
        ...n,
        id: crypto.randomUUID(),
        read: false,
        createdAt: /* @__PURE__ */ new Date()
      },
      ...notifications
    ];
  }
  function markAsRead(id) {
    notifications = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
  }
  function markAllAsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
  }
  function dismiss(id) {
    notifications = notifications.filter((n) => n.id !== id);
  }
  function clearAll() {
    notifications = [];
  }
  return {
    get notifications() {
      return notifications;
    },
    get unreadCount() {
      return notifications.filter((n) => !n.read).length;
    },
    get loading() {
      return loading;
    },
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll
  };
}
const notificationsStore = createNotificationsStore();
function TopBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { user } = $$props;
    let breadcrumbs = getBreadcrumbs(store_get($$store_subs ??= {}, "$page", page).url.pathname);
    const roleBadgeColors = {
      client: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      lawyer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      staff: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
      admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
    };
    $$renderer2.push(`<header class="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0"><div class="flex items-center gap-3"><button class="p-2 rounded-md hover:bg-muted transition-colors lg:hidden" aria-label="Toggle sidebar">`);
    Menu($$renderer2, { class: "w-5 h-5 text-foreground" });
    $$renderer2.push(`<!----></button> <nav aria-label="Breadcrumb" class="hidden sm:flex items-center gap-1 text-sm"><!--[-->`);
    const each_array = ensure_array_like(breadcrumbs);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let crumb = each_array[i];
      if (i > 0) {
        $$renderer2.push("<!--[-->");
        Chevron_right($$renderer2, { class: "w-3.5 h-3.5 text-muted-foreground" });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (i === breadcrumbs.length - 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-foreground font-medium">${escape_html(crumb.label)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<a${attr("href", crumb.href)} class="text-muted-foreground hover:text-foreground transition-colors">${escape_html(crumb.label)}</a>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></nav></div> <div class="flex items-center gap-2"><button class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors border border-border" aria-label="Search">`);
    Search($$renderer2, { class: "w-4 h-4" });
    $$renderer2.push(`<!----> <span class="hidden md:inline">Search...</span> <kbd class="hidden md:inline text-[10px] px-1.5 py-0.5 bg-background rounded border border-border font-mono">⌘K</kbd></button> <button class="p-2 rounded-md hover:bg-muted transition-colors" aria-label="Toggle dark mode">`);
    if (themeStore.isDark) {
      $$renderer2.push("<!--[-->");
      Sun($$renderer2, { class: "w-5 h-5 text-muted-foreground" });
    } else {
      $$renderer2.push("<!--[!-->");
      Moon($$renderer2, { class: "w-5 h-5 text-muted-foreground" });
    }
    $$renderer2.push(`<!--]--></button> <div class="relative notification-container"><button class="p-2 rounded-md hover:bg-muted transition-colors relative" aria-label="Notifications">`);
    Bell($$renderer2, { class: "w-5 h-5 text-muted-foreground" });
    $$renderer2.push(`<!----> `);
    if (notificationsStore.unreadCount > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="relative user-menu-container"><button class="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="User menu"><div class="w-8 h-8 rounded-full bg-king-blue text-white flex items-center justify-center text-xs font-bold">${escape_html(user?.firstName?.[0])}${escape_html(user?.lastName?.[0])}</div> <span class="hidden md:block text-sm font-medium text-foreground">${escape_html(user?.firstName)}</span> <span${attr_class(`hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${stringify(roleBadgeColors[user?.role] || "")}`)}>${escape_html(user?.role)}</span></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></header>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function CommandBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user, onLogout } = $$props;
    let open = false;
    let query = "";
    let selectedIndex = 0;
    let inputEl;
    let commands = buildCommands();
    function buildCommands() {
      const role = user?.role || "client";
      const items = [];
      if (role === "client") {
        items.push(
          {
            id: "nav-dash",
            icon: Layout_dashboard,
            label: "Dashboard",
            description: "Go to client dashboard",
            action: () => navigate(),
            keywords: ["home", "overview"]
          },
          {
            id: "nav-docs",
            icon: File_text,
            label: "Documents",
            description: "View your documents",
            action: () => navigate(),
            keywords: ["files", "uploads"]
          },
          {
            id: "nav-invoices",
            icon: Receipt,
            label: "Invoices",
            description: "View and pay invoices",
            action: () => navigate(),
            keywords: ["payment", "invoice", "bill", "pay"]
          }
        );
      } else if (role === "lawyer") {
        items.push(
          {
            id: "nav-dash",
            icon: Layout_dashboard,
            label: "Dashboard",
            description: "Go to lawyer dashboard",
            action: () => navigate(),
            keywords: ["home", "overview"]
          },
          {
            id: "nav-docs",
            icon: File_text,
            label: "All Documents",
            description: "Browse all documents",
            action: () => navigate(),
            keywords: ["files", "uploads"]
          }
        );
      } else if (role === "admin") {
        items.push(
          {
            id: "nav-dash",
            icon: Layout_dashboard,
            label: "Dashboard",
            description: "Admin overview",
            action: () => navigate(),
            keywords: ["home", "overview"]
          },
          {
            id: "nav-users",
            icon: Users,
            label: "Manage Users",
            description: "View all user accounts",
            action: () => navigate(),
            keywords: ["accounts", "people"]
          },
          {
            id: "nav-codes",
            icon: Key_round,
            label: "Staff Codes",
            description: "Manage registration codes",
            action: () => navigate(),
            keywords: ["employee", "registration"]
          },
          {
            id: "nav-settings",
            icon: Settings,
            label: "Settings",
            description: "System configuration",
            action: () => navigate(),
            keywords: ["config", "password"]
          }
        );
      } else if (role === "staff") {
        items.push({
          id: "nav-dash",
          icon: Layout_dashboard,
          label: "Dashboard",
          description: "Staff dashboard",
          action: () => navigate(),
          keywords: ["home", "overview"]
        });
      }
      items.push({
        id: "theme-toggle",
        icon: themeStore.isDark ? Sun : Moon,
        label: themeStore.isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
        description: "Toggle theme",
        action: () => {
          themeStore.toggle();
          close();
        },
        keywords: ["dark", "light", "theme", "mode"]
      });
      items.push({
        id: "logout",
        icon: Log_out,
        label: "Sign Out",
        description: "Log out of your account",
        action: () => {
          close();
          onLogout();
        },
        keywords: ["logout", "exit", "signout"]
      });
      return items;
    }
    let filteredCommands = () => {
      if (!query.trim()) return commands;
      const q = query.toLowerCase();
      return commands.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.description?.toLowerCase().includes(q) || cmd.keywords?.some((k) => k.includes(q)));
    };
    function navigate(href) {
      close();
      goto();
    }
    function close() {
      open = false;
      query = "";
      selectedIndex = 0;
    }
    function handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open = !open;
        if (open) {
          tick().then(() => inputEl?.focus());
        }
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
        return;
      }
      if (!open) return;
      const items = filteredCommands();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        scrollToSelected();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      }
    }
    function scrollToSelected() {
      tick().then(() => {
      });
    }
    onDestroy(() => {
      document.removeEventListener("keydown", handleKeydown);
    });
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]"><button class="absolute inset-0" aria-label="Close command bar" tabindex="-1"></button> <div class="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" role="dialog" aria-modal="true" aria-label="Command bar"><div class="flex items-center gap-3 px-4 py-3 border-b border-border">`);
      Search($$renderer2, { class: "w-5 h-5 text-muted-foreground shrink-0" });
      $$renderer2.push(`<!----> <input${attr("value", query)} type="text" placeholder="Type a command or search..." class="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm" autocomplete="off"/> <kbd class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">ESC</kbd></div> <div class="max-h-72 overflow-y-auto py-2">`);
      if (filteredCommands().length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(filteredCommands());
        for (let i = 0, $$length = each_array.length; i < $$length; i++) {
          let cmd = each_array[i];
          $$renderer2.push(`<button${attr("data-index", i)}${attr_class(`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors ${stringify(i === selectedIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50")}`)}><!---->`);
          cmd.icon($$renderer2, { class: "w-4 h-4 shrink-0" });
          $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><span class="font-medium text-foreground">${escape_html(cmd.label)}</span> `);
          if (cmd.description) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="ml-2 text-xs text-muted-foreground">${escape_html(cmd.description)}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div> `);
          if (i === selectedIndex) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<kbd class="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">↵</kbd>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></button>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="px-4 py-8 text-center text-sm text-muted-foreground">No results for "${escape_html(query)}"</div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground"><div class="flex items-center gap-3"><span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate</span> <span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">↵</kbd> select</span> <span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">esc</kbd> close</span></div></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function AppShell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    let sidebarCollapsed = false;
    async function handleLogout() {
      await authStore.logout();
      window.location.href = "/login";
    }
    $$renderer2.push(`<div class="flex h-screen overflow-hidden bg-muted"><div class="hidden lg:flex shrink-0">`);
    Sidebar($$renderer2, {
      user: authStore.user,
      collapsed: sidebarCollapsed
    });
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex flex-col flex-1 min-w-0 overflow-hidden">`);
    TopBar($$renderer2, {
      user: authStore.user
    });
    $$renderer2.push(`<!----> <main id="main-content" class="flex-1 overflow-y-auto p-4 lg:p-6">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main></div> `);
    CommandBar($$renderer2, { user: authStore.user, onLogout: handleLogout });
    $$renderer2.push(`<!----></div>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    if (authStore.user) {
      $$renderer2.push("<!--[-->");
      AppShell($$renderer2, {
        children: ($$renderer3) => {
          children($$renderer3);
          $$renderer3.push(`<!---->`);
        }
      });
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex h-screen items-center justify-center bg-muted"><div class="text-muted-foreground">Loading...</div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _layout as default
};
