import { error, json } from "@sveltejs/kit";
import { d as db, c as cases, e as caseStaffAssignments } from "../../../../../chunks/index3.js";
import { eq, and } from "drizzle-orm";
async function isStaffAssignedToCase(staffId, caseId) {
  const assignment = await db.select().from(caseStaffAssignments).where(and(eq(caseStaffAssignments.caseId, caseId), eq(caseStaffAssignments.staffId, staffId))).get();
  return !!assignment;
}
const GET = async ({ locals, params }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const caseId = params.id;
  const userRole = locals.user.role;
  const [caseData] = await db.select({
    id: cases.id,
    title: cases.title,
    description: cases.description,
    status: cases.status,
    clientId: cases.clientId,
    lawyerId: cases.lawyerId,
    createdAt: cases.createdAt
  }).from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseData) {
    throw error(404, "Case not found");
  }
  if (userRole === "client" && caseData.clientId !== locals.user.id) {
    throw error(403, "Access denied");
  }
  if (userRole === "staff") {
    const isAssigned = await isStaffAssignedToCase(locals.user.id, caseId);
    if (!isAssigned) {
      throw error(403, "You are not assigned to this case");
    }
  }
  return json(caseData);
};
const PATCH = async ({ request, locals, params }) => {
  if (!locals.user || locals.user.role === "client" || locals.user.role === "staff") {
    throw error(403, "Only lawyers and admins can update cases");
  }
  try {
    const { title, description, status } = await request.json();
    const caseId = params.id;
    const [existingCase] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existingCase) {
      throw error(404, "Case not found");
    }
    if (existingCase.lawyerId !== locals.user.id && locals.user.role !== "admin") {
      throw error(403, "Access denied");
    }
    const [updatedCase] = await db.update(cases).set({
      ...title && { title },
      ...description !== void 0 && { description },
      ...status && { status }
    }).where(eq(cases.id, caseId)).returning();
    return json({ success: true, case: updatedCase });
  } catch (err) {
    console.error("Update case error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to update case");
  }
};
const DELETE = async ({ locals, params }) => {
  if (!locals.user || locals.user.role === "client" || locals.user.role === "staff") {
    throw error(403, "Only lawyers and admins can delete cases");
  }
  try {
    const caseId = params.id;
    const [existingCase] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existingCase) {
      throw error(404, "Case not found");
    }
    if (existingCase.lawyerId !== locals.user.id && locals.user.role !== "admin") {
      throw error(403, "Access denied");
    }
    await db.delete(cases).where(eq(cases.id, caseId));
    return json({ success: true });
  } catch (err) {
    console.error("Delete case error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to delete case");
  }
};
export {
  DELETE,
  GET,
  PATCH
};
