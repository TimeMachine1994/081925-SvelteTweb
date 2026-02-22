import { $ as sanitize_props, a0 as spread_props, a1 as slot, a2 as attr_class, a3 as stringify, a4 as ensure_array_like } from "../../../../../../chunks/index2.js";
import { m as messagesStore, c as casesStore } from "../../../../../../chunks/messages.svelte.js";
import { a as authStore } from "../../../../../../chunks/auth.svelte.js";
import "clsx";
import { I as Icon } from "../../../../../../chunks/Icon.js";
import { F as File_text } from "../../../../../../chunks/file-text.js";
import { P as Paperclip } from "../../../../../../chunks/paperclip.js";
import { e as escape_html } from "../../../../../../chunks/escaping.js";
import { a as attr } from "../../../../../../chunks/attributes.js";
import { o as onDestroy } from "../../../../../../chunks/index-server.js";
import { M as Message_square } from "../../../../../../chunks/message-square.js";
function Check_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M18 6 7 17l-5-5" }],
    ["path", { "d": "m22 10-7.5 7.5L13 16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "check-check" },
    $$sanitized_props,
    {
      /**
       * @component @name CheckCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTggNiA3IDE3bC01LTUiIC8+CiAgPHBhdGggZD0ibTIyIDEwLTcuNSA3LjVMMTMgMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check-check
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
function Check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$renderer, spread_props([
    { name: "check" },
    $$sanitized_props,
    {
      /**
       * @component @name Check
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check
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
function File_pen($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"
      }
    ],
    ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }],
    [
      "path",
      {
        "d": "M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "file-pen" },
    $$sanitized_props,
    {
      /**
       * @component @name FilePen
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIuNjU5IDIySDE4YTIgMiAwIDAgMCAyLTJWOGEyLjQgMi40IDAgMCAwLS43MDYtMS43MDZsLTMuNTg4LTMuNTg4QTIuNCAyLjQgMCAwIDAgMTQgMkg2YTIgMiAwIDAgMC0yIDJ2OS4zNCIgLz4KICA8cGF0aCBkPSJNMTQgMnY1YTEgMSAwIDAgMCAxIDFoNSIgLz4KICA8cGF0aCBkPSJNMTAuMzc4IDEyLjYyMmExIDEgMCAwIDEgMyAzLjAwM0w4LjM2IDIwLjYzN2EyIDIgMCAwIDEtLjg1NC41MDZsLTIuODY3LjgzN2EuNS41IDAgMCAxLS42Mi0uNjJsLjgzNi0yLjg2OWEyIDIgMCAwIDEgLjUwNi0uODUzeiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/file-pen
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
function File($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      }
    ],
    ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "file" },
    $$sanitized_props,
    {
      /**
       * @component @name File
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiAyMmEyIDIgMCAwIDEtMi0yVjRhMiAyIDAgMCAxIDItMmg4YTIuNCAyLjQgMCAwIDEgMS43MDQuNzA2bDMuNTg4IDMuNTg4QTIuNCAyLjQgMCAwIDEgMjAgOHYxMmEyIDIgMCAwIDEtMiAyeiIgLz4KICA8cGF0aCBkPSJNMTQgMnY1YTEgMSAwIDAgMCAxIDFoNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/file
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
function Image($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["circle", { "cx": "9", "cy": "9", "r": "2" }],
    ["path", { "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
  ];
  Icon($$renderer, spread_props([
    { name: "image" },
    $$sanitized_props,
    {
      /**
       * @component @name Image
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIgLz4KICA8cGF0aCBkPSJtMjEgMTUtMy4wODYtMy4wODZhMiAyIDAgMCAwLTIuODI4IDBMNiAyMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/image
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
class ChatUIStore {
  isOpen = false;
  selectedClientId = null;
  selectedClientName = null;
  filterUncategorized = false;
  open() {
    this.isOpen = true;
  }
  close() {
    this.isOpen = false;
    this.selectedClientId = null;
    this.selectedClientName = null;
    this.filterUncategorized = false;
  }
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  openForClient(clientId, clientName) {
    this.selectedClientId = clientId;
    this.selectedClientName = clientName;
    this.filterUncategorized = true;
    this.isOpen = true;
  }
}
const chatUIStore = new ChatUIStore();
function FileIcon($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { mimeType = "", class: className = "w-5 h-5" } = $$props;
    if (mimeType.startsWith("image/")) {
      $$renderer2.push("<!--[-->");
      Image($$renderer2, { class: className });
    } else {
      $$renderer2.push("<!--[!-->");
      if (mimeType.includes("pdf")) {
        $$renderer2.push("<!--[-->");
        File_text($$renderer2, { class: className });
      } else {
        $$renderer2.push("<!--[!-->");
        if (mimeType.includes("word")) {
          $$renderer2.push("<!--[-->");
          File_pen($$renderer2, { class: className });
        } else {
          $$renderer2.push("<!--[!-->");
          if (mimeType.includes("text")) {
            $$renderer2.push("<!--[-->");
            File($$renderer2, { class: className });
          } else {
            $$renderer2.push("<!--[!-->");
            Paperclip($$renderer2, { class: className });
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function MessageBubble($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { message, sender, attachment, isOwn } = $$props;
    function formatTime(date) {
      return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    $$renderer2.push(`<div${attr_class(`flex ${stringify(isOwn ? "justify-end" : "justify-start")} mb-4`)}><div class="max-w-[70%]">`);
    if (!isOwn) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-xs text-muted-foreground mb-1 ml-3">${escape_html(sender.firstName)} ${escape_html(sender.lastName)} `);
      if (sender.role === "lawyer") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-gold">• Attorney</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`rounded-lg px-4 py-2 ${stringify(isOwn ? "bg-gold text-black rounded-br-none" : "bg-muted text-foreground rounded-bl-none")}`)}>`);
    if (message.content) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-sm whitespace-pre-wrap break-words">${escape_html(message.content)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (attachment) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class(`mt-2 p-2 rounded border ${stringify(isOwn ? "border-black/20 bg-black/10" : "border-border bg-background")} flex items-center gap-2`)}>`);
      FileIcon($$renderer2, { mimeType: attachment.mimeType, class: "w-6 h-6" });
      $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">${escape_html(attachment.fileName)}</div> <div class="text-xs opacity-70">${escape_html(formatFileSize(attachment.fileSize))}</div></div> <a${attr("href", `/api/documents/${stringify(attachment.id)}`)} download=""${attr_class(`px-3 py-1 text-xs rounded ${stringify(isOwn ? "bg-black/20 hover:bg-black/30" : "bg-gold hover:bg-gold-dark")} text-black font-semibold transition-colors`)}>Download</a></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex items-center gap-2 mt-1"><span class="text-xs opacity-70">${escape_html(formatTime(message.createdAt))}</span> `);
    if (isOwn) {
      $$renderer2.push("<!--[-->");
      if (message.readAt) {
        $$renderer2.push("<!--[-->");
        Check_check($$renderer2, { class: "w-3.5 h-3.5" });
      } else {
        $$renderer2.push("<!--[!-->");
        Check($$renderer2, { class: "w-3.5 h-3.5" });
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
function ChatSlider($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { caseId, open = false } = $$props;
    let isOpen = open;
    let messageContent = "";
    let sending = false;
    let displayMessages = () => {
      if (chatUIStore.filterUncategorized && chatUIStore.selectedClientId) {
        return messagesStore.messages.filter((item) => item.message.senderId === chatUIStore.selectedClientId || item.message.recipientId === chatUIStore.selectedClientId);
      }
      return messagesStore.messages;
    };
    onDestroy(() => {
      messagesStore.stopPolling();
    });
    let unreadCount = messagesStore.getUnreadCount(caseId);
    $$renderer2.push(`<button class="fixed right-6 bottom-6 w-14 h-14 bg-gold hover:bg-gold-dark text-black rounded-full shadow-lg flex items-center justify-center transition-all z-40" aria-label="Toggle chat">`);
    if (
      // Sync with external open prop
      // Mark messages as read when chat opens
      isOpen
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>`);
      if (unreadCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">${escape_html(unreadCount > 9 ? "9+" : unreadCount)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></button> `);
    if (isOpen) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 bg-black/50 md:hidden z-40" role="button" tabindex="-1"></div> <div class="fixed right-0 top-0 h-full w-full md:w-[400px] bg-background border-l border-border shadow-2xl flex flex-col z-50 transition-transform"><div class="flex items-center justify-between p-4 border-b border-border"><div><h2 class="font-title text-xl">Messages</h2> `);
      if (chatUIStore.selectedClientName) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-sm text-muted-foreground">with ${escape_html(chatUIStore.selectedClientName)}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (caseId && casesStore.cases.length > 0) {
          $$renderer2.push("<!--[-->");
          const currentCase = casesStore.cases.find((c) => c.case.id === caseId);
          if (currentCase) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="text-sm text-muted-foreground">${escape_html(currentCase.case.title)}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> <button class="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Close chat"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <div class="flex-1 overflow-y-auto p-4">`);
      if (messagesStore.loading && displayMessages().length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center justify-center h-full"><div class="text-center"><div class="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div> <p class="text-sm text-muted-foreground">Loading messages...</p></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (displayMessages().length === 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="flex items-center justify-center h-full text-center"><div>`);
          Message_square($$renderer2, { class: "w-10 h-10 mb-2 text-muted-foreground mx-auto" });
          $$renderer2.push(`<!----> <p class="text-muted-foreground">No messages yet</p> <p class="text-sm text-muted-foreground">Start the conversation!</p></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<!--[-->`);
          const each_array = ensure_array_like(displayMessages());
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let item = each_array[$$index];
            MessageBubble($$renderer2, {
              message: item.message,
              sender: item.sender,
              attachment: item.attachment,
              isOwn: item.message.senderId === authStore.user?.id
            });
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> <div class="p-4 border-t border-border"><form class="space-y-2">`);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex gap-2"><textarea placeholder="Type a message..." rows="1" class="flex-1 px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-gold">`);
      const $$body = escape_html(messageContent);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button type="button" class="px-3 py-2 border border-input rounded-md hover:bg-muted transition-colors" aria-label="Attach file"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>`);
      }
      $$renderer2.push(`<!--]--> <button type="submit"${attr("disabled", !messageContent.trim() && true || sending, true)} class="px-4 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`);
      }
      $$renderer2.push(`<!--]--></button></div></form></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function formatCurrency(cents) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    }
    function formatDate(date) {
      let dateObj;
      if (typeof date === "number") {
        dateObj = new Date(date < 1e10 ? date * 1e3 : date);
      } else {
        dateObj = new Date(date);
      }
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    let messageText = "";
    let uploadingFile = false;
    $$renderer2.push(`<div><div class="mb-6"><a href="/dashboard/client" class="text-gold hover:underline text-sm">← Back to Dashboard</a></div> <div class="bg-background border border-border rounded-lg p-6 mb-8"><div class="flex justify-between items-start mb-4"><div><h1 class="font-title text-3xl mb-2">${escape_html(data.case.title)}</h1> <p class="text-muted-foreground">Case ID: <span class="font-mono text-sm">${escape_html(data.case.id)}</span></p></div> <span${attr_class(`text-xs px-3 py-1 rounded-full ${stringify(data.case.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : data.case.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400")}`)}>${escape_html(data.case.status)}</span></div> `);
    if (data.case.description) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-muted-foreground mb-4">${escape_html(data.case.description)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-border"><div><h3 class="font-semibold mb-2">Your Lawyer</h3> <p>${escape_html(data.lawyer.firstName)} ${escape_html(data.lawyer.lastName)}</p> <p class="text-sm text-muted-foreground">${escape_html(data.lawyer.email)}</p></div> <div><h3 class="font-semibold mb-2">Case Dates</h3> <p class="text-sm"><span class="text-muted-foreground">Created:</span> ${escape_html(formatDate(data.case.createdAt))}</p> <p class="text-sm"><span class="text-muted-foreground">Updated:</span> ${escape_html(formatDate(data.case.updatedAt))}</p></div></div></div> <div class="grid lg:grid-cols-2 gap-8"><div class="space-y-8"><div><div class="flex justify-between items-center mb-4"><h2 class="font-title text-2xl">Documents</h2> <label class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors"><input type="file" class="hidden"${attr("disabled", uploadingFile, true)}/> ${escape_html("Upload")}</label></div> `);
    if (data.documents.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg overflow-hidden"><table class="w-full"><thead class="bg-muted"><tr><th class="text-left px-4 py-3 text-sm font-semibold">File Name</th><th class="text-left px-4 py-3 text-sm font-semibold">Size</th><th class="text-right px-4 py-3 text-sm font-semibold">Actions</th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(data.documents);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let doc = each_array[$$index];
        $$renderer2.push(`<tr class="border-t border-border hover:bg-muted/50"><td class="px-4 py-3 text-sm">${escape_html(doc.fileName)}</td><td class="px-4 py-3 text-sm text-muted-foreground">${escape_html((doc.fileSize / 1024).toFixed(1))} KB</td><td class="px-4 py-3 text-right"><a${attr("href", `/api/documents/${stringify(doc.id)}`)} class="text-gold hover:underline text-sm">Download</a></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-8 text-center"><p class="text-muted-foreground">No documents uploaded yet</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div><h2 class="font-title text-2xl mb-4">Invoices</h2> `);
    if (data.invoices.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_1 = ensure_array_like(data.invoices);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let invoice = each_array_1[$$index_1];
        $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-4"><div class="flex justify-between items-start mb-2"><div><h3 class="font-semibold">${escape_html(invoice.description)}</h3> <p class="text-sm text-muted-foreground">Due: ${escape_html(formatDate(invoice.dueDate))}</p></div> <span${attr_class(`text-xs px-2 py-1 rounded-full ${stringify(invoice.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : invoice.status === "partial" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}`)}>${escape_html(invoice.status)}</span></div> <div class="flex justify-between items-center"><span class="text-lg font-bold">${escape_html(formatCurrency(invoice.amount))}</span> `);
        if (invoice.status !== "paid") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button class="bg-gold hover:bg-gold-dark text-black px-4 py-2 rounded text-sm font-semibold transition-colors">Pay Now</button>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-8 text-center"><p class="text-muted-foreground">No invoices yet</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div><h2 class="font-title text-2xl mb-4">Messages</h2> <div class="bg-background border border-border rounded-lg overflow-hidden"><div class="h-96 overflow-y-auto p-4 space-y-4">`);
    if (data.messages.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(data.messages);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let { message, sender } = each_array_2[$$index_2];
        $$renderer2.push(`<div${attr_class(`p-3 rounded-lg ${stringify(sender.id === data.lawyer.id ? "bg-muted ml-4" : "bg-gold/10 mr-4")}`)}><div class="flex justify-between items-start mb-1"><span class="font-semibold text-sm">${escape_html(sender.firstName)} ${escape_html(sender.lastName)}</span> <span class="text-xs text-muted-foreground">${escape_html(formatDate(message.createdAt))}</span></div> <p class="text-sm">${escape_html(message.content)}</p></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-center text-muted-foreground">No messages yet</p>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="border-t border-border p-4"><form class="flex gap-2"><input type="text"${attr("value", messageText)} placeholder="Type your message..." class="flex-1 px-3 py-2 border border-input rounded-md bg-background"/> <button type="submit" class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors">Send</button></form></div></div></div></div></div> `);
    ChatSlider($$renderer2, { caseId: data.case.id });
    $$renderer2.push(`<!---->`);
  });
}
export {
  _page as default
};
