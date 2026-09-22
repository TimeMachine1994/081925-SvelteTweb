# Premiere (Upload & Schedule) Flow — Next Steps

Status: implemented, not yet verified end-to-end against real Mux webhooks.

## What's already done
- Admin can create a "premiere" livestream block (source toggle: "Live broadcast (OBS/RTMP)" vs "Upload & Schedule (Premiere)") in the memorial block editor.
- Admin uploads a video file from `StreamCard` via a resumable `@mux/upchunk` upload straight to Mux (no server proxy).
- Webhook handler (`/api/webhooks/mux`) links the upload → asset → stream via `passthrough`, and marks it ready without flipping `status` to `completed` prematurely.
- Public memorial page (`MemorialStreamDisplay.svelte`) shows the existing countdown, then a synced "premiere" player (`PremierePlayer.svelte`) that seeks every viewer to the same elapsed offset once the countdown ends, then auto-promotes the stream to a normal downloadable recording once its scheduled runtime has elapsed.
- `npm run check` / `npm run build` verified clean (no new errors vs. baseline).

## What I need to do next

1. **End-to-end test against real Mux webhooks** (this was not exercised in this session — no live Mux account access):
   - Create an "Upload & Schedule" stream with a start time a couple minutes out.
   - Upload a short (~30s) test clip via the `StreamCard` upload widget.
   - Confirm in the Mux dashboard / logs that `video.upload.asset_created` and `video.asset.ready` webhooks arrive and are correctly linked via `passthrough` (not `live_stream_id`).
   - Confirm the countdown → "Join the Service" → synced playback → auto-flip to "Service Recording" (with working download) all happen correctly on the public page.
   - Also use Mux Dashboard's "Send test webhook" for `video.upload.errored` / `video.upload.cancelled` to confirm the error path marks the stream `status: 'error'` correctly.
2. **Regression-check the existing RTMP/OBS flow** end-to-end (create a normal live stream, go live in OBS, confirm nothing broke from the `sourceType` changes).
3. **Decide on follow-ups explicitly deferred from the original plan** (not started):
   - Live viewer counter (currently stubbed/skipped everywhere, including for premieres).
   - True RTMP restreaming ("Option B" — actually broadcasting the uploaded file live via ffmpeg) if a genuinely live experience is ever needed instead of the simulated premiere.
   - Resuming an upload after the admin's browser tab is closed mid-upload (currently: they must click "Start Over").
   - Editing/replacing an uploaded file after processing has started (currently: delete the block/stream and redo it).

## Relevant files
- `frontend/src/lib/components/streaming/PremierePlayer.svelte`
- `frontend/src/lib/components/streaming/StreamCard.svelte`
- `frontend/src/lib/components/MemorialStreamDisplay.svelte`
- `frontend/src/lib/components/admin/memorial-editor/modals/AddBlockModal.svelte`
- `frontend/src/routes/api/streams/[streamId]/upload-url/+server.ts`
- `frontend/src/routes/api/webhooks/mux/+server.ts`
- `frontend/src/routes/api/memorials/[memorialId]/blocks/livestream/+server.ts`
- `frontend/src/lib/server/mux.ts`
- `frontend/src/lib/server/db/repos/streams.ts`
- `frontend/src/lib/types/stream.ts`, `frontend/src/lib/types/memorial-blocks.ts`

Full original plan (decisions, rationale, lifecycle diagram): `/Users/austin/.devin/plans/plan-be15e15331c76611.md`
