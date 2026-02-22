import { S3Client, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b as private_env } from "./shared-server.js";
const s3Client = new S3Client({
  region: private_env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: private_env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: private_env.AWS_SECRET_ACCESS_KEY || ""
  }
});
const BUCKET_NAME = private_env.AWS_S3_BUCKET || "kinglawbucket";
function getPublicUrl(key) {
  return `https://${BUCKET_NAME}.s3.${private_env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;
}
async function uploadFile(key, body, contentType, metadata) {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata
      })
    );
    const isPublic = key.startsWith("public/");
    const url = isPublic ? getPublicUrl(key) : await getPresignedDownloadUrl(key);
    return { success: true, url, key };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file to S3");
  }
}
async function uploadPublicFile(folder, fileName, body, contentType) {
  const key = `public/${folder}/${fileName}`;
  await uploadFile(key, body, contentType);
  return { url: getPublicUrl(key), key };
}
async function uploadCaseFile(caseId, fileName, body, contentType, uploadedBy) {
  const key = `private/cases/${caseId}/${fileName}`;
  await uploadFile(key, body, contentType, {
    uploadedBy,
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { key };
}
async function uploadClientFile(userId, fileName, body, contentType) {
  const key = `private/clients/${userId}/${fileName}`;
  await uploadFile(key, body, contentType);
  return { key };
}
async function uploadLawyerFile(userId, fileName, body, contentType) {
  const key = `private/lawyers/${userId}/${fileName}`;
  await uploadFile(key, body, contentType);
  return { key };
}
async function getPresignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}
async function deleteFile(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Failed to delete file from S3");
  }
}
async function listFiles(prefix, maxKeys = 100) {
  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys
      })
    );
    return (response.Contents || []).map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified || /* @__PURE__ */ new Date()
    }));
  } catch (error) {
    console.error("S3 list error:", error);
    throw new Error("Failed to list files from S3");
  }
}
async function listCaseFiles(caseId) {
  return listFiles(`private/cases/${caseId}/`);
}
async function listClientFiles(userId) {
  return listFiles(`private/clients/${userId}/`);
}
async function listLawyerFiles(userId) {
  return listFiles(`private/lawyers/${userId}/`);
}
function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_+/g, "_").toLowerCase();
}
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = sanitizeFileName(originalName);
  const ext = sanitized.split(".").pop() || "";
  const name = sanitized.replace(`.${ext}`, "");
  return `${name}_${timestamp}_${random}.${ext}`;
}
export {
  listLawyerFiles as a,
  listClientFiles as b,
  listCaseFiles as c,
  deleteFile as d,
  generateUniqueFileName as e,
  uploadClientFile as f,
  getPresignedDownloadUrl as g,
  uploadCaseFile as h,
  uploadPublicFile as i,
  listFiles as l,
  uploadLawyerFile as u
};
