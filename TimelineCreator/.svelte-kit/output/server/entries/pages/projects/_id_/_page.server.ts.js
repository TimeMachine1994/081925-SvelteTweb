import { redirect, error } from "@sveltejs/kit";
import { d as db, p as project, a as projectSettings, c as cachedEvents, b as printLayout } from "../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const load = async ({ params, locals }) => {
  if (!locals.user) {
    return redirect(302, "/demo/lucia/login");
  }
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  const [settings] = await db.select().from(projectSettings).where(eq(projectSettings.projectId, params.id));
  const [cachedEvents$1] = await db.select().from(cachedEvents).where(eq(cachedEvents.projectId, params.id));
  const [printLayout$1] = await db.select().from(printLayout).where(eq(printLayout.projectId, params.id));
  let events = { events: [], errors: [] };
  if (cachedEvents$1?.eventData) {
    try {
      events = JSON.parse(cachedEvents$1.eventData);
    } catch {
      events = { events: [], errors: ["Failed to parse cached events"] };
    }
  }
  return {
    project: project$1,
    settings,
    events,
    printLayout: printLayout$1?.layoutData ? JSON.parse(printLayout$1.layoutData) : null
  };
};
export {
  load
};
