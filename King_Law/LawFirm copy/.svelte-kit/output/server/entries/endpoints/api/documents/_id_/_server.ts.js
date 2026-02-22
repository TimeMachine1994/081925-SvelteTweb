import { error } from "@sveltejs/kit";
import { d as db, b as documents, c as cases } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
const GET = async ({ params, locals, url }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const documentId = params.id;
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document) {
    throw error(404, "Document not found");
  }
  let canAccess = document.uploadedById === locals.user.id || locals.user.role === "admin" || locals.user.role === "lawyer";
  if (!canAccess && locals.user.role === "client" && document.caseId) {
    const [caseData] = await db.select().from(cases).where(eq(cases.id, document.caseId)).limit(1);
    if (caseData && caseData.clientId === locals.user.id) {
      canAccess = true;
    }
  }
  if (!canAccess) {
    throw error(403, "Access denied");
  }
  try {
    const fileBuffer = await readFile(document.filePath);
    const isPreview = url.searchParams.get("preview") === "1";
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${isPreview ? "inline" : "attachment"}; filename="${document.fileName}"`,
        "Content-Length": document.fileSize.toString()
      }
    });
  } catch (err) {
    console.error("Error reading file:", err);
    throw error(500, "Failed to retrieve document");
  }
};
export {
  GET
};
