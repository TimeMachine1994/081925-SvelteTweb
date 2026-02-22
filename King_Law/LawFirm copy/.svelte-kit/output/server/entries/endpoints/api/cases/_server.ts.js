import { error, json } from "@sveltejs/kit";
import { u as user, d as db, c as cases, m as messages, b as documents } from "../../../../chunks/index3.js";
import { eq, or, and, isNull } from "drizzle-orm";
import { a as generateId } from "../../../../chunks/auth.js";
import { alias } from "drizzle-orm/sqlite-core";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const caseId = url.searchParams.get("id");
    if (caseId) {
      const clientTable = alias(user, "client");
      const lawyerTable = alias(user, "lawyer");
      const [caseData] = await db.select({
        case: cases,
        client: clientTable,
        lawyer: lawyerTable
      }).from(cases).leftJoin(clientTable, eq(cases.clientId, clientTable.id)).leftJoin(lawyerTable, eq(cases.lawyerId, lawyerTable.id)).where(eq(cases.id, caseId)).limit(1);
      if (!caseData) {
        throw error(404, "Case not found");
      }
      if (locals.user.role !== "admin" && caseData.case.clientId !== locals.user.id && caseData.case.lawyerId !== locals.user.id) {
        throw error(403, "Access denied");
      }
      return json({ case: caseData });
    }
    let userCases;
    if (locals.user.role === "client") {
      userCases = await db.select({
        case: cases,
        lawyer: user
      }).from(cases).leftJoin(user, eq(cases.lawyerId, user.id)).where(eq(cases.clientId, locals.user.id));
    } else {
      userCases = await db.select({
        case: cases,
        client: user
      }).from(cases).leftJoin(user, eq(cases.clientId, user.id)).where(
        or(eq(cases.lawyerId, locals.user.id), eq(user.role, "admin"))
      );
    }
    return json({ cases: userCases });
  } catch (err) {
    console.error("Get cases error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch cases");
  }
};
const POST = async ({ request, locals }) => {
  if (!locals.user || locals.user.role === "client") {
    throw error(403, "Only lawyers can create cases");
  }
  try {
    const { clientId, title, description, status } = await request.json();
    if (!clientId || !title) {
      throw error(400, "Client ID and title are required");
    }
    const [newCase] = await db.insert(cases).values({
      id: generateId(),
      clientId,
      lawyerId: locals.user.id,
      title,
      description: description || null,
      status: status || "pending"
    }).returning();
    await db.update(messages).set({ caseId: newCase.id }).where(
      and(
        eq(messages.senderId, clientId),
        isNull(messages.caseId)
      )
    );
    await db.update(messages).set({ caseId: newCase.id }).where(
      and(
        eq(messages.recipientId, clientId),
        isNull(messages.caseId)
      )
    );
    await db.update(documents).set({ caseId: newCase.id }).where(
      and(
        eq(documents.uploadedById, clientId),
        isNull(documents.caseId)
      )
    );
    return json({ success: true, case: newCase });
  } catch (err) {
    console.error("Create case error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to create case");
  }
};
export {
  GET,
  POST
};
