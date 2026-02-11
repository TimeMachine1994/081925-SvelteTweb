import { error, json } from "@sveltejs/kit";
import { d as db, p as project, b as printLayout } from "../../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { g as generateId } from "../../../../../../chunks/id.js";
const GET = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  const [layout] = await db.select().from(printLayout).where(eq(printLayout.projectId, params.id));
  if (!layout) {
    return json({ layout: null });
  }
  return json({
    layout: {
      ...layout,
      layoutData: layout.layoutData ? JSON.parse(layout.layoutData) : null
    }
  });
};
const PUT = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  const [project$1] = await db.select().from(project).where(eq(project.id, params.id));
  if (!project$1) {
    throw error(404, "Project not found");
  }
  const body = await request.json();
  const { layoutData } = body;
  const [existing] = await db.select().from(printLayout).where(eq(printLayout.projectId, params.id));
  if (existing) {
    await db.update(printLayout).set({
      layoutData: JSON.stringify(layoutData),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(printLayout.projectId, params.id));
  } else {
    await db.insert(printLayout).values({
      id: generateId(),
      projectId: params.id,
      layoutData: JSON.stringify(layoutData),
      updatedAt: /* @__PURE__ */ new Date()
    });
  }
  return json({ success: true });
};
export {
  GET,
  PUT
};
