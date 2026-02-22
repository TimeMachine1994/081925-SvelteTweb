import { error, json } from "@sveltejs/kit";
import { d as db, i as invoices, c as cases, u as user } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const GET = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id)).limit(1);
    if (!invoice) {
      throw error(404, "Invoice not found");
    }
    const [caseData] = await db.select().from(cases).where(eq(cases.id, invoice.caseId)).limit(1);
    if (!caseData) {
      throw error(404, "Associated case not found");
    }
    if (locals.user.role !== "admin" && locals.user.role !== "lawyer" && caseData.clientId !== locals.user.id) {
      throw error(403, "Access denied");
    }
    let clientInfo = null;
    if (caseData.clientId) {
      const [client] = await db.select({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }).from(user).where(eq(user.id, caseData.clientId)).limit(1);
      clientInfo = client || null;
    }
    return json({
      invoice,
      case: { id: caseData.id, title: caseData.title },
      client: clientInfo
    });
  } catch (err) {
    console.error("Get invoice error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch invoice");
  }
};
export {
  GET
};
