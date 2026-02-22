import { a3 as stringify, a4 as ensure_array_like, a2 as attr_class } from "../../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../../chunks/exports.js";
import "../../../../../../chunks/utils.js";
import { a as attr } from "../../../../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../../../../chunks/state.svelte.js";
import "clsx";
import { e as escape_html } from "../../../../../../chunks/escaping.js";
function DocumentPreviewModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    function formatCurrency(cents) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    }
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    let uploadingFile = false;
    let confirmPayId = null;
    $$renderer2.push(`<div><div class="mb-6"><a href="/dashboard/lawyer" class="text-gold hover:underline text-sm">← Back to Dashboard</a></div> <div class="bg-background border border-border rounded-lg p-6 mb-8"><div class="flex justify-between items-start mb-4"><div><h1 class="font-title text-3xl mb-2">${escape_html(data.case.title)}</h1> <p class="text-muted-foreground">Case ID: <span class="font-mono text-sm">${escape_html(data.case.id)}</span></p></div> <form method="POST" action="?/updateStatus">`);
    $$renderer2.select(
      {
        name: "status",
        value: data.case.status,
        onchange: (e) => e.currentTarget.form?.requestSubmit(),
        class: `px-3 py-1 rounded-full border-2 ${stringify(data.case.status === "active" ? "border-green-500 text-green-800 dark:text-green-400" : data.case.status === "pending" ? "border-yellow-500 text-yellow-800 dark:text-yellow-400" : "border-gray-500 text-gray-800 dark:text-gray-400")}`
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "pending" }, ($$renderer4) => {
          $$renderer4.push(`Pending`);
        });
        $$renderer3.option({ value: "active" }, ($$renderer4) => {
          $$renderer4.push(`Active`);
        });
        $$renderer3.option({ value: "closed" }, ($$renderer4) => {
          $$renderer4.push(`Closed`);
        });
      }
    );
    $$renderer2.push(`</form></div> `);
    if (data.case.description) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-muted-foreground mb-4">${escape_html(data.case.description)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-border"><div><h3 class="font-semibold mb-2">Client</h3> <p>${escape_html(data.client.firstName)} ${escape_html(data.client.lastName)}</p> <p class="text-sm text-muted-foreground">${escape_html(data.client.email)}</p> `);
    if (data.client.phoneNumber) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-sm text-muted-foreground">${escape_html(data.client.phoneNumber)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div><h3 class="font-semibold mb-2">Case Dates</h3> <p class="text-sm"><span class="text-muted-foreground">Created:</span> ${escape_html(formatDate(data.case.createdAt))}</p> <p class="text-sm"><span class="text-muted-foreground">Updated:</span> ${escape_html(formatDate(data.case.updatedAt))}</p></div></div></div> <div class="space-y-8"><div><div class="flex justify-between items-center mb-4"><h2 class="font-title text-2xl">Documents</h2> <label class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors"><input type="file" class="hidden"${attr("disabled", uploadingFile, true)}/> ${escape_html("Upload")}</label></div> `);
    if (data.documents.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg overflow-hidden"><table class="w-full"><thead class="bg-muted"><tr><th class="text-left px-4 py-3 text-sm font-semibold">File Name</th><th class="text-left px-4 py-3 text-sm font-semibold">Size</th><th class="text-right px-4 py-3 text-sm font-semibold">Actions</th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(data.documents);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let doc = each_array[$$index];
        $$renderer2.push(`<tr class="border-t border-border hover:bg-muted/50"><td class="px-4 py-3 text-sm">${escape_html(doc.fileName)}</td><td class="px-4 py-3 text-sm text-muted-foreground">${escape_html((doc.fileSize / 1024).toFixed(1))} KB</td><td class="px-4 py-3 text-right space-x-2"><button class="text-gold hover:underline text-sm">Preview</button> <a${attr("href", `/api/documents/${stringify(doc.id)}`)} class="text-gold hover:underline text-sm">Download</a></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-8 text-center"><p class="text-muted-foreground">No documents uploaded yet</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div><div class="flex justify-between items-center mb-4"><h2 class="font-title text-2xl">Invoices</h2> <button class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors">${escape_html("Create Invoice")}</button></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.invoices.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-3"><!--[-->`);
      const each_array_1 = ensure_array_like(data.invoices);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let invoice = each_array_1[$$index_1];
        $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-4"><div class="flex justify-between items-start mb-2"><div><h3 class="font-semibold">${escape_html(invoice.description)}</h3> <p class="text-sm text-muted-foreground">Due: ${escape_html(formatDate(invoice.dueDate))}</p></div> <span${attr_class(`text-xs px-2 py-1 rounded-full ${stringify(invoice.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : invoice.status === "partial" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}`)}>${escape_html(invoice.status)}</span></div> <div class="flex items-center justify-between"><div><div class="text-lg font-bold">${escape_html(formatCurrency(invoice.amount))}</div> `);
        if (invoice.paidAmount > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm text-muted-foreground">Paid: ${escape_html(formatCurrency(invoice.paidAmount))}</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> `);
        if (invoice.status !== "paid") {
          $$renderer2.push("<!--[-->");
          if (confirmPayId === invoice.id) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="flex items-center gap-2"><span class="text-xs text-muted-foreground">Confirm?</span> <form method="POST" action="?/markPaid"><input type="hidden" name="invoiceId"${attr("value", invoice.id)}/> <button type="submit" class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">Yes, Mark Paid</button></form> <button class="text-xs px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors">Cancel</button></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button class="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">Mark Paid</button>`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-background border border-border rounded-lg p-8 text-center"><p class="text-muted-foreground">No invoices created yet</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    DocumentPreviewModal($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}
export {
  _page as default
};
