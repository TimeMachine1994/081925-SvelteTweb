import "clsx";
import { S as StatCard } from "../../../../chunks/StatCard.js";
import { U as Users, K as Key_round, C as Chevron_right, S as Settings } from "../../../../chunks/users.js";
import { $ as sanitize_props, a0 as spread_props, a1 as slot } from "../../../../chunks/index2.js";
import { I as Icon } from "../../../../chunks/Icon.js";
function Scale($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 3v18" }],
    ["path", { "d": "m19 8 3 8a5 5 0 0 1-6 0zV7" }],
    ["path", { "d": "M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" }],
    ["path", { "d": "m5 8 3 8a5 5 0 0 1-6 0zV7" }],
    ["path", { "d": "M7 21h10" }]
  ];
  Icon($$renderer, spread_props([
    { name: "scale" },
    $$sanitized_props,
    {
      /**
       * @component @name Scale
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgM3YxOCIgLz4KICA8cGF0aCBkPSJtMTkgOCAzIDhhNSA1IDAgMCAxLTYgMHpWNyIgLz4KICA8cGF0aCBkPSJNMyA3aDFhMTcgMTcgMCAwIDAgOC0yIDE3IDE3IDAgMCAwIDggMmgxIiAvPgogIDxwYXRoIGQ9Im01IDggMyA4YTUgNSAwIDAgMS02IDB6VjciIC8+CiAgPHBhdGggZD0iTTcgMjFoMTAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/scale
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
function User_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m16 11 2 2 4-4" }],
    ["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user-check" },
    $$sanitized_props,
    {
      /**
       * @component @name UserCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMTEgMiAyIDQtNCIgLz4KICA8cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/user-check
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
function User_cog($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M10 15H6a4 4 0 0 0-4 4v2" }],
    ["path", { "d": "m14.305 16.53.923-.382" }],
    ["path", { "d": "m15.228 13.852-.923-.383" }],
    ["path", { "d": "m16.852 12.228-.383-.923" }],
    ["path", { "d": "m16.852 17.772-.383.924" }],
    ["path", { "d": "m19.148 12.228.383-.923" }],
    ["path", { "d": "m19.53 18.696-.382-.924" }],
    ["path", { "d": "m20.772 13.852.924-.383" }],
    ["path", { "d": "m20.772 16.148.924.383" }],
    ["circle", { "cx": "18", "cy": "15", "r": "3" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user-cog" },
    $$sanitized_props,
    {
      /**
       * @component @name UserCog
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTVINmE0IDQgMCAwIDAtNCA0djIiIC8+CiAgPHBhdGggZD0ibTE0LjMwNSAxNi41My45MjMtLjM4MiIgLz4KICA8cGF0aCBkPSJtMTUuMjI4IDEzLjg1Mi0uOTIzLS4zODMiIC8+CiAgPHBhdGggZD0ibTE2Ljg1MiAxMi4yMjgtLjM4My0uOTIzIiAvPgogIDxwYXRoIGQ9Im0xNi44NTIgMTcuNzcyLS4zODMuOTI0IiAvPgogIDxwYXRoIGQ9Im0xOS4xNDggMTIuMjI4LjM4My0uOTIzIiAvPgogIDxwYXRoIGQ9Im0xOS41MyAxOC42OTYtLjM4Mi0uOTI0IiAvPgogIDxwYXRoIGQ9Im0yMC43NzIgMTMuODUyLjkyNC0uMzgzIiAvPgogIDxwYXRoIGQ9Im0yMC43NzIgMTYuMTQ4LjkyNC4zODMiIC8+CiAgPGNpcmNsZSBjeD0iMTgiIGN5PSIxNSIgcj0iMyIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/user-cog
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
    $$renderer2.push(`<div><div class="mb-8"><h1 class="text-3xl font-title">Admin Dashboard</h1> <p class="text-muted-foreground mt-1">System overview and management</p></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">`);
    StatCard($$renderer2, {
      label: "Total Users",
      value: "...",
      icon: Users
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Lawyers",
      value: "...",
      icon: Scale,
      iconClass: "text-green-600"
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Staff",
      value: "...",
      icon: User_cog,
      iconClass: "text-purple-600"
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Clients",
      value: "...",
      icon: User_check,
      iconClass: "text-blue-600"
    });
    $$renderer2.push(`<!----> `);
    StatCard($$renderer2, {
      label: "Unused Codes",
      value: "...",
      icon: Key_round,
      iconClass: "text-gold"
    });
    $$renderer2.push(`<!----></div> <h2 class="font-title text-xl mb-4">Quick Actions</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><a href="/dashboard/admin/users" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">`);
    Users($$renderer2, {
      class: "w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><h3 class="font-semibold">Manage Users</h3> <p class="text-xs text-muted-foreground mt-0.5">View and manage all user accounts</p></div> `);
    Chevron_right($$renderer2, {
      class: "w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----></a> <a href="/dashboard/admin/staff-codes" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">`);
    Key_round($$renderer2, {
      class: "w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><h3 class="font-semibold">Staff Codes</h3> <p class="text-xs text-muted-foreground mt-0.5">Create and manage registration codes</p></div> `);
    Chevron_right($$renderer2, {
      class: "w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----></a> <a href="/dashboard/admin/settings" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">`);
    Settings($$renderer2, {
      class: "w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><h3 class="font-semibold">Settings</h3> <p class="text-xs text-muted-foreground mt-0.5">Staff password and system config</p></div> `);
    Chevron_right($$renderer2, {
      class: "w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0"
    });
    $$renderer2.push(`<!----></a></div></div>`);
  });
}
export {
  _page as default
};
