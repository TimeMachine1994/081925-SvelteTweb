import { error, json } from "@sveltejs/kit";
import { d as db, p as project, a as projectSettings } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const GET = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  const [settings] = await db.select().from(projectSettings).where(eq(projectSettings.projectId, params.id));
  return json({ project: project$1, settings });
};
const PATCH = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [existing] = await db.select().from(project).where(eq(project.id, params.id));
  if (!existing) {
    throw error(404, "Project not found");
  }
  const body = await request.json();
  const { title, dataSourceUrl, dataSourceType, settings } = body;
  await db.update(project).set({
    ...title && { title },
    ...dataSourceUrl !== void 0 && { dataSourceUrl },
    ...dataSourceType && { dataSourceType },
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(project.id, params.id));
  if (settings) {
    await db.update(projectSettings).set({
      ...settings.colorTheme && { colorTheme: settings.colorTheme },
      ...settings.defaultZoomLevel && { defaultZoomLevel: settings.defaultZoomLevel },
      ...settings.labelConfig && { labelConfig: JSON.stringify(settings.labelConfig) },
      ...settings.masterTimelineHeight && {
        masterTimelineHeight: settings.masterTimelineHeight
      },
      ...settings.zoomTimelineHeight && { zoomTimelineHeight: settings.zoomTimelineHeight },
      ...settings.timelineStyle && { timelineStyle: settings.timelineStyle },
      ...settings.calendarGranularity && { calendarGranularity: settings.calendarGranularity },
      ...settings.colorMode && { colorMode: settings.colorMode },
      ...settings.eventColor && { eventColor: settings.eventColor },
      ...settings.showLegend !== void 0 && { showLegend: settings.showLegend },
      ...settings.columnMapping && { columnMapping: settings.columnMapping },
      ...settings.categoryConfig !== void 0 && { categoryConfig: settings.categoryConfig }
    }).where(eq(projectSettings.projectId, params.id));
  }
  return json({ success: true });
};
const DELETE = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [existing] = await db.select().from(project).where(eq(project.id, params.id));
  if (!existing) {
    throw error(404, "Project not found");
  }
  await db.delete(project).where(eq(project.id, params.id));
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PATCH
};
