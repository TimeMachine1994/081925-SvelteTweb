import { error, json } from "@sveltejs/kit";
import { d as db, i as invoices, c as cases } from "../../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { b as private_env } from "../../../../../../chunks/shared-server.js";
const POST = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const { amount } = await request.json();
    if (!amount || typeof amount !== "number" || amount <= 0) {
      throw error(400, "A valid payment amount is required");
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id)).limit(1);
    if (!invoice) {
      throw error(404, "Invoice not found");
    }
    if (invoice.status === "paid") {
      throw error(400, "This invoice has already been paid in full");
    }
    const [caseData] = await db.select().from(cases).where(eq(cases.id, invoice.caseId)).limit(1);
    if (!caseData) {
      throw error(404, "Associated case not found");
    }
    if (locals.user.role !== "admin" && caseData.clientId !== locals.user.id) {
      throw error(403, "Only the client on this case can make a payment");
    }
    const remainingBalance = invoice.amount - invoice.paidAmount;
    const amountCents = Math.round(amount);
    if (amountCents > remainingBalance) {
      throw error(400, `Payment amount cannot exceed the remaining balance of $${(remainingBalance / 100).toFixed(2)}`);
    }
    const accessToken = private_env.SQUARE_ACCESS_TOKEN;
    const locationId = private_env.SQUARE_LOCATION_ID;
    if (!accessToken) {
      throw error(500, "SQUARE_ACCESS_TOKEN is not configured");
    }
    if (!locationId) {
      throw error(500, "SQUARE_LOCATION_ID is not configured");
    }
    const baseUrl = accessToken.startsWith("EAAAl") ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    const isPartial = amountCents < remainingBalance;
    const paymentName = `King Law – ${invoice.description}${isPartial ? " (Partial Payment)" : ""}`;
    const paymentDescription = [
      `Invoice: ${invoice.id}`,
      `Case: ${caseData.title}`,
      isPartial ? `Partial payment of $${(amountCents / 100).toFixed(2)}` : "Full payment"
    ].join(" | ");
    const idempotencyKey = crypto.randomUUID();
    const squareResponse = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-12-18",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: paymentName,
          price_money: {
            amount: amountCents,
            currency: "USD"
          },
          location_id: locationId
        },
        description: paymentDescription
      })
    });
    const squareResult = await squareResponse.json();
    if (!squareResponse.ok) {
      console.error("Square API error:", JSON.stringify(squareResult, null, 2));
      const errorMessage = squareResult.errors?.[0]?.detail || squareResult.errors?.[0]?.code || "Square API request failed";
      throw error(squareResponse.status, errorMessage);
    }
    const newPaidAmount = invoice.paidAmount + amountCents;
    const newStatus = newPaidAmount >= invoice.amount ? "paid" : "partial";
    await db.update(invoices).set({
      paidAmount: newPaidAmount,
      status: newStatus,
      ...newStatus === "paid" ? { paidAt: Math.floor(Date.now() / 1e3) } : {}
    }).where(eq(invoices.id, params.id));
    return json({
      url: squareResult.payment_link?.url,
      id: squareResult.payment_link?.id,
      order_id: squareResult.payment_link?.order_id,
      invoiceUpdated: true,
      newStatus
    });
  } catch (err) {
    console.error("Invoice payment error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to process payment");
  }
};
export {
  POST
};
