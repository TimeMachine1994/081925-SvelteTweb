import { redirect } from "@sveltejs/kit";
import { d as db, c as cases, u as user, b as documents } from "../../../../../chunks/index3.js";
import { eq, desc } from "drizzle-orm";
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  const userCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.clientId, locals.user.id));
  const caseIds = userCases.map((c) => c.id);
  if (caseIds.length === 0) {
    return { documents: [] };
  }
  const userDocuments = await db.select({
    document: documents,
    uploader: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    },
    case: {
      id: cases.id,
      title: cases.title
    }
  }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).leftJoin(cases, eq(documents.caseId, cases.id)).where(
    db.$with ? void 0 : eq(documents.caseId, caseIds[0])
    // Simplified for single case
  ).orderBy(desc(documents.uploadedAt));
  const filteredDocs = userDocuments.filter(
    (d) => d.document.caseId && caseIds.includes(d.document.caseId)
  );
  return {
    documents: filteredDocs
  };
};
export {
  load
};
