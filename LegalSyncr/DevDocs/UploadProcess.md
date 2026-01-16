

# HLS Video Ingest & Encoding — To-Do List

## A. Lock the Standards (No Debates)

* [ ] Use **HLS (VOD)**, not live
* [ ] Use **CMAF fMP4** segments (not MPEG-TS)
* [ ] Max resolution **1080p**
* [ ] Max video bitrate **~5 Mbps**
* [ ] **30fps CFR only** (no VFR)
* [ ] **H.264 High / Level 4.1**
* [ ] **AAC stereo 48kHz**
* [ ] **4-second segments**
* [ ] **Keyframes every 2 seconds**
* [ ] **No upscaling**
* [ ] **No 4K**

---

## B. Input Intake

* [ ] Accept common containers: mp4, mov, mkv, webm, avi, mts/m2ts
* [ ] Accept common codecs: h264, hevc, vp9, av1, prores, etc.
* [ ] Accept common audio: aac, mp3, pcm, opus

---

## C. Probe the Input (Required First Step)

* [ ] Run `ffprobe` on upload
* [ ] Capture:

  * duration
  * resolution
  * frame rate (detect VFR)
  * video codec
  * audio presence + channels
  * rotation metadata
* [ ] Determine max ladder height = `min(input height, 1080)`

---

## D. Normalize the Input

* [ ] Convert **VFR → CFR (30fps)**
* [ ] Apply rotation metadata (phone videos)
* [ ] Preserve aspect ratio
* [ ] Pad to even dimensions if needed
* [ ] Downmix audio to stereo
* [ ] If no audio track → generate silent AAC

---

## E. Build Rendition Ladder

* [ ] 1080p → ~5000 kbps video + AAC 160 kbps
* [ ] 720p → ~2800 kbps video + AAC 128 kbps
* [ ] 480p → ~1200 kbps video + AAC 128 kbps
* [ ] (Optional) 360p → ~700 kbps video + AAC 96–128 kbps
* [ ] Do **not** generate renditions higher than input resolution

---

## F. Encode Each Rendition

For **every** rendition:

* [ ] H.264, profile High, level 4.1
* [ ] Pixel format yuv420p
* [ ] **30fps CFR**
* [ ] **Keyframes every 2 seconds**
* [ ] Scene-cut keyframes disabled or constrained
* [ ] **Constrained VBR**:

  * target bitrate
  * maxrate = target
  * bufsize ≈ 2× target

---

## G. Package to HLS (CMAF)

* [ ] Segment duration = **4 seconds**
* [ ] Use **fMP4 (.m4s) segments**
* [ ] Independent segments enabled
* [ ] Generate:

  * [ ] one playlist per rendition (`1080p.m3u8`, etc.)
  * [ ] one `master.m3u8` referencing all variants

---

## H. Validate Output (Automated)

* [ ] `master.m3u8` parses correctly
* [ ] All variant playlists exist
* [ ] All init segments + media segments exist
* [ ] First segment playable immediately
* [ ] (Optional) Headless playback sanity test

---

## I. Store & Serve

* [ ] Upload to object storage (S3 / R2 / equivalent)
* [ ] Set MIME types:

  * `.m3u8` → `application/vnd.apple.mpegurl`
  * `.m4s` / init segments → `video/mp4` (or CDN-recommended equivalent)
* [ ] Cache policy:

  * segments: long cache (immutable)
  * playlists: short cache or versioned

---

## J. Nice-to-Have (Optional, Later)

* [ ] Generate thumbnails + VTT preview track
* [ ] Loudness normalization
* [ ] WebVTT captions support
* [ ] Content hashing to avoid duplicate re-encodes

---

## Definition of “Done”

* Upload any common video → system outputs a playable `master.m3u8`
* Scrubbing is smooth on long videos
* Works in Safari, Chrome, Edge, Firefox
* No files exceed 1080p or ~5 Mbps
