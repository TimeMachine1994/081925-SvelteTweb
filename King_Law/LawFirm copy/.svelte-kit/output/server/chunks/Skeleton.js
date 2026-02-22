import { a4 as ensure_array_like, a2 as attr_class, a3 as stringify } from "./index2.js";
import "clsx";
import { e as escape_html } from "./escaping.js";
class ToastStore {
  toasts = [];
  addToast(message, type, duration = 5e3) {
    const id = crypto.randomUUID();
    const toast = { id, message, type, duration };
    this.toasts = [...this.toasts, toast];
    setTimeout(
      () => {
        this.remove(id);
      },
      duration
    );
    return id;
  }
  success(message, duration = 5e3) {
    return this.addToast(message, "success", duration);
  }
  error(message, duration = 5e3) {
    return this.addToast(message, "error", duration);
  }
  info(message, duration = 5e3) {
    return this.addToast(message, "info", duration);
  }
  warning(message, duration = 5e3) {
    return this.addToast(message, "warning", duration);
  }
  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
  clear() {
    this.toasts = [];
  }
}
const toastStore = new ToastStore();
function Toast($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const typeStyles = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
      warning: "bg-yellow-500 text-black"
    };
    const typeIcons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    if (toastStore.toasts.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"><!--[-->`);
      const each_array = ensure_array_like(toastStore.toasts);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let toast = each_array[$$index];
        $$renderer2.push(`<div${attr_class(`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${stringify(typeStyles[toast.type])}`, "svelte-zemmny")} role="alert"><span class="text-lg font-bold">${escape_html(typeIcons[toast.type])}</span> <p class="flex-1 text-sm font-medium">${escape_html(toast.message)}</p> <button class="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">✕</button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Skeleton($$renderer, $$props) {
  let { class: className = "" } = $$props;
  $$renderer.push(`<div${attr_class(`animate-pulse bg-muted rounded ${stringify(className)}`, "svelte-19f3yks")}></div>`);
}
export {
  Skeleton as S,
  Toast as T
};
