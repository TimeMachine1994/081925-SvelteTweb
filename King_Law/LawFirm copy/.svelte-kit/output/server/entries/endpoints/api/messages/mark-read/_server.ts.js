import { error, json } from "@sveltejs/kit";
import { d as db, m as messages } from "../../../../../chunks/index3.js";
import { and, inArray, eq, isNull } from "drizzle-orm";
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const { messageIds } = await request.json();
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw error(400, "Message IDs array is required");
    }
    await db.update(messages).set({ readAt: Math.floor(Date.now() / 1e3) }).where(
      and(
        inArray(messages.id, messageIds),
        eq(messages.recipientId, locals.user.id),
        isNull(messages.readAt)
      )
    );
    return json({ success: true, marked: messageIds.length });
  } catch (err) {
    console.error("Mark read error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to mark messages as read");
  }
};
export {
  POST
};
