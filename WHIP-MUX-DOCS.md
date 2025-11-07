Architecting a Unified WHIP-Based Streaming and Recording Pipeline with Cloudflare Stream and MUX
Executive Summary: Architecting the Unified WHIP-Based Streaming Pipeline
This report details the definitive architecture for a modern, low-latency streaming pipeline, designed to meet a specific set of objectives:
Ingest a live video stream into Cloudflare using the WebRTC-HTTP Ingestion Protocol (WHIP).
Automatically record the ingested WHIP stream as a video-on-demand (VOD) asset.
Simultaneously restream (simulcast) the live WHIP stream to MUX.
Deliver the live stream for playback on a front-end website.
This architecture is fully achievable using the Cloudflare Stream platform. Analysis of the platform's evolution reveals that while initial WebRTC beta documentation 1 explicitly stated that WHIP ingest could not be combined with features like recording, simulcasting, or standard HLS/DASH playback, these limitations are now resolved.
The solution is anchored in the Cloudflare Stream Live Input object. This object serves as an ingest-agnostic hub. By creating a single Live Input and configuring it for recording and simulcasting (via "Live Outputs"), any supported ingest protocol—whether WHIP, RTMPS, or SRT—can power the full suite of features. Recent platform upgrades, including the migration of Cloudflare's WHIP/WHEP services to the more robust Cloudflare Realtime (Calls) backend 3, have unified these once-siloed capabilities. This report provides the precise, step-by-step configuration for this unified pipeline.
Part 1: The Central Hub — Configuring the Cloudflare Stream Live Input
1.1. The Architectural Anchor: The Live Input Object
The central component of this entire architecture is the Cloudflare Stream Live Input object.4 This object should not be viewed as a simple endpoint, but rather as a central "channel" or processing hub. It is the resource to which all other components are logically attached:
Ingest: It provides the unique credentials for all supported ingest protocols, including WHIP, RTMPS, and SRT.5
Recording: Its configuration dictates if and how the incoming stream is recorded.4
Simulcasting: It acts as the source for "Live Outputs," which push the stream to third-party platforms.7
Playback: It generates the necessary URLs for live playback.8
The key to this architecture is that the user's goals are achieved not by configuring the WHIP protocol itself, but by configuring the Live Input that the WHIP stream will be sent to. This abstraction layer normalizes the ingested stream, making all features available regardless of the source.
1.2. Creating the Live Input via Cloudflare Dashboard
For testing and manual setup, the Live Input can be created through the Cloudflare Dashboard.
Log in to the Cloudflare Dashboard.
Navigate to the Stream section, and then select Live Inputs.6
Click "Create live input".
Provide a name for the input.
Critically, in the creation options, you must enable recording. This ensures the subsequent WHIP stream is automatically recorded, fulfilling a primary objective.
1.3. Creating the Live Input via API (Recommended for Production)
For a programmatic and repeatable production environment, creating the Live Input via the API is the recommended method. This is accomplished with a POST request to the /live_inputs endpoint.1
The most critical part of this request is the JSON body, which must include the recording parameter. By setting "mode": "automatic", the recording requirement is satisfied before the WHIP stream is ever initiated.6
Code Example (cURL):
Bash
curl -X POST \
     --header "Authorization: Bearer <API_TOKEN>" \
     --data '{"meta": {"name":"My WHIP-Powered Stream"}, "recording": { "mode": "automatic" }}' \
     https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs


1.4. Analyzing the API Response
The JSON object returned from this API call provides the essential credentials for the entire workflow. A successful response will contain the Live Input's uid and, most importantly, a webRTC object.1
Example API Response Snippet:
JSON
{
  "result": {
    "uid": "1a553f11a88915d093d45eda660d2f8c",
    "webRTC": {
      "url": "https://customer-<CODE>.cloudflarestream.com/<SECRET>/webRTC/publish"
    },
    "webRTCPlayback": {
      "url": "https://customer-<CODE>.cloudflarestream.com/<INPUT_UID>/webRTC/play"
    },
   ...
  },
  "success": true
}


uid: The unique ID for this Live Input. This is used in all future API calls related to this channel (e.g., configuring outputs, retrieving recordings).
webRTC.url: This is the WHIP Ingest URL. This URL is the destination for the broadcast client.
webRTCPlayback.url: This is the WHEP Egress URL, used for sub-second latency playback.
Part 2: Ingest — Connecting the WHIP Source
2.1. The WHIP Protocol Advantage
The decision to use WHIP (WebRTC-HTTP Ingestion Protocol) for ingest is strategic. As an IETF draft standard 10, WHIP is designed to standardize WebRTC-based ingest, moving away from proprietary SDKs.10 Its advantages over traditional RTMP include:
Sub-Second Latency: It enables near real-time ingest and playback.1
Native Browser Broadcasting: It allows a web application to broadcast directly from a user's camera, microphone, or screen without requiring any special software, a common request.2
Network Resilience: It is built on WebRTC (using UDP), which handles network disruptions and packet loss more gracefully than the TCP-based RTMP, making it superior for mobile and unstable networks.10
2.2. Client-Side Implementation: Browser (JavaScript)
Using the webRTC.url from Part 1.4, a broadcaster can go live from a simple web page. Cloudflare provides a minimal JavaScript client to handle the WHIP signaling.1
Code Example (JavaScript):
JavaScript
// Assumes Cloudflare's WHIPClient.js is available
// import WHIPClient from "./WHIPClient.js"; 

const url = "<WEBRTC_URL_FROM_YOUR_LIVE_INPUT>"; // From Part 1.4
const videoElement = document.getElementById("input-video"); // A local <video> element
const client = new WHIPClient(url, videoElement);
// The client will prompt for camera/mic permissions and begin streaming.


2.3. Client-Side Implementation: Encoders and Media Servers
WHIP is not limited to browsers. It is increasingly supported by professional software and media servers, allowing server-side or hardware-based low-latency ingest.
GStreamer: Can use the whipsink element to send a stream to a WHIP endpoint.13
MediaMTX (formerly rtsp-simple-server): Can be configured to forward RTSP or other streams to a WHIP endpoint.13
Cloudflare's WHIP ingest supports common WebRTC codecs, including VP8, VP9 3, and H.264 (Constrained Baseline Profile).14
2.4. Table: Ingest Protocol Comparison
The Live Input object supports multiple protocols. This table compares the options available for the same input.
Protocol
Typical Latency
Primary Use Case
Common Clients
WHIP
Sub-second
Browser/Mobile Ingest, Interactive
Web Browser 10, GStreamer 13, MediaMTX 13
RTMPS
Low (2-5 sec)
Traditional Broadcasting
OBS Studio, Wirecast, Hardware Encoders 4
SRT
Low (2-5 sec)
Professional Broadcast, Unreliable Networks
OBS Studio, Hardware Encoders 4

Part 3: Objective 1: Restreaming to MUX (Simulcasting)
3.1. Overview of the Simulcast Architecture
This section details the WHIP -> Cloudflare -> MUX data flow. The ingested WHIP stream can be restreamed using Cloudflare's "Simulcast" feature, which is managed as "Live Outputs" on the Live Input object.7 This feature, also referred to as Stream Connect 15, takes the single ingested feed and pushes it to one or more RTMP or RTMPS destinations.
This process involves a significant, fully-managed operation: Cloudflare's Live Input acts as a media relay and real-time transcoder. It ingests the WebRTC (WHIP) stream, which likely uses VP8/VP9 and Opus codecs. To be compatible with MUX's standard RTMP ingest 16, Cloudflare must transcode this feed on-the-fly to H.264 (video) and AAC (audio) before forwarding it. This complex process is handled transparently.
3.2. Step 1: MUX Target Configuration
Before configuring Cloudflare, the MUX destination must be created. This can be done via the MUX API or dashboard.
API Method: Send a POST request to https://api.mux.com/video/v1/live-streams.18
Dashboard Method: Manually create a new "Live Stream" in the MUX dashboard.21
This process will provide two essential values: the MUX RTMP/RTMPS URL and the MUX Stream Key.16
MUX Server URL: e.g., rtmp://global-live.mux.com:5222/app or rtmps://global-live.mux.com:443/app.16
MUX Stream Key: A unique alphanumeric string.
3.3. Step 2: Cloudflare Live Output Configuration (API)
With the MUX credentials, the next step is to programmatically link MUX as a "Live Output" to the Cloudflare Live Input created in Part 1. This is done by POSTing to the .../live_inputs/<INPUT_UID>/outputs endpoint.7
Code Example (cURL):
Bash
curl -X POST \
     --data '{"url": "rtmps://global-live.mux.com:443/app","streamKey": "<YOUR_MUX_STREAM_KEY>"}' \
     -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
     https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/live_inputs/<INPUT_UID_FROM_PART_1>/outputs


This request creates a persistent link. As soon as the WHIP stream becomes active on this Live Input, Cloudflare will automatically begin the transcode-and-forward process to MUX. A Live Input can support up to 50 concurrent simulcast outputs.7
3.4. Table: MUX-to-Cloudflare Credential Mapping
To avoid configuration errors, this table maps the MUX terminology to the required fields in the Cloudflare API call.
MUX Field
Example MUX Value
Cloudflare API Parameter
Description
Server URL
rtmps://global-live.mux.com:443/app
url
The RTMPS ingest URL provided by MUX.16
Stream Key
abc-123-xyz-789
streamKey
The unique stream key provided by MUX.16

3.5. Controlling the Simulcast
The simulcast is not an "all-or-nothing" feature. It can be controlled independently of the ingest. A Live Output can be enabled or disabled at any time via the Cloudflare dashboard 7 or by sending a PUT request to its specific API endpoint to set the enabled flag.7
This allows for a professional workflow:
A user starts their WHIP stream.
The stream can be verified in a private, internal-only player (see Part 4).
Once verified, the Live Output for MUX is toggled to enabled: true, starting the public restream.
Part 4: Objective 2: Playback on the Front-End Website (Egress)
4.1. The Multi-Egress Strategy
A single Live Input fed by a WHIP stream automatically generates playback URLs for all major protocols.4 This allows a developer to choose the right player technology for the desired use case, from real-time interactivity to broad device compatibility. This unified capability directly refutes the old beta limitation 1 that incorrectly suggested WHIP ingest could only be paired with WHEP egress.
4.2. Option 1: Sub-Second Latency Playback (WHEP)
Use Case: Ideal for real-time applications like auctions, live Q&A, or sports betting, where latency must be under one second.1
How-to: Use the webRTCPlayback.url obtained from the API response in Part 1.4.1
Client: Requires a WHEP-compatible player. Cloudflare provides a WHEPClient.js for this purpose.1
4.3. Option 2: Broad Compatibility (HLS & DASH)
Use Case: The standard for delivering streams to a wide audience across all devices (desktops, iOS, Android, smart TVs) where universal compatibility is paramount.4
How-to: The HLS and DASH manifest URLs are generated for each individual broadcast, not for the Live Input itself. A new broadcast creates a new Video ID. These manifests are retrievable from the dashboard 8 or, more practically, by querying the Live Input's video list via the API.8
API Call: GET /accounts/<ACCOUNT_ID>/stream/live_inputs/<LIVE_INPUT_UID>/videos
URL Formats 8:
HLS: https://customer-<CODE>.cloudflarestream.com/<VIDEO_ID>/manifest/video.m3u8
DASH: https://customer-<CODE>.cloudflarestream.com/<VIDEO_ID>/manifest/video.mpd
Note on Latency: Standard HLS/DASH latency is 10+ seconds. Cloudflare also offers Low-Latency HLS (LL-HLS) as a beta feature 3, which reduces latency to 2-5 seconds, providing a middle-ground between WHEP and standard HLS.
4.4. Table: Egress Protocol Comparison
Protocol
Typical Latency
Playback Compatibility
Recommended Player/SDK
Primary Use Case
WHEP
< 1 second
Low (requires WHEP client)
WHEPClient.js 12
Real-time Interactivity 1
LL-HLS
2-5 seconds
Moderate (LL-HLS player)
hls.js, Native (new iOS) 3
Low-latency broadcast
HLS/DASH
10-30 seconds
High (universal support)
hls.js, AVPlayer, ExoPlayer 24
Standard, large-scale viewing

4.5. Player Integration Guide
Option 1: The Cloudflare Stream Player (iFrame)
The simplest integration is to use Cloudflare's built-in player via an iFrame embed.8 The embed code can be retrieved from the dashboard or the API. This player automatically handles protocol selection (e.g., opting for LL-HLS where possible).
For programmatic control (play, pause, etc.), the Stream Player SDK can be used to interact with the iFrame.29
Code Example (HTML/JS):
HTML
<iframe
  src="https://customer-<CODE>.cloudflarestream.com/<VIDEO_ID>/iframe"
  style="border: none"
  height="720"
  width="1280"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
  id="stream-player"
></iframe>

<script src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>
<script>
  const player = Stream(document.getElementById('stream-player'));
  player.play();
</script>


Option 2: Third-Party Players (Bring-Your-Own-Player)
For full customization, the HLS or DASH manifest URLs from section 4.3 can be used with any compatible player.24
Web: hls.js, shaka-player, video.js
iOS (Native): AVPlayer
Android (Native): ExoPlayer
Part 5: Objective 3: Recording the WHIP Stream (Live-to-VOD)
5.1. The Automatic Recording Workflow (Live-to-VOD)
The requirement to record the WHIP stream is fulfilled entirely by the configuration set in Part 1.3. By creating the Live Input with recording: { "mode": "automatic" } 6, Cloudflare Stream is instructed to automatically and-to-end record every broadcast sent to that input, regardless of protocol.4
This capability is a core feature of the Live Input object and is not dependent on the ingest protocol. This directly refutes the outdated beta documentation 1 that stated recording was "not yet supported" for WHIP streams.
5.2. Seamless Transition: Live-to-VOD
When a live stream ends, the recording is processed and made available as a standard VOD asset "instantly" 30 or "within 60 seconds".4 The transition is seamless: the VIDEO_ID that was used for the live stream (see Part 4.3) now represents the VOD recording. Viewers watching the live stream may need to reload their player after 60 seconds to begin watching the recording.8
5.3. Accessing VOD Recordings via API
For building a media library or a "past broadcasts" list, the API is the primary method for accessing recordings. A GET request to the /live_inputs/<LIVE_INPUT_UID>/videos endpoint returns an array of video objects, each representing a single, completed broadcast.30
Code Example (cURL):
Bash
curl -X GET \
     -H "Authorization: Bearer <API_TOKEN>" \
     https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/live_inputs/<LIVE_INPUT_UID>/videos


The response will be an array of videos. Each video object will have a state of ready and contain its own unique VIDEO_ID, playback URLs, and manifest URLs, which can be stored and served to end-users.
5.4. Accessing VOD Recordings via Dashboard
For manual retrieval, recordings are associated with their parent Live Input.
In the Cloudflare Dashboard, navigate to Stream > Live Inputs.6
Click on the specific Live Input that was used for the WHIP stream.
A list or tab of associated recordings (videos) will be displayed. From this view, one can copy iFrame embeds, HLS manifests, or playback URLs for each VOD asset.4
Part 6: Expert Analysis: Ingest Parity and the Resolution of Beta-Era Limitations
6.1. The Historical Contradiction
A critical part of this analysis is resolving a direct contradiction in the available documentation. A developer reviewing the Cloudflare Stream WebRTC Beta documentation 1 would conclude this architecture is impossible. These documents explicitly state the following "Limitations while in beta":
"Recording is not yet supported (coming soon)"
"Simulcasting (restreaming) is not yet supported (coming soon)"
"WHIP and WHEP must be used together — we do not yet support... streaming using WHIP and playing using HLS or DASH. (coming soon)"
These limitations described a "siloed" WebRTC-only service, separate from the main Stream Live pipeline and its features.
6.2. The Unified Architecture (The Current Reality)
This report's architecture is based on the platform's current, General Availability (GA) capabilities. Newer documentation and changelogs demonstrate that these beta limitations have been resolved.
Ingest Parity: GA-level documentation, such as the "Behind the scenes with Stream Live" blog post from January 2025, describes the ingest side of Stream Live as a single system that accepts RTMPS, SRT, and WHIP as co-equal protocols for the same service.5
Platform Migration: A changelog entry from March 2025 3 announces, "Stream Live WHIP/WHEP will be progressively migrated to a new implementation powered by Cloudflare Realtime (Calls)."
6.3. The Architectural Conclusion
This evidence leads to a clear architectural conclusion. The user demand for WHIP to have feature parity with RTMP (specifically for recording and HLS playback) was high.2 The 2025 "migration to Cloudflare Realtime (Calls)" 3 was the unification event that graduated WHIP from its isolated beta.
This migration solidified the Live Input object (from Part 1) as a true abstraction layer. The platform now normalizes all ingest protocols (WHIP, RTMP, SRT) into a common internal format, which is then fed into the main Stream Live pipeline.
This means that all features of the Stream Live pipeline—including recording: "automatic" 4, "Live Outputs" (Simulcasting) 7, and the automatic generation of HLS/DASH manifests 4—are now available to all ingest protocols, including WHIP. The beta-era limitations are factually deprecated. The architecture requested by the user is not only possible; it is now the standard, intended design of the Cloudflare Stream platform.
Part 7: Advanced Architectural Alternatives and Cost Analysis
7.1. Solution A: Managed Cloudflare Stream (This Report's Focus)
Architecture: The end-to-end managed solution detailed in Parts 1-5 of this report.
Pricing Model: This solution uses Cloudflare Stream, which has a simple, predictable pricing model. Billing is based on two dimensions only: "Minutes of video stored" (for the recordings) and "Minutes of video delivered" (for playback).32 Ingest, encoding, and simulcasting are free.32
Pros: Extremely fast time-to-market, zero media infrastructure to manage, and automatic handling of transcoding, recording, global delivery, and scaling.33
Cons: Less granular control over the media pipeline compared to a custom build.
7.2. Solution B: Custom Solution (Workers, Realtime & R2)
For organizations with highly specific needs, an alternative is to build a custom solution on Cloudflare's primitives.
Architecture: Instead of using the managed Cloudflare Stream product, one would use Cloudflare Workers 10 to build a custom WHIP server on top of the underlying Cloudflare Realtime (Calls) API.37 Cloudflare provides a "WHIP-WHEP Server" demo application illustrating this exact concept.38 This custom Worker would then be responsible for manually writing the media to Cloudflare R2 storage 39 and potentially triggering a custom-built HLS/DASH packager.
Pros: Infinite flexibility for custom authentication, media manipulation, or dynamic routing.41
Cons: A massive increase in implementation complexity. The developer becomes responsible for all aspects of the media pipeline, including state management, transcoding, and packaging.5 The pricing model also becomes complex, with separate charges for Worker CPU time, Realtime (Calls) minutes, R2 storage, and R2 operations.
7.3. Table: Solution Comparison: Managed Stream vs. Custom Workers
Approach
Implementation Complexity
Cost Model
Key Features
Flexibility
Recommended For
A: Managed Stream
Low
Simple (per-minute stored/delivered) 32
Managed Recording, Simulcast, HLS/DASH, Player 35
Low
Most applications; rapid development.
B: Custom Workers
Very High
Complex (Workers, Realtime, R2, Ops) 37
Total control over media, data, and auth 41
High
Niche applications with unique requirements.

Part 8: Final Implementation Checklist and Recommendations
8.1. End-to-End Implementation Checklist
This checklist provides the concise, sequential steps to implement the recommended architecture (Solution A).
[Cloudflare] Create Live Input: Send a POST request to .../stream/live_inputs with the body {"recording": { "mode": "automatic" }}.6
[Cloudflare] Store Credentials: From the API response, save the uid (Live Input ID) and the webRTC.url (WHIP Ingest URL).1
[MUX] Create Live Stream: Use the MUX API or dashboard to create a new live stream.18
[MUX] Store Credentials: Copy the MUX RTMP/RTMPS URL and Stream Key.16
[Cloudflare] Create Live Output: POST the MUX credentials from Step 4 to the Cloudflare endpoint: .../live_inputs/<INPUT_UID>/outputs.7
[Client] Start Broadcast: Use a WHIP-compatible client (browser, OBS, GStreamer) to stream to the WHIP Ingest URL from Step 2.1
[Front-End] Get Playback URLs:
Live HLS/DASH: Send a GET request to .../live_inputs/<INPUT_UID>/videos. The first video in the list (status live-inprogress) will contain the <VIDEO_ID> needed for the manifest URLs (e.g., .../<VIDEO_ID>/manifest/video.m3u8).8
Live WHEP: Use the webRTCPlayback.url saved in Step 2.
[Front-End] Embed Player: Use the HLS, DASH, or WHEP URLs in your chosen player, or use the Cloudflare iFrame embed.29
** Retrieve Recordings:** After the stream ends, send a GET request to .../live_inputs/<INPUT_UID>/videos to retrieve the list of all recorded VOD assets.30
8.2. Final Strategic Recommendation
This report strongly recommends Solution A: The Managed Cloudflare Stream architecture. It directly fulfills all four of the user's objectives—WHIP ingest, automatic recording, simulcasting to MUX, and front-end HLS/WHEP playback—through a single, unified, and simple-to-use API.
The historical limitations of the WebRTC beta, which previously made this architecture impossible, have been definitively resolved. The Cloudflare Stream Live Input now functions as a powerful, ingest-agnostic media hub. The alternative custom-built solution (Solution B) is powerful but introduces significant and, for the stated goals, unnecessary implementation complexity. The managed solution provides the most direct, reliable, and cost-effective path to achieving the desired outcome.

