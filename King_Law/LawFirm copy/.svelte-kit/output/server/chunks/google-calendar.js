import { google } from "googleapis";
import { b as private_env } from "./shared-server.js";
import { readFileSync } from "fs";
import { resolve } from "path";
const TIMEZONE = "America/New_York";
const SLOT_DURATION_MINUTES = 30;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;
let _cachedCreds = null;
function loadCredentials() {
  if (_cachedCreds) return _cachedCreds;
  const keyFilePath = private_env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || "gen-lang-client-0353730314-c2cd0c2d6329.json";
  try {
    const raw = readFileSync(resolve(keyFilePath), "utf-8");
    _cachedCreds = JSON.parse(raw);
    return _cachedCreds;
  } catch {
    if (private_env.GOOGLE_SERVICE_ACCOUNT_EMAIL && private_env.GOOGLE_PRIVATE_KEY) {
      _cachedCreds = {
        client_email: private_env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: private_env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      };
      return _cachedCreds;
    }
    throw new Error(
      "Google Calendar credentials not configured. Place your service account JSON key file at the project root or set GOOGLE_SERVICE_ACCOUNT_KEY_FILE."
    );
  }
}
function getAuth() {
  const creds = loadCredentials();
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  });
}
function getCalendarId() {
  return private_env.GOOGLE_CALENDAR_ID || "primary";
}
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE
  });
}
async function getAvailableSlots(dateStr) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const timeMin = buildRFC3339(dateStr, DAY_START_HOUR, TIMEZONE);
  const timeMax = buildRFC3339(dateStr, DAY_END_HOUR, TIMEZONE);
  const calendarId = getCalendarId();
  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      items: [{ id: calendarId }]
    }
  });
  const calendarData = freeBusyRes.data.calendars?.[calendarId];
  const busyPeriods = calendarData?.busy || [];
  const allSlots = [];
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1e3;
  let cursor = new Date(timeMin);
  const end = new Date(timeMax);
  while (cursor.getTime() + slotMs <= end.getTime()) {
    const slotEnd = new Date(cursor.getTime() + slotMs);
    allSlots.push({
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
      display: `${formatTime(cursor)} – ${formatTime(slotEnd)}`
    });
    cursor = slotEnd;
  }
  return allSlots.filter((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    return !busyPeriods.some((busy) => {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}
async function isSlotFree(start, end) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: start,
      timeMax: end,
      timeZone: TIMEZONE,
      items: [{ id: getCalendarId() }]
    }
  });
  const busyPeriods = freeBusyRes.data.calendars?.[getCalendarId()]?.busy || [];
  return busyPeriods.length === 0;
}
async function createEvent(start, end, client) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const description = [
    `Client: ${client.firstName} ${client.lastName}`,
    `Email: ${client.email}`,
    client.phone ? `Phone: ${client.phone}` : "",
    client.matterType ? `Matter: ${client.matterType}` : "",
    client.currentlyRepresented ? `Currently Represented: ${client.currentlyRepresented}` : "",
    client.urgency ? `Urgency: ${client.urgency}` : "",
    client.briefDescription ? `Description: ${client.briefDescription}` : ""
  ].filter(Boolean).join("\n");
  const event = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: {
      summary: `Consultation – ${client.firstName} ${client.lastName}`,
      description,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 }
        ]
      }
    }
  });
  return event.data.id;
}
function getTimezoneOffset(dateStr, tz) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset"
  });
  const refDate = /* @__PURE__ */ new Date(`${dateStr}T12:00:00Z`);
  const parts = formatter.formatToParts(refDate);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  const offset = tzPart?.value?.replace("GMT", "") || "+00:00";
  return offset === "" ? "+00:00" : offset;
}
function buildRFC3339(dateStr, hour, tz) {
  const h = String(hour).padStart(2, "0");
  const offset = getTimezoneOffset(dateStr, tz);
  return `${dateStr}T${h}:00:00${offset}`;
}
export {
  createEvent as c,
  getAvailableSlots as g,
  isSlotFree as i
};
