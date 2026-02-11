import { redirect, fail } from "@sveltejs/kit";
import { d as db, b as printLayout, c as cachedEvents, a as projectSettings, p as project } from "../../chunks/index3.js";
import { eq, desc } from "drizzle-orm";
import { g as generateId } from "../../chunks/id.js";
const load = async ({ locals }) => {
  if (!locals.user) {
    return redirect(302, "/demo/lucia/login");
  }
  const projects = await db.select({
    id: project.id,
    title: project.title,
    dataSourceUrl: project.dataSourceUrl,
    dataSourceType: project.dataSourceType,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }).from(project).where(eq(project.userId, locals.user.id)).orderBy(desc(project.updatedAt));
  return { projects, user: locals.user };
};
const actions = {
  create: async ({ locals }) => {
    if (!locals.user) {
      return redirect(302, "/demo/lucia/login");
    }
    const projectId = generateId();
    const settingsId = generateId();
    const now = /* @__PURE__ */ new Date();
    await db.insert(project).values({
      id: projectId,
      userId: locals.user.id,
      title: "Untitled Timeline",
      dataSourceUrl: null,
      dataSourceType: "google_sheets",
      createdAt: now,
      updatedAt: now
    });
    await db.insert(projectSettings).values({
      id: settingsId,
      projectId
    });
    throw redirect(302, `/projects/${projectId}`);
  },
  delete: async ({ request, locals }) => {
    if (!locals.user) {
      return redirect(302, "/demo/lucia/login");
    }
    const formData = await request.formData();
    const projectId = formData.get("projectId");
    if (!projectId) {
      return fail(400, { error: "Project ID is required" });
    }
    await db.delete(printLayout).where(eq(printLayout.projectId, projectId));
    await db.delete(cachedEvents).where(eq(cachedEvents.projectId, projectId));
    await db.delete(projectSettings).where(eq(projectSettings.projectId, projectId));
    await db.delete(project).where(eq(project.id, projectId));
    return { success: true };
  }
};
export {
  actions,
  load
};
