import { error, json } from "@sveltejs/kit";
import { d as db, b as documents, u as user, m as messages } from "../../../../../chunks/index3.js";
import { a as generateId } from "../../../../../chunks/auth.js";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { eq } from "drizzle-orm";
const UPLOAD_DIR = "uploads/documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "text/plain"
];
const POST = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  if (locals.user.role === "staff") {
    throw error(403, "Staff members cannot send messages");
  }
  try {
    const contentType = request.headers.get("content-type") || "";
    let messageData = {};
    let attachmentDocumentId = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const caseId2 = formData.get("caseId")?.toString() || null;
      const recipientId2 = formData.get("recipientId")?.toString() || null;
      const content2 = formData.get("content")?.toString() || "";
      const file = formData.get("file");
      messageData = { caseId: caseId2, recipientId: recipientId2, content: content2 };
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          throw error(400, "File size exceeds 10MB limit");
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw error(400, "Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT");
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
          caseId: caseId2,
          uploadedById: locals.user.id,
          fileName,
          filePath,
          fileSize: file.size,
          mimeType: file.type
        }).returning();
        attachmentDocumentId = document.id;
      }
    } else {
      const body = await request.json();
      messageData = body;
    }
    const { caseId, recipientId, content } = messageData;
    console.log("📨 Message send request:", {
      caseId,
      recipientId,
      content,
      contentType: typeof content,
      messageDataKeys: Object.keys(messageData)
    });
    if (!content?.trim() && !attachmentDocumentId) {
      throw error(400, "Message content or attachment is required");
    }
    let validRecipientId = null;
    if (recipientId && typeof recipientId === "string" && recipientId.trim()) {
      const [recipient] = await db.select({ id: user.id }).from(user).where(eq(user.id, recipientId)).limit(1);
      if (recipient) {
        validRecipientId = recipient.id;
      }
    }
    const [message] = await db.insert(messages).values({
      id: generateId(),
      caseId: caseId || null,
      senderId: locals.user.id,
      recipientId: validRecipientId,
      content: content?.trim() || "",
      attachmentDocumentId
    }).returning();
    return json({ success: true, message });
  } catch (err) {
    console.error("Message send error:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to send message");
  }
};
export {
  POST
};
