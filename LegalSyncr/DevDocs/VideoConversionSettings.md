 

---

## 1️⃣ Frame Rate: **CFR vs VFR**

### **Use CFR. Period.**

**Why CFR wins for your use case (HLS + scrubbing):**

* Predictable timestamps → **reliable seeking**
* Cleaner segment boundaries
* Fewer browser edge cases
* Easier transcript / timecode alignment (important if you ever sync text)

**VFR causes:**

* Scrub jumps that land slightly off
* Drift between audio/video over long durations
* Problems when segmenting HLS at exact boundaries

### **Decision**

* **CFR = 30fps**
* Always normalize input to CFR, even phone footage

 

> “All outputs must be constant frame rate. No VFR allowed.”

---

## 2️⃣ Bitrate Control: **CBR vs VBR**

This is where people get confused.

### ❌ Pure CBR (Don’t Use)

* Wastes bandwidth on static shots
* Still doesn’t guarantee perfect scrubbing
* Inferior quality at the same bitrate
* Not how modern streaming stacks operate

### ❌ Wild VBR (Also Don’t Use)

* Huge bitrate spikes
* Causes buffering and slow scrubs
* Makes CDN caching less predictable

### ✅ **Controlled VBR (This Is Correct)**

What you want is **constrained VBR**, sometimes called:

* “ABR-style VBR”
* “VBV-constrained VBR”

**What that means:**

* Average bitrate target (e.g. 5 Mbps)
* **Hard maxrate**
* **Reasonable buffer size**
* Predictable bitrate behavior across segments

### **Decision**

For 1080p:

* Target: **5,000 kbps**
* Maxrate: **5,000 kbps**
* Bufsize: **~2× maxrate**

This behaves *almost* like CBR, but with better quality.

---

## 3️⃣ Why This Combo Works Best for HLS

| Setting            | Result                          |
| ------------------ | ------------------------------- |
| CFR                | Accurate seeks, stable segments |
| Keyframes every 2s | Fast scrubbing                  |
| 4s HLS segments    | Low latency, responsive UI      |
| Controlled VBR     | Consistent buffering            |
| fMP4 (CMAF)        | Modern browser-friendly         |

This is **exactly** how serious VOD platforms do it.

---

## 4️⃣ Final Encoding Rules (Non-Negotiable)

Give this list to your developer verbatim:

### Video

* Codec: H.264 (High, Level 4.1)
* Frame rate: **30fps CFR**
* Pixel format: yuv420p
* Keyframes: every **2 seconds**
* Scene cut: disabled or constrained

### Bitrate (1080p)

* `b:v = 5000k`
* `maxrate = 5000k`
* `bufsize = 10000k`
* **VBR with VBV constraints**

### HLS

* Segment duration: **4s**
* fMP4 (CMAF)
* Independent segments
* VOD playlists

---

## 5️⃣ Reference FFmpeg Pattern (Correct)

```bash
-r 30 \
-g 60 -keyint_min 60 -sc_threshold 0 \
-b:v 5000k -maxrate 5000k -bufsize 10000k
```
 

## 6️⃣ TL;DR (Tell-It-Like-It-Is)

* **CFR is mandatory**
* **CBR is outdated**
* **Unbounded VBR is dangerous**
* **Constrained VBR + CFR + frequent keyframes = perfect scrubbing**

 
