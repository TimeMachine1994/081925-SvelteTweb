import { x as bind_props, y as attr_class, z as stringify, w as head, F as ensure_array_like } from "../../chunks/index2.js";
import { B as Button } from "../../chunks/Button.js";
import { e as escape_html } from "../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import { a as attr } from "../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
function Modal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false, title, onclose, children, footer } = $$props;
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" tabindex="-1"><div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" tabindex="0">`);
      if (title) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center justify-between px-6 py-4 border-b"><h2 class="text-lg font-semibold text-gray-900">${escape_html(title)}</h2> <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close modal"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="px-6 py-4 overflow-y-auto flex-1">`);
      children($$renderer2);
      $$renderer2.push(`<!----></div> `);
      if (footer) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">`);
        footer($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open });
  });
}
function Card($$renderer, $$props) {
  let { onclick, hoverable = false, children } = $$props;
  if (onclick) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<button type="button"${attr_class(`w-full text-left bg-white rounded-xl border border-gray-200 p-5 transition-all ${stringify(hoverable ? "hover:shadow-md hover:border-blue-300 cursor-pointer" : "")}`)}>`);
    children($$renderer);
    $$renderer.push(`<!----></button>`);
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push(`<div${attr_class(`bg-white rounded-xl border border-gray-200 p-5 transition-all ${stringify(hoverable ? "hover:shadow-md hover:border-blue-300" : "")}`)}>`);
    children($$renderer);
    $$renderer.push(`<!----></div>`);
  }
  $$renderer.push(`<!--]-->`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let deleteModalOpen = false;
    let projectToDelete = null;
    let isDeleting = false;
    function formatDate(date) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(date));
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1uha8ag", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>TimelineCreator - Projects</title>`);
        });
      });
      $$renderer3.push(`<div class="min-h-screen bg-gray-50"><header class="bg-white border-b border-gray-200"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">TimelineCreator</h1> <p class="text-sm text-gray-500 mt-1">Legal Timeline Presentation Tool</p></div> <form method="POST" action="?/create">`);
      Button($$renderer3, {
        variant: "primary",
        type: "submit",
        children: ($$renderer4) => {
          $$renderer4.push(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> New Timeline`);
        }
      });
      $$renderer3.push(`<!----></form></div></div></header> <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`);
      if (data.projects.length === 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="text-center py-16"><svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <h2 class="mt-4 text-xl font-semibold text-gray-900">No timelines yet</h2> <p class="mt-2 text-gray-500">Create your first legal timeline to get started.</p> <div class="mt-6"><form method="POST" action="?/create">`);
        Button($$renderer3, {
          variant: "primary",
          size: "lg",
          type: "submit",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->Create Your First Timeline`);
          }
        });
        $$renderer3.push(`<!----></form></div></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
        const each_array = ensure_array_like(data.projects);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let project = each_array[$$index];
          Card($$renderer3, {
            hoverable: true,
            onclick: () => window.location.href = `/projects/${project.id}`,
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-start justify-between"><div class="flex-1 min-w-0"><h3 class="text-lg font-semibold text-gray-900 truncate">${escape_html(project.title)}</h3> <p class="text-sm text-gray-500 mt-1">${escape_html(project.dataSourceType === "google_sheets" ? "Google Sheets" : "Local CSV")}</p></div> <button type="button" class="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors" aria-label="Delete project"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div> <div class="mt-4 pt-4 border-t border-gray-100"><p class="text-xs text-gray-400">Last updated: ${escape_html(formatDate(project.updatedAt))}</p></div>`);
            }
          });
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></main></div> `);
      {
        let footer = function($$renderer4) {
          Button($$renderer4, {
            variant: "ghost",
            onclick: () => deleteModalOpen = false,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->Cancel`);
            }
          });
          $$renderer4.push(`<!----> <form method="POST" action="?/delete"><input type="hidden" name="projectId"${attr("value", projectToDelete?.id)}/> `);
          Button($$renderer4, {
            variant: "danger",
            type: "submit",
            loading: isDeleting,
            children: ($$renderer5) => {
              $$renderer5.push(`<!---->Delete`);
            }
          });
          $$renderer4.push(`<!----></form>`);
        };
        Modal($$renderer3, {
          title: "Delete Timeline",
          get open() {
            return deleteModalOpen;
          },
          set open($$value) {
            deleteModalOpen = $$value;
            $$settled = false;
          },
          footer,
          children: ($$renderer4) => {
            $$renderer4.push(`<p class="text-gray-600">Are you sure you want to delete <strong>${escape_html(projectToDelete?.title)}</strong>? This action cannot be undone.</p>`);
          },
          $$slots: { footer: true, default: true }
        });
      }
      $$renderer3.push(`<!---->`);
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
