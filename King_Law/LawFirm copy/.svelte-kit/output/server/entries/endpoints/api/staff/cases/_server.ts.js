import { json } from "@sveltejs/kit";
import { d as db, e as caseStaffAssignments, u as user, c as cases } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const GET = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (locals.user.role !== "staff") {
    return json({ error: "This endpoint is for staff only" }, { status: 403 });
  }
  const assignedCases = await db.select({
    id: cases.id,
    title: cases.title,
    description: cases.description,
    status: cases.status,
    createdAt: cases.createdAt,
    clientId: cases.clientId,
    clientFirstName: user.firstName,
    clientLastName: user.lastName,
    assignedAt: caseStaffAssignments.assignedAt
  }).from(caseStaffAssignments).innerJoin(cases, eq(caseStaffAssignments.caseId, cases.id)).innerJoin(user, eq(cases.clientId, user.id)).where(eq(caseStaffAssignments.staffId, locals.user.id)).all();
  return json({ cases: assignedCases });
};
export {
  GET
};
