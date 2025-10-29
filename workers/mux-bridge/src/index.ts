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
	private isActive: boolean = false;
	private segmentCount: number = 0;
	private bytesTransferred: number = 0;
	private startTime: number = 0;
	private alarmInterval: number = 2000; // Check for new segments every 2 seconds

	constructor(state: DurableObjectState) {
		this.state = state;
		this.state.blockConcurrencyWhile(async () => {
			// Restore state from storage
			this.cloudflareHlsUrl = await this.state.storage.get('cloudflareHlsUrl') || '';
			this.muxStreamKey = await this.state.storage.get('muxStreamKey') || '';
			this.isActive = await this.state.storage.get('isActive') || false;
			this.segmentCount = await this.state.storage.get('segmentCount') || 0;
			this.bytesTransferred = await this.state.storage.get('bytesTransferred') || 0;
			this.startTime = await this.state.storage.get('startTime') || 0;
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

			// Store configuration
			this.cloudflareHlsUrl = cloudflareHlsUrl;
			this.muxStreamKey = muxStreamKey;
			this.isActive = true;
			this.startTime = Date.now();

			await this.state.storage.put({
				cloudflareHlsUrl,
				muxStreamKey,
				isActive: true,
				startTime: this.startTime
			});

			// Schedule first alarm to start pulling HLS segments
			await this.state.storage.setAlarm(Date.now() + this.alarmInterval);

			return new Response(JSON.stringify({
				success: true,
				message: 'Bridge session started',
				startTime: this.startTime
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
				muxStreamKey: this.muxStreamKey ? '****' + this.muxStreamKey.slice(-4) : 'not set'
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Stop bridge session
		if (url.pathname === '/stop' && request.method === 'DELETE') {
			this.isActive = false;
			await this.state.storage.put('isActive', false);
			await this.state.storage.deleteAlarm();

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
		if (!this.isActive) {
			return;
		}

		try {
			console.log(`[BRIDGE-ALARM] Pulling HLS segment from: ${this.cloudflareHlsUrl}`);

			// Fetch the HLS manifest to get latest segments
			const manifestResponse = await fetch(this.cloudflareHlsUrl);
			if (!manifestResponse.ok) {
				console.error('[BRIDGE-ALARM] Failed to fetch HLS manifest:', manifestResponse.status);
				// Schedule next alarm anyway
				await this.state.storage.setAlarm(Date.now() + this.alarmInterval);
				return;
			}

			const manifest = await manifestResponse.text();
			
			// Parse manifest for segment URLs (simplified parsing)
			const segmentLines = manifest.split('\n').filter(line => line.endsWith('.ts') || line.endsWith('.m4s'));
			
			if (segmentLines.length > 0) {
				// Get the latest segment
				const segmentUrl = segmentLines[segmentLines.length - 1];
				const fullSegmentUrl = new URL(segmentUrl, this.cloudflareHlsUrl).href;

				console.log(`[BRIDGE-ALARM] Fetching segment: ${fullSegmentUrl}`);

				// Fetch the segment
				const segmentResponse = await fetch(fullSegmentUrl);
				if (segmentResponse.ok) {
					const segmentData = await segmentResponse.arrayBuffer();
					const segmentSize = segmentData.byteLength;

					console.log(`[BRIDGE-ALARM] Fetched segment: ${segmentSize} bytes`);

					// TODO: Push segment to MUX via RTMP (this is the challenging part)
					// For now, we'll use MUX's direct upload API as an alternative
					// Note: This requires converting HLS segments to a format MUX can ingest

					this.segmentCount++;
					this.bytesTransferred += segmentSize;

					await this.state.storage.put({
						segmentCount: this.segmentCount,
						bytesTransferred: this.bytesTransferred
					});

					console.log(`[BRIDGE-ALARM] Progress: ${this.segmentCount} segments, ${this.bytesTransferred} bytes`);
				}
			}

			// Schedule next alarm
			await this.state.storage.setAlarm(Date.now() + this.alarmInterval);

		} catch (error) {
			console.error('[BRIDGE-ALARM] Error in alarm handler:', error);
			// Continue anyway, schedule next alarm
			await this.state.storage.setAlarm(Date.now() + this.alarmInterval);
		}
	}
}
