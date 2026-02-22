import { redirect } from "@sveltejs/kit";
import { d as db, c as cases, u as user, b as documents } from "../../../../../chunks/index3.js";
import { eq, desc } from "drizzle-orm";
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  if (locals.user.role !== "lawyer" && locals.user.role !== "admin") {
    throw redirect(302, "/dashboard/client");
  }
  const allDocuments = await db.select({
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
  }).from(documents).leftJoin(user, eq(documents.uploadedById, user.id)).leftJoin(cases, eq(documents.caseId, cases.id)).orderBy(desc(documents.uploadedAt));
  return {
    documents: allDocuments
  };
};
export {
  load
};
