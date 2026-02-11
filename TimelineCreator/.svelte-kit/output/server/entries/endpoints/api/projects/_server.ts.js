import { error, json } from "@sveltejs/kit";
import { d as db, p as project, a as projectSettings } from "../../../../chunks/index3.js";
import { g as generateId } from "../../../../chunks/id.js";
import { desc } from "drizzle-orm";
const GET = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const projects = await db.select({
    id: project.id,
    title: project.title,
    dataSourceUrl: project.dataSourceUrl,
    dataSourceType: project.dataSourceType,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }).from(project).orderBy(desc(project.updatedAt));
  return json({ projects });
};
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const body = await request.json();
  const { title, dataSourceUrl, dataSourceType, settings } = body;
  if (!title || typeof title !== "string") {
    throw error(400, "Title is required");
  }
  const projectId = generateId();
  const settingsId = generateId();
  const now = /* @__PURE__ */ new Date();
  await db.insert(project).values({
    id: projectId,
    userId: locals.user.id,
    title,
    dataSourceUrl: dataSourceUrl || null,
    dataSourceType: dataSourceType || "google_sheets",
    createdAt: now,
    updatedAt: now
  });
  await db.insert(projectSettings).values({
    id: settingsId,
    projectId,
    colorTheme: settings?.colorTheme || "default",
    defaultZoomLevel: settings?.defaultZoomLevel || "month",
    labelConfig: settings?.labelConfig ? JSON.stringify(settings.labelConfig) : null,
    masterTimelineHeight: settings?.masterTimelineHeight || 120,
    zoomTimelineHeight: settings?.zoomTimelineHeight || 400
  });
  return json({ id: projectId }, { status: 201 });
};
export {
  GET,
  POST
};
