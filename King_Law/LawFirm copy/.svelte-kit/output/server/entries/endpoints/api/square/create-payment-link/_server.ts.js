import { json } from "@sveltejs/kit";
import { b as private_env } from "../../../../../chunks/shared-server.js";
const POST = async ({ request }) => {
  try {
    const { name, amount, description } = await request.json();
    if (!name || !amount) {
      return json({ error: "Missing required fields: name and amount" }, { status: 400 });
    }
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      return json({ error: "Invalid amount. Must be a positive number." }, { status: 400 });
    }
    const accessToken = private_env.SQUARE_ACCESS_TOKEN;
    const locationId = private_env.SQUARE_LOCATION_ID;
    if (!accessToken) {
      return json({ error: "SQUARE_ACCESS_TOKEN is not configured" }, { status: 500 });
    }
    if (!locationId) {
      return json({ error: "SQUARE_LOCATION_ID is not configured" }, { status: 500 });
    }
    const baseUrl = accessToken.startsWith("EAAAl") ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    const idempotencyKey = crypto.randomUUID();
    const body = {
      idempotency_key: idempotencyKey,
      quick_pay: {
        name,
        price_money: {
          amount: amountCents,
          currency: "USD"
        },
        location_id: locationId
      }
    };
    if (description) {
      body.description = description;
    }
    const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-12-18",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Square API error:", JSON.stringify(result, null, 2));
      const errorMessage = result.errors?.[0]?.detail || result.errors?.[0]?.code || "Square API request failed";
      return json({ error: errorMessage }, { status: response.status });
    }
    return json({
      url: result.payment_link?.url,
      id: result.payment_link?.id,
      order_id: result.payment_link?.order_id
    });
  } catch (error) {
    console.error("Failed to create Square payment link:", error);
    return json(
      {
        error: "Failed to create payment link",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
export {
  POST
};
