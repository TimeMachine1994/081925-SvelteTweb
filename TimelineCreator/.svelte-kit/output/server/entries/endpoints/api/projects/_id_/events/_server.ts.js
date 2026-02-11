import { error, json } from "@sveltejs/kit";
import { d as db, p as project, a as projectSettings, c as cachedEvents } from "../../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { g as generateId } from "../../../../../../chunks/id.js";
import { f as fetchGoogleSheetsCSV, p as parseCSV } from "../../../../../../chunks/csv-parser.js";
const CACHE_TTL_MS = 5 * 60 * 1e3;
const POST = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  const body = await request.json();
  const { events, errors } = body;
  const [existingCache] = await db.select().from(cachedEvents).where(eq(cachedEvents.projectId, params.id));
  const eventData = JSON.stringify({ events, errors });
  if (existingCache) {
    await db.update(cachedEvents).set({ eventData, cachedAt: /* @__PURE__ */ new Date() }).where(eq(cachedEvents.projectId, params.id));
  } else {
    await db.insert(cachedEvents).values({
      id: generateId(),
      projectId: params.id,
      eventData,
      cachedAt: /* @__PURE__ */ new Date()
    });
  }
  return json({ success: true, count: events.length });
};
const GET = async ({ params, url, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const forceRefresh = url.searchParams.get("refresh") === "true";
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  if (!project$1.dataSourceUrl) {
    return json({ events: [], errors: ["No data source configured"], cached: false });
  }
  const [settings] = await db.select().from(projectSettings).where(eq(projectSettings.projectId, params.id));
  let columnMapping;
  if (settings?.columnMapping) {
    try {
      columnMapping = JSON.parse(settings.columnMapping);
      console.log("Using saved column mapping:", columnMapping);
    } catch (e) {
      console.error("Failed to parse column mapping:", e);
    }
  }
  if (!forceRefresh) {
    const [cached] = await db.select().from(cachedEvents).where(eq(cachedEvents.projectId, params.id));
    if (cached && cached.cachedAt) {
      const age = Date.now() - cached.cachedAt.getTime();
      if (age < CACHE_TTL_MS) {
        const eventData = cached.eventData ? JSON.parse(cached.eventData) : { events: [], errors: [] };
        return json({ ...eventData, cached: true, cachedAt: cached.cachedAt });
      }
    }
  }
  try {
    const csvText = await fetchGoogleSheetsCSV(project$1.dataSourceUrl);
    const parsed = parseCSV(csvText, columnMapping);
    const [existingCache] = await db.select().from(cachedEvents).where(eq(cachedEvents.projectId, params.id));
    if (existingCache) {
      await db.update(cachedEvents).set({
        eventData: JSON.stringify(parsed),
        cachedAt: /* @__PURE__ */ new Date()
      }).where(eq(cachedEvents.projectId, params.id));
    } else {
      await db.insert(cachedEvents).values({
        id: generateId(),
        projectId: params.id,
        eventData: JSON.stringify(parsed),
        cachedAt: /* @__PURE__ */ new Date()
      });
    }
    return json({ ...parsed, cached: false });
  } catch (err) {
    const [cached] = await db.select().from(cachedEvents).where(eq(cachedEvents.projectId, params.id));
    if (cached && cached.eventData) {
      const eventData = JSON.parse(cached.eventData);
      return json({
        ...eventData,
        cached: true,
        cachedAt: cached.cachedAt,
        warning: "Using cached data - fetch failed: " + (err instanceof Error ? err.message : "Unknown error")
      });
    }
    throw error(500, "Failed to fetch CSV: " + (err instanceof Error ? err.message : "Unknown error"));
  }
};
export {
  GET,
  POST
};
