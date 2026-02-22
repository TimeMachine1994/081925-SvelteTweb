import { d as db, c as cases, b as documents, i as invoices, m as messages } from "../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const load = async ({ locals }) => {
  const userId = locals.user.id;
  const userCases = await db.select().from(cases).where(eq(cases.clientId, userId));
  const caseIds = userCases.map((c) => c.id);
  const userDocuments = caseIds.length > 0 ? await db.select().from(documents).where(eq(documents.uploadedById, userId)).limit(5) : [];
  const userInvoices = caseIds.length > 0 ? await db.select().from(invoices).orderBy(invoices.createdAt) : [];
  const userMessages = caseIds.length > 0 ? await db.select().from(messages).where(eq(messages.senderId, userId)).limit(10) : [];
  const activeCases = userCases.filter((c) => c.status === "active").length;
  const unpaidInvoices = userInvoices.filter((i) => i.status !== "paid");
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const unreadMessages = userMessages.filter((m) => !m.readAt).length;
  return {
    cases: userCases,
    documents: userDocuments,
    invoices: userInvoices,
    stats: {
      activeCases,
      totalUnpaid,
      unreadMessages,
      documentsCount: userDocuments.length
    }
  };
};
export {
  load
};
