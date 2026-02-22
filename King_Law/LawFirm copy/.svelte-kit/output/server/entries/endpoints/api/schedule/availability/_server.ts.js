import { json } from "@sveltejs/kit";
import { g as getAvailableSlots } from "../../../../../chunks/google-calendar.js";
const GET = async ({ url }) => {
  const dateStr = url.searchParams.get("date");
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return json({ error: "Invalid date parameter. Use YYYY-MM-DD format." }, { status: 400 });
  }
  const requested = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  if (requested < today) {
    return json({ error: "Cannot check availability for past dates." }, { status: 400 });
  }
  const day = requested.getDay();
  if (day === 0 || day === 6) {
    return json({ slots: [], message: "The office is closed on weekends." });
  }
  try {
    const slots = await getAvailableSlots(dateStr);
    return json({ slots });
  } catch (err) {
    const gaxErr = err;
    if (gaxErr?.response?.data?.error) {
      console.error("Google Calendar API error:", JSON.stringify(gaxErr.response.data.error, null, 2));
    } else {
      console.error("Failed to fetch availability:", gaxErr?.message || err);
    }
    return json({ error: "Failed to fetch availability. Please try again." }, { status: 500 });
  }
};
export {
  GET
};
