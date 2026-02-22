import { c as casesStore, m as messagesStore } from "../../../../chunks/messages.svelte.js";
import { d as documentsStore } from "../../../../chunks/documents.svelte.js";
const load = async () => {
  if (typeof window === "undefined") return {};
  await Promise.all([
    casesStore.fetchCases(),
    documentsStore.fetchDocuments(),
    messagesStore.fetchMessages()
  ]);
  return {};
};
export {
  load
};
