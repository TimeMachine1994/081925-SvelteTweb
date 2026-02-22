import { d as db, u as user, c as cases, b as documents, i as invoices, m as messages } from "../../../../chunks/index3.js";
import { eq, inArray, and, isNull, notInArray } from "drizzle-orm";
import { b as listClientFiles } from "../../../../chunks/s3.js";
const load = async ({ locals }) => {
  const lawyerId = locals.user.id;
  const lawyerCases = await db.select({
    case: cases,
    client: user
  }).from(cases).innerJoin(user, eq(cases.clientId, user.id)).where(eq(cases.lawyerId, lawyerId));
  const allDocumentsRaw = await db.select({
    id: documents.id,
    fileName: documents.fileName,
    filePath: documents.filePath,
    fileSize: documents.fileSize,
    mimeType: documents.mimeType,
    uploadedAt: documents.uploadedAt,
    caseId: documents.caseId,
    uploadedById: documents.uploadedById,
    uploaderFirstName: user.firstName,
    uploaderLastName: user.lastName
  }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).limit(10);
  const docCaseIds = [...new Set(allDocumentsRaw.filter((d) => d.caseId).map((d) => d.caseId))];
  const caseTitles = docCaseIds.length > 0 ? await db.select({ id: cases.id, title: cases.title }).from(cases).where(inArray(cases.id, docCaseIds)) : [];
  const caseTitleMap = Object.fromEntries(caseTitles.map((c) => [c.id, c.title]));
  const allDocuments = allDocumentsRaw.map((doc) => ({
    ...doc,
    caseTitle: doc.caseId ? caseTitleMap[doc.caseId] || "Unknown" : null
  }));
  const allInvoices = await db.select().from(invoices).limit(10);
  const uncategorizedMessages = await db.select({
    message: messages,
    sender: user
  }).from(messages).innerJoin(user, eq(messages.senderId, user.id)).where(and(
    isNull(messages.caseId),
    eq(user.role, "client")
  )).limit(50);
  lawyerCases.map((c) => c.client.id);
  const allCasesResult = await db.select({ clientId: cases.clientId }).from(cases);
  const allClientIdsWithCases = [...new Set(allCasesResult.map((c) => c.clientId))];
  let newClients = [];
  if (allClientIdsWithCases.length > 0) {
    newClients = await db.select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt
    }).from(user).where(and(
      eq(user.role, "client"),
      notInArray(user.id, allClientIdsWithCases)
    ));
  } else {
    newClients = await db.select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt
    }).from(user).where(eq(user.role, "client"));
  }
  const newClientsWithFiles = await Promise.all(
    newClients.map(async (client) => {
      try {
        const files = await listClientFiles(client.id);
        return {
          ...client,
          files: files.map((f) => ({
            key: f.key,
            name: f.key.split("/").pop() || f.key,
            size: f.size,
            lastModified: f.lastModified
          }))
        };
      } catch (error) {
        console.error(`Failed to fetch files for client ${client.id}:`, error);
        return { ...client, files: [] };
      }
    })
  );
  const totalCases = lawyerCases.length;
  const activeCases = lawyerCases.filter((c) => c.case.status === "active").length;
  const totalDocuments = allDocuments.length;
  const paidInvoices = allInvoices.filter((i) => i.status === "paid");
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const messagesByClient = uncategorizedMessages.reduce((acc, { message, sender }) => {
    const clientId = message.senderId;
    if (!acc[clientId]) {
      acc[clientId] = {
        client: sender,
        messages: []
      };
    }
    acc[clientId].messages.push(message);
    return acc;
  }, {});
  const allClients = await db.select({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt
  }).from(user).where(eq(user.role, "client"));
  return {
    cases: lawyerCases,
    documents: allDocuments,
    invoices: allInvoices,
    uncategorizedThreads: Object.values(messagesByClient),
    newClients: newClientsWithFiles,
    allClients,
    stats: {
      totalCases,
      activeCases,
      totalDocuments,
      totalRevenue
    }
  };
};
export {
  load
};
