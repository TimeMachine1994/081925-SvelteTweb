# WHIP + Mux MVP Plan

## Summary
- **Goal**: Minimal, reliable livestream MVP using browser WHIP ingest to Cloudflare with immediate simulcast to Mux.
- **Source of truth for VOD**: Mux assets.
- **Simplicity first**: One-click session creation; viewers can toggle visibility; minimal actions for operators.

## Non-Negotiable Decisions (User Notes Applied)
- **Immediate Mux Output**: Enable Cloudflare → Mux simulcast as soon as WHIP is live.
- **VOD Ownership**: Treat Mux as the authoritative store for recordings and playback.
- **Roles**: `admin` and `funeral_director` can create live sessions. Owners/viewers cannot.
- **UI Actions on Card**: `Stop Stream`, `Hide`, `Archive`.
- **Viewer Toggle**: Keep simple; hide/show controls affect public visibility only.

## Scope (MVP)
- Create live session (provisions Cloudflare Live Input with recording automatic; creates Mux live stream; wires Cloudflare Live Output to Mux).
- Publisher receives `whipUrl` and can start from browser.
- Immediate simulcast to Mux.
- On stop, mark session ended; wait for Mux webhook to attach VOD.
- Show a simple card with Stop/Hide/Archive; show basic status.

## Data Model (Streams Collection)
- `id` (doc id)
- `memorialId`
- `title`
- `status`: `ready | live | completed | error`
- `visibility`: `public | hidden | archived`
- `cloudflare`: `{ liveInputId, whipUrl }`
- `mux`: `{ liveStreamId, streamKey, playbackId?, assetId? }`
- `createdBy`, `createdAt`, `updatedAt`, `startedAt?`, `endedAt?`

Notes:
- Mux VOD is source of truth; store `assetId` and/or `playbackId` when webhook arrives.
- Cloudflare recordings are ignored for MVP (optional future use).

## Backend API (SvelteKit)
- `POST /api/streams/live-session`
  - Roles: `admin | funeral_director` only
  - Body: `{ memorialId, title? }`
  - Steps:
    1) Create Cloudflare Live Input with `recording.mode = "automatic"`.
    2) Create Mux Live Stream, capture `streamKey`, `playbackId` (if provided), `id`.
    3) Create Cloudflare Live Output (url=Mux RTMP/RTMPS, streamKey=from Mux). Enable immediately.
    4) Persist stream doc; return `{ whipUrl, streamId }`.

- `POST /api/streams/:id/stop`
  - Marks stream as stopping; optionally disable Live Output; triggers publisher to end; sets `status=completed` when webhook confirms.

- `POST /api/streams/:id/hide`
  - Sets `visibility=hidden`.

- `POST /api/streams/:id/archive`
  - Sets `visibility=archived` and prevents further edits; remains for records/VOD link.

- `POST /api/webhooks/mux`
  - Handle events: `video.live_stream.connected`, `video.live_stream.disconnected`, `video.asset.ready`.
  - On `asset.ready`: attach `mux.assetId` (and `playbackId`), set `status=completed`, set `endedAt`.

- `POST /api/webhooks/cloudflare` (Future/Optional)
  - For live input status if needed; not required for MVP.

## Environment Variables
- Cloudflare: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN` (scope: Stream)
- Mux: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- Webhook secrets: `MUX_WEBHOOK_SECRET`, optional `CLOUDFLARE_WEBHOOK_SECRET`

## Frontend (MVP UI)
- Route: `/memorials/[id]/streams`
- Single centered card (already scaffolded) with:
  - Title and description (static for now)
  - Buttons: `Stop Stream`, `Hide`, `Archive` (non-functional until API wired)
  - Status badge: `Ready | Live | Completed | Hidden | Archived`
- Flow:
  - `Create Session` button (for roles) → calls `POST /api/streams/live-session` → receives `whipUrl`.
  - Publisher page can use a minimal WHIP client to start.
  - Viewers see live embed (Mux playback if available or WHEP preview for operator only—MVP can defer preview).

## Session Lifecycle
1) Create session → `status=ready`.
2) Publisher starts WHIP → Cloudflare Live Input live → Output forwards to Mux immediately.
3) Live ends: publisher stops → Mux emits `disconnected` and later `asset.ready`.
4) On `asset.ready`: persist `assetId/playbackId`, set `status=completed`.
5) Visibility controlled independently: `public|hidden|archived`.

## Permissions
- Create session: `admin`, `funeral_director`.
- Stop/hide/archive: same roles.
- View public streams: everyone; hidden only for admins/FDs.

## Testing Plan (MVP)
- Unit: API input validation and role checks.
- Integration: end-to-end flow using sandbox keys (CF+Mux), confirm webhook persistence.
- Manual: mobile browser publish test; verify Mux live; verify VOD asset creation.

## Rollout
- Dev → Staging with sandbox keys.
- Add webhook endpoints and secrets; verify signatures.
- Minimal analytics/logging; alert on webhook failures.

## Out of Scope (MVP)
- Multi-method ingest options (OBS RTMP direct, SRT).
- Advanced analytics.
- Cloudflare recordings UI.
- Complex scheduling/sync with calculator.
