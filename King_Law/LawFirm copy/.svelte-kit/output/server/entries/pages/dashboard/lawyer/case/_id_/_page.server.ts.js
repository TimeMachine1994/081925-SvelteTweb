import { redirect, error, fail } from "@sveltejs/kit";
import { d as db, u as user, c as cases, b as documents, i as invoices, m as messages } from "../../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { a as generateId } from "../../../../../../chunks/auth.js";
const load = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== "lawyer" && locals.user.role !== "admin") {
    throw redirect(303, "/login");
  }
  const caseId = params.id;
  const [caseData] = await db.select({
    case: cases,
    client: user
  }).from(cases).innerJoin(user, eq(cases.clientId, user.id)).where(eq(cases.id, caseId)).limit(1);
  if (!caseData) {
    throw error(404, "Case not found");
  }
  if (caseData.case.lawyerId !== locals.user.id && locals.user.role !== "admin") {
    throw error(403, "Access denied");
  }
  const caseDocuments = await db.select().from(documents).where(eq(documents.caseId, caseId));
  const caseInvoices = await db.select().from(invoices).where(eq(invoices.caseId, caseId));
  const caseMessages = await db.select({
    message: messages,
    sender: user,
    attachment: documents
  }).from(messages).innerJoin(user, eq(messages.senderId, user.id)).leftJoin(documents, eq(messages.attachmentDocumentId, documents.id)).where(eq(messages.caseId, caseId));
  return {
    case: caseData.case,
    client: caseData.client,
    documents: caseDocuments,
    invoices: caseInvoices,
    messages: caseMessages
  };
};
const actions = {
  updateStatus: async ({ request, params, locals }) => {
    if (!locals.user || locals.user.role !== "lawyer" && locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }
    const data = await request.formData();
    const status = data.get("status")?.toString();
    if (!status || !["active", "pending", "closed"].includes(status)) {
      return fail(400, { error: "Invalid status" });
    }
    await db.update(cases).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cases.id, params.id));
    return { success: true };
  },
  createInvoice: async ({ request, params, locals }) => {
    if (!locals.user || locals.user.role !== "lawyer" && locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }
    const data = await request.formData();
    const description = data.get("description")?.toString();
    const amount = parseFloat(data.get("amount")?.toString() || "0");
    const dueDate = data.get("dueDate")?.toString();
    if (!description || !amount || !dueDate) {
      return fail(400, { error: "All fields are required" });
    }
    await db.insert(invoices).values({
      id: generateId(),
      caseId: params.id,
      description,
      amount: Math.round(amount * 100),
      dueDate: new Date(dueDate),
      status: "unpaid",
      paidAmount: 0,
      createdAt: /* @__PURE__ */ new Date()
    });
    return { success: true };
  },
  markPaid: async ({ request, params, locals }) => {
    if (!locals.user || locals.user.role !== "lawyer" && locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }
    const data = await request.formData();
    const invoiceId = data.get("invoiceId")?.toString();
    if (!invoiceId) {
      return fail(400, { error: "Invoice ID is required" });
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoice || invoice.caseId !== params.id) {
      return fail(404, { error: "Invoice not found" });
    }
    await db.update(invoices).set({
      status: "paid",
      paidAmount: invoice.amount,
      paidAt: /* @__PURE__ */ new Date()
    }).where(eq(invoices.id, invoiceId));
    return { success: true };
  }
};
export {
  actions,
  load
};
