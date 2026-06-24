---
Status: Draft
Last verified: 2026-06-24
Owner: TBD
Sources: src/routes/api/upload-image/+server.ts, frontend/storage.rules, src/lib/types/slideshow.ts, src/lib/server/firebase.ts
---

# 08 — Storage Migration (Firebase Storage → S3 / R2)

How files are stored today (Firebase Storage) and how they move to **S3 / R2** (S3-compatible — one `StorageProvider` covers both) behind the abstraction in `05`.

## 1. Current usage

- Init: `adminStorage = getStorage(adminApp)` in `firebase-admin.ts`; bucket via `adminStorage.bucket()`.
- Upload path (`api/upload-image/+server.ts`): **admin-only**; accepts `file` + `path`; validates image type + 5 MB max; saves buffer with metadata; `fileRef.makePublic()`; returns `https://storage.googleapis.com/<bucket>/<path>`.
- Client uploads: memorial photos + slideshow assets upload directly via the Firebase client SDK, governed by `storage.rules`.

### Storage layout (from `storage.rules`)

| Path prefix | Access | Notes |
| :--- | :--- | :--- |
| `blog/`, `blog-featured/`, `blog-authors/` | public read; admin write | blog images |
| `tributestream_advertisment/`, `tributestream_-_about_us/`, `Background.jpg` | public read; admin write | marketing media |
| `admin/` | admin read+write | general admin uploads |
| `memorials/{memorialId}/**` | public read; write: owner/family/FD/admin | memorial photos |
| `slideshows/{memorialId}/**` | public read; write: owner/family/FD/admin | slideshow videos+photos |
| `{allPaths}` (fallback) | admin only | backend ops |

### Data references to storage
- `MemorialSlideshow.firebaseStoragePath`, `.playbackUrl`, `.thumbnailUrl`
- `SlideshowPhoto.url`, `.storagePath`; `SlideshowAudio.url`, `.storagePath`
- `Memorial.imageUrl`, `Memorial.photos[]`
- Public URLs hardcoded as `storage.googleapis.com/<bucket>/...`

## 2. Target: S3 / R2

R2 exposes an S3-compatible API, so the same SDK (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) and the same `StorageProvider` interface work for either. Choose per env via `S3_ENDPOINT` (R2 uses an account-specific endpoint; AWS uses regional).

### Access model changes (important)
- **Turso is server-only and there is no storage rules engine.** Client SDK direct uploads must be replaced by **server-mediated uploads** or **presigned URLs**:
  - Small/admin images: keep server upload (like `upload-image`) via `StorageProvider.put`.
  - Large memorial/slideshow assets: issue a **presigned PUT URL** from a guarded endpoint (server checks `canEdit(memorial)` per the ported `storage.rules` logic in `03 §5`), browser PUTs directly to S3/R2.
- Public assets: serve via bucket public read or a CDN domain; private assets via presigned GET URLs.

### Bucket / key layout (proposed)
Keep the same key structure to simplify migration:
```
memorials/{memorialId}/{filename}
slideshows/{memorialId}/{filename}
blog/... blog-featured/... blog-authors/...
marketing/...            (was tributestream_advertisment, etc.)
admin/...
```

## 3. `StorageProvider` (recap from `05`)

```ts
storage.put(key, buf, { contentType, public })       // server upload
storage.getSignedUploadUrl(key, contentType)         // browser direct PUT
storage.getSignedDownloadUrl(key)                    // private read
storage.publicUrl(key)                               // CDN/public URL
storage.delete(key)
```

## 4. File + reference migration

1. **Copy objects**: enumerate Firebase Storage bucket; stream-copy each object to S3/R2 preserving the key.
2. **Rewrite DB references** during data migration (`03`): map `firebaseStoragePath`→`storage_path` (key), and replace `storage.googleapis.com/<bucket>/<key>` URLs with the new public/CDN URL or a key the app resolves via `storage.publicUrl(key)`. Prefer **storing keys, not absolute URLs**, so the host/CDN can change freely.
3. **Rename fields** away from "firebase" (`slideshow.ts`): `storage_path`, `playback_url`, `thumbnail_url`.
4. **Validation parity**: keep the 5 MB + image-type checks; add them to presigned-URL issuance (content-type + size limits via policy).

## 5. Risks / notes
- `makePublic()` has no direct S3 equivalent — use bucket policy / R2 public bucket, or always serve via presigned/CDN.
- Vercel function `maxDuration: 60` exists for large uploads; presigned direct-to-bucket uploads remove that pressure from the server.
- Confirm CORS config on the new bucket for browser presigned PUTs.

## Migration verdict

- **Migrate** all objects to S3/R2 preserving keys; **store keys not URLs** in Turso.
- **Rebuild** client direct-uploads as guarded presigned-URL flows (no storage rules engine).
- **Keep** the admin server-upload pattern (`upload-image`) but route via `StorageProvider`.
- **Refactor** `slideshow.ts` field names; **Cut** hardcoded `storage.googleapis.com` URLs.
