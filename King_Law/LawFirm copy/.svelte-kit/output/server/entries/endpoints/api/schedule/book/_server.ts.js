import { json } from "@sveltejs/kit";
import { d as db, h as appointments } from "../../../../../chunks/index3.js";
import { a as generateId } from "../../../../../chunks/auth.js";
import { i as isSlotFree, c as createEvent } from "../../../../../chunks/google-calendar.js";
function toICSDate(isoStr) {
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  return d.getUTCFullYear().toString() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
}
function escapeICS(text) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function generateICS(event) {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@kinglaw`;
  const now = toICSDate((/* @__PURE__ */ new Date()).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//King Law//Consultation Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(event.start)}`,
    `DTEND:${toICSDate(event.end)}`,
    `SUMMARY:${escapeICS(event.summary)}`
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
function buildGoogleCalendarUrl(event) {
  const fmt = (iso) => toICSDate(iso).replace("Z", "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${fmt(event.start)}Z/${fmt(event.end)}Z`,
    details: event.description || "",
    location: event.location || ""
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
const POST = async ({ request }) => {
  try {
    const { firstName, lastName, email, phone, matterType, currentlyRepresented, briefDescription, urgency, start, end } = await request.json();
    if (!firstName || !lastName || !email || !start || !end) {
      return json({ error: "Missing required fields." }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Invalid email address." }, { status: 400 });
    }
    const free = await isSlotFree(start, end);
    if (!free) {
      return json(
        { error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }
    const googleEventId = await createEvent(start, end, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || void 0,
      matterType: matterType || void 0,
      currentlyRepresented: currentlyRepresented || void 0,
      briefDescription: briefDescription?.trim() || void 0,
      urgency: urgency || void 0
    });
    const [appointment] = await db.insert(appointments).values({
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      matterType: matterType || null,
      currentlyRepresented: currentlyRepresented || null,
      briefDescription: briefDescription?.trim() || null,
      urgency: urgency || null,
      startTime: start,
      endTime: end,
      googleEventId,
      status: "confirmed"
    }).returning();
    console.log("📅 Appointment booked:", {
      id: appointment.id,
      name: `${firstName} ${lastName}`,
      start,
      end,
      googleEventId
    });
    const summary = `Consultation with King Law – ${firstName} ${lastName}`;
    const descParts = [
      "Your consultation with King Law is confirmed.",
      `Matter: ${matterType || "General"}`,
      currentlyRepresented ? `Currently Represented: ${currentlyRepresented}` : "",
      urgency ? `Urgency: ${urgency}` : "",
      `Contact: ${email}`
    ].filter(Boolean);
    const description = descParts.join("\n");
    const icsContent = generateICS({ summary, description, start, end });
    const googleCalendarUrl = buildGoogleCalendarUrl({ summary, description, start, end });
    return json({
      success: true,
      appointment: {
        id: appointment.id,
        start,
        end
      },
      icsContent,
      googleCalendarUrl
    });
  } catch (err) {
    console.error("Booking error:", err);
    return json({ error: "Failed to book appointment. Please try again." }, { status: 500 });
  }
};
export {
  POST
};
