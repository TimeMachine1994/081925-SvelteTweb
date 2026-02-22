import { error, json } from "@sveltejs/kit";
import { d as db, b as documents } from "../../../../../chunks/index3.js";
import { a as generateId } from "../../../../../chunks/auth.js";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
const UPLOAD_DIR = "uploads/documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const caseId = formData.get("caseId")?.toString() || null;
    if (!file) {
      throw error(400, "No file provided");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw error(400, "File size exceeds 10MB limit");
    }
    const fileId = generateId();
    const fileExt = file.name.split(".").pop();
    const fileName = file.name;
    const filePath = join(UPLOAD_DIR, `${fileId}.${fileExt}`);
    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    const [document] = await db.insert(documents).values({
      id: fileId,
      caseId,
      uploadedById: locals.user.id,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: file.type
    }).returning();
    return json({ success: true, document });
  } catch (err) {
    console.error("Document upload error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to upload document");
  }
};
export {
  POST
};
