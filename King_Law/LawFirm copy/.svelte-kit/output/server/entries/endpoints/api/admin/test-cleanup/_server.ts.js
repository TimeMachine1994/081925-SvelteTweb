import { error, json } from "@sveltejs/kit";
import { d as db, m as messages, c as cases, b as documents } from "../../../../../chunks/index3.js";
import { like, inArray, eq, or } from "drizzle-orm";
const POST = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== "admin" && locals.user.role !== "lawyer") {
    throw error(401, "Admin or lawyer authentication required");
  }
  try {
    const { prefix, userId } = await request.json();
    const deletedCounts = {
      messages: 0,
      documents: 0,
      cases: 0
    };
    if (prefix) {
      const messagesToDelete = await db.select({ id: messages.id }).from(messages).where(like(messages.content, `${prefix}%`));
      if (messagesToDelete.length > 0) {
        await db.delete(messages).where(inArray(messages.id, messagesToDelete.map((m) => m.id)));
        deletedCounts.messages = messagesToDelete.length;
      }
      const casesToDelete = await db.select({ id: cases.id }).from(cases).where(like(cases.title, `${prefix}%`));
      if (casesToDelete.length > 0) {
        for (const c of casesToDelete) {
          await db.delete(messages).where(eq(messages.caseId, c.id));
        }
        await db.delete(cases).where(inArray(cases.id, casesToDelete.map((c) => c.id)));
        deletedCounts.cases = casesToDelete.length;
      }
      const docsToDelete = await db.select({ id: documents.id }).from(documents).where(like(documents.fileName, `${prefix}%`));
      if (docsToDelete.length > 0) {
        await db.delete(documents).where(inArray(documents.id, docsToDelete.map((d) => d.id)));
        deletedCounts.documents = docsToDelete.length;
      }
    }
    if (userId) {
      const userMessages = await db.select({ id: messages.id }).from(messages).where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));
      if (userMessages.length > 0) {
        await db.delete(messages).where(inArray(messages.id, userMessages.map((m) => m.id)));
        deletedCounts.messages += userMessages.length;
      }
      const userCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.clientId, userId));
      if (userCases.length > 0) {
        await db.delete(cases).where(inArray(cases.id, userCases.map((c) => c.id)));
        deletedCounts.cases += userCases.length;
      }
    }
    return json({
      success: true,
      deleted: deletedCounts,
      message: "Test data cleaned up successfully"
    });
  } catch (err) {
    console.error("Test cleanup error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to cleanup test data");
  }
};
export {
  POST
};
