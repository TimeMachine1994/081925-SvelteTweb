1.1. Project Vision
This document outlines the requirements for "Project WHIP-Mux," a system designed to create a frictionless, browser-based live streaming experience for mobile users. This project will empower creators to initiate a live broadcast from their phone's native web browser in seconds. The resulting stream will be reliably recorded as a high-quality, on-demand video (VOD) asset, all powered by a scalable, best-in-class, and decoupled cloud infrastructure.

1.2. Core Business Objectives
This project is designed to meet several key business objectives, moving beyond the technical implementation to address core user and platform needs.

Objective 1 (Accessibility): Enable one-click live streaming from any modern mobile web browser (e.g., Safari on iOS, Chrome on Android). This removes the primary friction point of native application-based streaming: the requirement for a user to find, download, and install a dedicated app.

Objective 2 (Low Latency): Leverage modern web standards, specifically WebRTC and the WebRTC-HTTP Ingestion Protocol (WHIP), for sub-second ingest latency. This provides a near real-time "glass-to-glass" experience for creators, which is critical for interactive content.   

Objective 3 (Reliability): Utilize Cloudflare's massive global edge network as the WHIP ingest point. This ensures high reliability and a stable connection for creators, regardless of their geographic location or local network variability.   

Objective 4 (Quality & Scalability): Employ Mux as the definitive system for recording, encoding, and storing all live-to-VOD assets. This leverages Mux's developer-centric API and robust video pipeline to ensure all completed streams are automatically converted into high-quality, playable VOD assets.   

1.3. System Architecture Diagram
The proposed architecture is not only feasible but represents a modern, robust, and intelligently decoupled system. It separates the "edge" problem (unreliable mobile ingest) from the "backend" problem (VOD processing and storage).

The system is composed of four primary components:

Component 1: Client Web App: A mobile-browser-based single-page application (SPA). This client is responsible for accessing the user's camera and microphone using the navigator.mediaDevices.getUserMedia API. It will use a JavaScript-based WHIP client  to transmit the WebRTC media stream.   

Component 2: Backend Orchestration API: A secure, server-side application (e.g., a Node.js server, Python API, or Cloudflare Worker). This component is the "brain" of the operation. It manages all secure API keys  and orchestrates the complex "pre-flight" API calls required to configure both Cloudflare and Mux before the stream begins.   

Component 3: Cloudflare Stream: The public-facing media endpoint. Cloudflare will be configured to provide a "Live Input" , which exposes a unique WHIP endpoint URL. It will receive the WebRTC stream from the client.   

Component 4: Mux Video API: The internal recording and VOD system. Mux will be configured to provide a "Live Stream" , which exposes RTMP (Real-Time Messaging Protocol) ingest credentials. It will receive the stream from Cloudflare and be responsible for creating the final VOD asset.   

Data Flow (The "Media Plane")
This traces the path of the actual video and audio data from the creator to the final VOD.

Browser (WHIP) -> Cloudflare Live Input (WHIP Ingest): The mobile browser sends a low-latency WebRTC stream to the unique WHIP URL provided by Cloudflare Stream.   

Cloudflare Live Input -> Cloudflare Simulcast Output: Internally, Cloudflare Stream is configured with an "Output". This output is set to the RTMP destination provided by Mux.   

Cloudflare Simulcast Output -> Mux Live Stream (RTMP Ingest): Cloudflare acts as an RTMP client, pushing the live stream from its network to Mux's global RTMP ingest endpoint (rtmp://global-live.mux.com:5222/app) using the Mux stream_key.   

Mux Live Stream -> Mux VOD Asset: Upon termination of the RTMP stream, Mux's system automatically finalizes the recording and creates a new, separate on-demand VOD asset, as configured.   

Control Flow (The "Control Plane")
This traces the path of the API calls and logic required to set up the Media Plane. This flow must occur before the stream can begin.

Client <-> Backend API: The client (e.g., a logged-in user) makes a single, authenticated request to the Backend API (e.g., "I want to go live").

Backend API -> Mux API: The backend server makes a POST request to Mux to create a new Live Stream and get RTMP credentials.   

Backend API -> Cloudflare API: The backend server makes two calls: a. POST to create a Cloudflare Live Input, receiving a WHIP URL in return. b. POST to add an Output to that Live Input, providing the Mux RTMP credentials from step 2.   

Backend API -> Client: The backend returns the unique WHIP URL (from step 3a) to the client.

Mux/Cloudflare -> Backend API: After the stream is over, Mux and Cloudflare send webhook notifications to the Backend API to confirm the stream status and VOD asset creation.   

