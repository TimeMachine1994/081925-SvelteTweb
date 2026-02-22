import { error, json } from "@sveltejs/kit";
import { d as db, u as user, b as documents, c as cases } from "../../../../chunks/index3.js";
import { eq, desc, or, inArray, isNull } from "drizzle-orm";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const caseId = url.searchParams.get("caseId");
    const includeAll = url.searchParams.get("includeAll") === "true";
    let documentList;
    if (caseId) {
      documentList = await db.select({
        document: documents,
        uploader: user
      }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).where(eq(documents.caseId, caseId)).orderBy(desc(documents.uploadedAt));
    } else if (locals.user.role === "lawyer") {
      const lawyerCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.lawyerId, locals.user.id));
      const caseIds = lawyerCases.map((c) => c.id);
      if (caseIds.length > 0) {
        documentList = await db.select({
          document: documents,
          uploader: user
        }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).where(
          or(
            inArray(documents.caseId, caseIds),
            isNull(documents.caseId)
            // Include uncategorized documents
          )
        ).orderBy(desc(documents.uploadedAt));
      } else {
        documentList = await db.select({
          document: documents,
          uploader: user
        }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).where(isNull(documents.caseId)).orderBy(desc(documents.uploadedAt));
      }
    } else {
      const clientCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.clientId, locals.user.id));
      const caseIds = clientCases.map((c) => c.id);
      if (caseIds.length > 0) {
        documentList = await db.select({
          document: documents,
          uploader: user
        }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).where(
          or(
            inArray(documents.caseId, caseIds),
            eq(documents.uploadedById, locals.user.id)
            // Include their own uploads
          )
        ).orderBy(desc(documents.uploadedAt));
      } else {
        documentList = await db.select({
          document: documents,
          uploader: user
        }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).where(eq(documents.uploadedById, locals.user.id)).orderBy(desc(documents.uploadedAt));
      }
    }
    return json({ documents: documentList });
  } catch (err) {
    console.error("Get documents error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch documents");
  }
};
export {
  GET
};
