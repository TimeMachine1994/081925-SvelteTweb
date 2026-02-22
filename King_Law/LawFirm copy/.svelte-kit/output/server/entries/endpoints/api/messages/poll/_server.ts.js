import { error, json } from "@sveltejs/kit";
import { m as messages, d as db, u as user } from "../../../../../chunks/index3.js";
import { gt, or, eq, and } from "drizzle-orm";
const GET = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const caseId = url.searchParams.get("caseId");
    const since = url.searchParams.get("since");
    if (!since) {
      throw error(400, "since parameter is required (ISO timestamp)");
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      throw error(400, "Invalid since timestamp");
    }
    const sinceTimestamp = Math.floor(sinceDate.getTime() / 1e3);
    const conditions = [
      gt(messages.createdAt, sinceTimestamp),
      or(
        eq(messages.senderId, locals.user.id),
        eq(messages.recipientId, locals.user.id)
      )
    ];
    if (caseId) {
      conditions.push(eq(messages.caseId, caseId));
    }
    const newMessages = await db.select({
      message: messages,
      sender: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }).from(messages).leftJoin(user, eq(messages.senderId, user.id)).where(and(...conditions)).orderBy(messages.createdAt);
    return json({
      messages: newMessages,
      count: newMessages.length
    });
  } catch (err) {
    console.error("Message poll error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to poll messages");
  }
};
export {
  GET
};
