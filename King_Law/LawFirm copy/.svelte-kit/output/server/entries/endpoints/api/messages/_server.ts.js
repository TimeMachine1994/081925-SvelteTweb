import { error, json } from "@sveltejs/kit";
import { m as messages, d as db, b as documents, u as user } from "../../../../chunks/index3.js";
import { isNull, or, eq, and } from "drizzle-orm";
const GET = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const caseId = url.searchParams.get("caseId");
    const uncategorized = url.searchParams.get("uncategorized") === "true";
    const isLawyer = locals.user.role === "lawyer" || locals.user.role === "admin";
    let conditions = [];
    if (uncategorized && isLawyer) {
      conditions.push(isNull(messages.caseId));
    } else if (uncategorized) {
      conditions.push(isNull(messages.caseId));
      conditions.push(
        or(eq(messages.senderId, locals.user.id), eq(messages.recipientId, locals.user.id))
      );
    } else {
      conditions.push(
        or(eq(messages.senderId, locals.user.id), eq(messages.recipientId, locals.user.id))
      );
      if (caseId) {
        conditions.push(eq(messages.caseId, caseId));
      }
    }
    const messageList = await db.select({
      message: messages,
      sender: user,
      attachment: documents
    }).from(messages).leftJoin(user, eq(messages.senderId, user.id)).leftJoin(documents, eq(messages.attachmentDocumentId, documents.id)).where(and(...conditions)).orderBy(messages.createdAt);
    console.log("📬 Messages fetched:", messageList.map((m) => ({
      id: m.message.id,
      content: m.message.content,
      createdAt: m.message.createdAt,
      senderName: m.sender?.firstName
    })));
    return json({ messages: messageList });
  } catch (err) {
    console.error("Get messages error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch messages");
  }
};
export {
  GET
};
