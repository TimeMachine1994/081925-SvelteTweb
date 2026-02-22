import { redirect, error } from "@sveltejs/kit";
import { d as db, u as user, c as cases, b as documents, i as invoices, m as messages } from "../../../../../../chunks/index3.js";
import { eq, and } from "drizzle-orm";
const load = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login");
  }
  const caseId = params.id;
  const [caseData] = await db.select({
    case: cases,
    lawyer: user
  }).from(cases).innerJoin(user, eq(cases.lawyerId, user.id)).where(and(eq(cases.id, caseId), eq(cases.clientId, locals.user.id))).limit(1);
  if (!caseData) {
    throw error(404, "Case not found or access denied");
  }
  const caseDocuments = await db.select().from(documents).where(eq(documents.caseId, caseId));
  const caseInvoices = await db.select().from(invoices).where(eq(invoices.caseId, caseId));
  const caseMessages = await db.select({
    message: messages,
    sender: user
  }).from(messages).innerJoin(user, eq(messages.senderId, user.id)).where(eq(messages.caseId, caseId));
  return {
    case: caseData.case,
    lawyer: caseData.lawyer,
    documents: caseDocuments,
    invoices: caseInvoices,
    messages: caseMessages
  };
};
export {
  load
};
