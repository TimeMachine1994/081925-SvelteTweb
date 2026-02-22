import { error, json } from "@sveltejs/kit";
import { d as db, c as cases, i as invoices, u as user } from "../../../../chunks/index3.js";
import { eq, or } from "drizzle-orm";
import { a as generateId } from "../../../../chunks/auth.js";
const GET = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const caseId = url.searchParams.get("caseId");
    let rawInvoices = [];
    if (caseId) {
      const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      if (!caseData) {
        throw error(404, "Case not found");
      }
      if (locals.user.role !== "admin" && caseData.clientId !== locals.user.id && caseData.lawyerId !== locals.user.id) {
        throw error(403, "Access denied");
      }
      rawInvoices = await db.select().from(invoices).where(eq(invoices.caseId, caseId));
    } else if (locals.user.role === "client") {
      const clientCases = await db.select().from(cases).where(eq(cases.clientId, locals.user.id));
      const caseIds = clientCases.map((c) => c.id);
      if (caseIds.length > 0) {
        rawInvoices = await db.select().from(invoices).where(or(...caseIds.map((id) => eq(invoices.caseId, id))));
      } else {
        rawInvoices = [];
      }
    } else {
      const lawyerCases = await db.select().from(cases).where(eq(cases.lawyerId, locals.user.id));
      const caseIds = lawyerCases.map((c) => c.id);
      if (caseIds.length > 0) {
        rawInvoices = await db.select().from(invoices).where(or(...caseIds.map((id) => eq(invoices.caseId, id))));
      } else {
        rawInvoices = [];
      }
    }
    const formattedInvoices = await Promise.all(
      rawInvoices.map(async (inv) => {
        let caseInfo = null;
        let clientInfo = null;
        if (inv.caseId) {
          const [caseData] = await db.select({
            case: cases,
            client: user
          }).from(cases).leftJoin(user, eq(cases.clientId, user.id)).where(eq(cases.id, inv.caseId)).limit(1);
          if (caseData) {
            caseInfo = { id: caseData.case.id, title: caseData.case.title };
            if (caseData.client) {
              clientInfo = {
                firstName: caseData.client.firstName,
                lastName: caseData.client.lastName
              };
            }
          }
        }
        return {
          invoice: inv,
          case: caseInfo,
          client: clientInfo
        };
      })
    );
    return json({ invoices: formattedInvoices });
  } catch (err) {
    console.error("Get invoices error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to fetch invoices");
  }
};
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  if (locals.user.role === "client") {
    throw error(403, "Only lawyers can create invoices");
  }
  try {
    const { caseId, description, amount, dueDate } = await request.json();
    if (!caseId || !description || !amount || !dueDate) {
      throw error(400, "caseId, description, amount, and dueDate are required");
    }
    const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!caseData) {
      throw error(404, "Case not found");
    }
    if (locals.user.role !== "admin" && caseData.lawyerId !== locals.user.id) {
      throw error(403, "You can only create invoices for your own cases");
    }
    const invoiceId = generateId();
    const [newInvoice] = await db.insert(invoices).values({
      id: invoiceId,
      caseId,
      description,
      amount: parseInt(amount),
      dueDate: Math.floor(new Date(dueDate).getTime() / 1e3),
      status: "unpaid",
      paidAmount: 0
    }).returning();
    return json({ success: true, invoice: newInvoice });
  } catch (err) {
    console.error("Create invoice error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to create invoice");
  }
};
export {
  GET,
  POST
};
