import { error, json } from "@sveltejs/kit";
import { d as db, m as messages } from "../../../../../chunks/index3.js";
import { sql, and, eq, isNull } from "drizzle-orm";
const GET = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const unreadCounts = await db.select({
      caseId: messages.caseId,
      count: sql`count(*)`
    }).from(messages).where(
      and(
        eq(messages.recipientId, locals.user.id),
        isNull(messages.readAt)
      )
    ).groupBy(messages.caseId);
    const total = unreadCounts.reduce((sum, item) => sum + item.count, 0);
    const byCaseId = {};
    unreadCounts.forEach((item) => {
      if (item.caseId) {
        byCaseId[item.caseId] = item.count;
      }
    });
    return json({
      total,
      byCaseId,
      uncategorized: unreadCounts.find((item) => item.caseId === null)?.count || 0
    });
  } catch (err) {
    console.error("Unread count error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to get unread count");
  }
};
export {
  GET
};
