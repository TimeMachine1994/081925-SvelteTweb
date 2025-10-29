/**
 * Cloudflare Worker: MUX Bridge
 * 
 * This worker bridges Cloudflare Stream HLS to MUX for recording.
 * Uses Durable Objects for maintaining bridge sessions.
 */

export interface Env {
	BRIDGE_SESSIONS: DurableObjectNamespace;
	MUX_TOKEN_ID: string;
	MUX_TOKEN_SECRET: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		
		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Route: POST /bridge/start
			if (url.pathname === '/bridge/start' && request.method === 'POST') {
				const { streamId, cloudflareHlsUrl, muxStreamKey } = await request.json() as {
					streamId: string;
					cloudflareHlsUrl: string;
					muxStreamKey: string;
				};

				// Get Durable Object instance for this stream
				const id = env.BRIDGE_SESSIONS.idFromName(streamId);
				const stub = env.BRIDGE_SESSIONS.get(id);

				// Start the bridge session
				const response = await stub.fetch(new Request('http://bridge/start', {
					method: 'POST',
					body: JSON.stringify({ cloudflareHlsUrl, muxStreamKey }),
					headers: {
						'MUX-Token-ID': env.MUX_TOKEN_ID,
						'MUX-Token-Secret': env.MUX_TOKEN_SECRET
					}
				}));

				const result = await response.json();
				return new Response(JSON.stringify(result), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			// Route: GET /bridge/status/:streamId
			if (url.pathname.startsWith('/bridge/status/') && request.method === 'GET') {
				const streamId = url.pathname.split('/').pop();
				if (!streamId) {
					return new Response(JSON.stringify({ error: 'Stream ID required' }), {
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}

				const id = env.BRIDGE_SESSIONS.idFromName(streamId);
				const stub = env.BRIDGE_SESSIONS.get(id);

				const response = await stub.fetch(new Request('http://bridge/status', {
					method: 'GET'
				}));

				const result = await response.json();
				return new Response(JSON.stringify(result), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			// Route: DELETE /bridge/stop/:streamId
			if (url.pathname.startsWith('/bridge/stop/') && request.method === 'DELETE') {
				const streamId = url.pathname.split('/').pop();
				if (!streamId) {
					return new Response(JSON.stringify({ error: 'Stream ID required' }), {
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}

				const id = env.BRIDGE_SESSIONS.idFromName(streamId);
				const stub = env.BRIDGE_SESSIONS.get(id);

				const response = await stub.fetch(new Request('http://bridge/stop', {
					method: 'DELETE'
				}));

				const result = await response.json();
				return new Response(JSON.stringify(result), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});

		} catch (error) {
			return new Response(JSON.stringify({
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	}
};

/**
 * Durable Object: BridgeSession
 * 
 * Maintains state for a single bridge session and handles HLS → MUX transfer.
 */
export class BridgeSession {
	private state: DurableObjectState;
	private cloudflareHlsUrl: string = '';
	private muxStreamKey: string = '';
	private muxTokenId: string = '';
	private muxTokenSecret: string = '';
	private muxUploadUrl: string = '';
	private muxUploadId: string = '';
	private isActive: boolean = false;
	private segmentCount: number = 0;
	private bytesTransferred: number = 0;
	private nextByteStart: number = 0;
	private startTime: number = 0;
	private alarmInterval: number = 2000; // Check for new segments every 2 seconds
	private processedSegments: Set<string> = new Set(); // Track which segments we've uploaded

	constructor(state: DurableObjectState) {
		this.state = state;
		this.state.blockConcurrencyWhile(async () => {
			// Restore state from storage
			this.cloudflareHlsUrl = await this.state.storage.get('cloudflareHlsUrl') || '';
			this.muxStreamKey = await this.state.storage.get('muxStreamKey') || '';
			this.muxUploadUrl = await this.state.storage.get('muxUploadUrl') || '';
			this.muxUploadId = await this.state.storage.get('muxUploadId') || '';
			this.isActive = await this.state.storage.get('isActive') || false;
			this.segmentCount = await this.state.storage.get('segmentCount') || 0;
			this.bytesTransferred = await this.state.storage.get('bytesTransferred') || 0;
			this.nextByteStart = await this.state.storage.get('nextByteStart') || 0;
			this.startTime = await this.state.storage.get('startTime') || 0;
			const storedSegments = await this.state.storage.get<string[]>('processedSegments') || [];
			this.processedSegments = new Set(storedSegments);
		});
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Start bridge session
		if (url.pathname === '/start' && request.method === 'POST') {
			const { cloudflareHlsUrl, muxStreamKey } = await request.json() as {
				cloudflareHlsUrl: string;
				muxStreamKey: string;
			};

			this.muxTokenId = request.headers.get('MUX-Token-ID') || '';
			this.muxTokenSecret = request.headers.get('MUX-Token-Secret') || '';

			// Create MUX Direct Upload
			console.log('[BRIDGE-START] Creating MUX Direct Upload...');
			const uploadResponse = await fetch('https://api.mux.com/video/v1/uploads', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${btoa(`${this.muxTokenId}:${this.muxTokenSecret}`)}`
				},
				body: JSON.stringify({
					cors_origin: '*',
					new_asset_settings: {
						playback_policy: ['public'],
						passthrough: muxStreamKey
					}
				})
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				console.error('[BRIDGE-START] MUX Upload creation failed:', errorText);
				return new Response(JSON.stringify({
					success: false,
					error: 'Failed to create MUX upload'
				}), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			const uploadData = await uploadResponse.json() as { data: { id: string; url: string } };
			this.muxUploadUrl = uploadData.data.url;
			this.muxUploadId = uploadData.data.id;
			console.log('[BRIDGE-START] MUX Upload created:', this.muxUploadId);

			// Store configuration
			this.cloudflareHlsUrl = cloudflareHlsUrl;
			this.muxStreamKey = muxStreamKey;
			this.isActive = true;
			this.startTime = Date.now();
			this.nextByteStart = 0;

			await this.state.storage.put({
				cloudflareHlsUrl,
				muxStreamKey,
				muxUploadUrl: this.muxUploadUrl,
				muxUploadId: this.muxUploadId,
				isActive: true,
				startTime: this.startTime,
				nextByteStart: 0,
				processedSegments: []
			});

			// Schedule first alarm to start pulling HLS segments
			await this.state.storage.setAlarm(Date.now() + this.alarmInterval);

			return new Response(JSON.stringify({
				success: true,
				message: 'Bridge session started with MUX Direct Upload',
				startTime: this.startTime,
				uploadId: this.muxUploadId
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get bridge status
		if (url.pathname === '/status' && request.method === 'GET') {
			const uptime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

			return new Response(JSON.stringify({
				isActive: this.isActive,
				uptime,
				segmentCount: this.segmentCount,
				bytesTransferred: this.bytesTransferred,
				cloudflareHlsUrl: this.cloudflareHlsUrl,
				muxUploadId: this.muxUploadId,
				muxStreamKey: this.muxStreamKey ? '****' + this.muxStreamKey.slice(-4) : 'not set'
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Stop bridge session
		if (url.pathname === '/stop' && request.method === 'DELETE') {
			this.isActive = false;
			await this.state.storage.put('isActive', false);
			// Cancel the alarm
			await this.state.storage.deleteAlarm();

			// Finalize MUX upload by sending final chunk indicator
			if (this.muxUploadUrl && this.nextByteStart > 0) {
				console.log('[BRIDGE-STOP] Finalizing MUX upload...');
				try {
					// Send empty PUT with final Content-Range to signal completion
					const finalResponse = await fetch(this.muxUploadUrl, {
						method: 'PUT',
						headers: {
							'Content-Length': '0',
							'Content-Range': `bytes */${this.nextByteStart}`
						}
					});
					console.log('[BRIDGE-STOP] MUX upload finalized:', finalResponse.status);
				} catch (error) {
					console.error('[BRIDGE-STOP] Failed to finalize upload:', error);
				}
			}

			return new Response(JSON.stringify({
				success: true,
				message: 'Bridge session stopped',
				finalStats: {
					segmentCount: this.segmentCount,
					bytesTransferred: this.bytesTransferred,
					uptime: Math.floor((Date.now() - this.startTime) / 1000)
				}
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response('Not found', { status: 404 });
	}

	/**
	 * Alarm handler - called periodically to pull HLS segments and push to MUX
	 */
	async alarm(): Promise<void> {
		if (!this.isActive || !this.muxUploadUrl) {
			return;
		}

		console.log('[BRIDGE-ALARM] Pulling HLS segments from:', this.cloudflareHlsUrl);

		try {
			// Fetch HLS manifest
			const manifestResponse = await fetch(this.cloudflareHlsUrl);
			if (!manifestResponse.ok) {
				console.error('[BRIDGE-ALARM] Failed to fetch HLS manifest:', manifestResponse.status);
				return;
			}

			const manifestText = await manifestResponse.text();
			
			// Parse HLS manifest to extract segment URLs
			const lines = manifestText.split('\n');
			const segmentUrls: string[] = [];
			
			for (const line of lines) {
				if (line && !line.startsWith('#') && line.trim()) {
					// Build absolute URL for segment
					const segmentUrl = line.startsWith('http') 
						? line 
						: new URL(line, this.cloudflareHlsUrl).toString();
					
					// Only process if we haven't seen this segment before
					if (!this.processedSegments.has(segmentUrl)) {
						segmentUrls.push(segmentUrl);
					}
				}
			}

			if (segmentUrls.length === 0) {
				console.log('[BRIDGE-ALARM] No new segments to process');
				return;
			}

			console.log(`[BRIDGE-ALARM] Found ${segmentUrls.length} new segments`);

			// Download and upload each segment to MUX
			for (const segmentUrl of segmentUrls) {
				try {
					// Download segment
					const segmentResponse = await fetch(segmentUrl);
					if (!segmentResponse.ok) {
						console.error('[BRIDGE-ALARM] Failed to download segment:', segmentUrl);
						continue;
					}

					const segmentData = await segmentResponse.arrayBuffer();
					const segmentSize = segmentData.byteLength;

					// Calculate byte range for this chunk
					const byteStart = this.nextByteStart;
					const byteEnd = byteStart + segmentSize - 1;

					// Upload segment to MUX using Direct Upload
					const uploadResponse = await fetch(this.muxUploadUrl, {
						method: 'PUT',
						headers: {
							'Content-Length': segmentSize.toString(),
							'Content-Range': `bytes ${byteStart}-${byteEnd}/*`
						},
						body: segmentData
					});

					if (uploadResponse.ok || uploadResponse.status === 308) {
						console.log(`[BRIDGE-ALARM] Uploaded segment: ${segmentSize} bytes`);
						
						// Mark segment as processed
						this.processedSegments.add(segmentUrl);
						this.nextByteStart += segmentSize;
						this.segmentCount++;
						this.bytesTransferred += segmentSize;
					} else {
						console.error('[BRIDGE-ALARM] Upload failed:', uploadResponse.status);
					}
				} catch (error) {
					console.error('[BRIDGE-ALARM] Error processing segment:', segmentUrl, error);
				}
			}

			// Save updated state
			await this.state.storage.put({
				segmentCount: this.segmentCount,
				bytesTransferred: this.bytesTransferred,
				nextByteStart: this.nextByteStart,
				processedSegments: Array.from(this.processedSegments)
			});

		} catch (error) {
			console.error('[BRIDGE-ALARM] Error processing HLS:', error);
		}

		// Schedule next alarm
		if (this.isActive) {
			await this.state.storage.setAlarm(Date.now() + this.alarmInterval);
		}
	}
}
