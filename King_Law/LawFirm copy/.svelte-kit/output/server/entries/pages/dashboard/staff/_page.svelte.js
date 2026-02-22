import { e as escape_html } from "../../../../chunks/escaping.js";
import "clsx";
import { a as authStore } from "../../../../chunks/auth.svelte.js";
import { S as StatCard } from "../../../../chunks/StatCard.js";
import { B as Briefcase } from "../../../../chunks/briefcase.js";
import { C as Circle_check_big } from "../../../../chunks/circle-check-big.js";
import { $ as sanitize_props, a0 as spread_props, a1 as slot } from "../../../../chunks/index2.js";
import { I as Icon } from "../../../../chunks/Icon.js";
function Info($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "M12 16v-4" }],
    ["path", { "d": "M12 8h.01" }]
  ];
  Icon($$renderer, spread_props([
    { name: "info" },
    $$sanitized_props,
    {
      /**
       * @component @name Info
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTIgMTZ2LTQiIC8+CiAgPHBhdGggZD0iTTEyIDhoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/info
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
function Shield_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "shield-check" },
    $$sanitized_props,
    {
      /**
       * @component @name ShieldCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTNjMCA1LTMuNSA3LjUtNy42NiA4Ljk1YTEgMSAwIDAgMS0uNjctLjAxQzcuNSAyMC41IDQgMTggNCAxM1Y2YTEgMSAwIDAgMSAxLTFjMiAwIDQuNS0xLjIgNi4yNC0yLjcyYTEuMTcgMS4xNyAwIDAgMSAxLjUyIDBDMTQuNTEgMy44MSAxNyA1IDE5IDVhMSAxIDAgMCAxIDEgMXoiIC8+CiAgPHBhdGggZD0ibTkgMTIgMiAyIDQtNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/shield-check
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
    let assignedCases = [];
    const activeCases = assignedCases.filter((c) => c.status === "active");
    $$renderer2.push(`<div><div class="mb-8"><h1 class="text-3xl font-title">Welcome, ${escape_html(authStore.user?.firstName)}!</h1> <p class="text-muted-foreground mt-1">Staff Dashboard</p></div> <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">`);
    StatCard($$renderer2, {
      label: "Assigned Cases",
      value: assignedCases.length,
      icon: Briefcase
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Active Cases",
      value: activeCases.length,
      icon: Circle_check_big,
      iconClass: "text-green-600"
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Your Role",
      value: "Staff",
      icon: Shield_check,
      iconClass: "text-purple-600"
    });
    $$renderer2.push(`<!----></div> <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 flex items-start gap-3">`);
    Info($$renderer2, { class: "w-5 h-5 text-blue-600 shrink-0 mt-0.5" });
    $$renderer2.push(`<!----> <div><h3 class="font-medium text-blue-800 dark:text-blue-200 text-sm">Read-Only Access</h3> <p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">You can view case details, documents, and messages for assigned cases. Contact an attorney to make changes.</p></div></div> <h2 class="font-title text-xl mb-4">Assigned Cases</h2> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-8 text-center text-muted-foreground"><div class="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div> Loading cases...</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
