/**
 * VIDEO SWITCHER - SERVER-SIDE LOGIC
 * ===================================
 * 
 * This file handles the server-side operations for the Daily.co video switcher:
 * - Admin-only access control
 * - Daily.co room creation with custom settings
 * - Token generation (1 owner token for admin, 4 guest tokens for phone sources)
 * - QR code generation for easy phone connections
 * - Memorial and stream data loading
 * 
 * Daily.co Architecture:
 * - Uses Video Component System (VCS) for cloud-side video composition
 * - Creates a "private" room that requires tokens for entry
 * - Admin gets "owner" token with full control
 * - Phone sources get "guest" tokens with video/audio only permissions
 * 
 * @see SWITCHER_MVP_IMPLEMENTATION_PLAN.md for complete implementation details
 */

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';

// ============================================================================
// ENVIRONMENT VARIABLE DEBUGGING
// ============================================================================
console.log('\n' + '🔧'.repeat(40));
console.log('🔧 [SWITCHER MODULE] Loading switcher server module...');
console.log('🔧'.repeat(40));

// Log ALL environment variables (be careful in production!)
console.log('\n📦 [ENV DEBUG] Available environment variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');
console.log('   DAILY_API_KEY:', process.env.DAILY_API_KEY ? '✅ SET (' + process.env.DAILY_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET');
console.log('   DAILY_DOMAIN:', process.env.DAILY_DOMAIN ? '✅ SET (' + process.env.DAILY_DOMAIN + ')' : '❌ NOT SET');
console.log('   PRIVATE_DAILY_API_KEY:', process.env.PRIVATE_DAILY_API_KEY ? '✅ SET (' + process.env.PRIVATE_DAILY_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET');
console.log('   PRIVATE_DAILY_DOMAIN:', process.env.PRIVATE_DAILY_DOMAIN ? '✅ SET (' + process.env.PRIVATE_DAILY_DOMAIN + ')' : '❌ NOT SET');

// Log process.env keys to see what's available
console.log('\n🔑 [ENV DEBUG] All environment variable keys:');
const envKeys = Object.keys(process.env);
console.log('   Total variables:', envKeys.length);
console.log('   Daily-related keys:', envKeys.filter(k => k.includes('DAILY')));
console.log('   PRIVATE_ keys:', envKeys.filter(k => k.startsWith('PRIVATE_')));

// Environment variable validation
console.log('\n📋 [ENV DEBUG] Extracting Daily.co configuration...');
const DAILY_API_KEY = process.env.PRIVATE_DAILY_API_KEY;
const DAILY_DOMAIN = process.env.PRIVATE_DAILY_DOMAIN;

console.log('   PRIVATE_DAILY_API_KEY extracted:', DAILY_API_KEY ? '✅ YES' : '❌ NO');
console.log('   PRIVATE_DAILY_DOMAIN extracted:', DAILY_DOMAIN ? '✅ YES' : '❌ NO');

if (DAILY_API_KEY) {
	console.log('   API Key length:', DAILY_API_KEY.length, 'characters');
	console.log('   API Key preview:', DAILY_API_KEY.substring(0, 20) + '...');
}

if (DAILY_DOMAIN) {
	console.log('   Domain value:', DAILY_DOMAIN);
}

// Validate Daily.co configuration on module load
if (!DAILY_API_KEY || !DAILY_DOMAIN) {
	console.error('\n❌ [SWITCHER MODULE] Missing Daily.co configuration in environment variables');
	console.error('   PRIVATE_DAILY_API_KEY:', DAILY_API_KEY ? '✅ SET' : '❌ MISSING');
	console.error('   PRIVATE_DAILY_DOMAIN:', DAILY_DOMAIN ? '✅ SET' : '❌ MISSING');
	console.error('   Required: PRIVATE_DAILY_API_KEY and PRIVATE_DAILY_DOMAIN');
	console.error('   Get your API key from: https://dashboard.daily.co/developers');
	console.error('\n   ⚠️  THE SWITCHER WILL NOT WORK WITHOUT THESE VARIABLES!');
} else {
	console.log('\n✅ [SWITCHER MODULE] Daily.co configuration loaded successfully!');
	console.log('   Domain: ' + DAILY_DOMAIN);
	console.log('   API Key: CONFIGURED (first 15 chars: ' + DAILY_API_KEY.substring(0, 15) + '...)');
}

console.log('🔧'.repeat(40) + '\n');

/**
 * DAILY.CO API HELPER FUNCTIONS
 * ==============================
 */

/**
 * Creates a Daily.co room with production-optimized settings for video switching
 * 
 * Room Configuration:
 * - privacy: "private" - Requires tokens for all participants
 * - max_participants: 6 - Admin + 4 sources + 1 buffer
 * - enable_recording: "cloud" - Required for VCS composition
 * - enable_chat: false - Not needed for switcher
 * - enable_knocking: false - All joins via tokens only
 * 
 * @param memorialId - Memorial identifier for room naming
 * @param streamId - Stream identifier for room naming
 * @returns Room object with URL and configuration
 */
async function createDailyRoom(memorialId: string, streamId: string) {
	console.log('\n🏗️  [SWITCHER] Creating Daily.co room...');
	console.log(`   Memorial ID: ${memorialId}`);
	console.log(`   Stream ID: ${streamId}`);

	// Generate unique room name
	const roomName = `memorial-${memorialId}-stream-${streamId}-${Date.now()}`;
	console.log(`   Room Name: ${roomName}`);

	console.log('   📡 Making API request to Daily.co...');
	console.log('      URL: https://api.daily.co/v1/rooms');
	console.log('      Method: POST');
	console.log('      Authorization: Bearer ' + DAILY_API_KEY?.substring(0, 20) + '...');

	try {
		const response = await fetch('https://api.daily.co/v1/rooms', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${DAILY_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: roomName,
				privacy: 'private', // CRITICAL: Requires tokens for entry
				properties: {
					max_participants: 6,
					enable_recording: 'cloud', // Required for VCS
					enable_chat: false,
					enable_knocking: false,
					// Expiration time: 4 hours from now
					exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4
				}
			})
		});

		console.log('   📥 Response received');
		console.log('      Status:', response.status);
		console.log('      OK:', response.ok);

		if (!response.ok) {
			const errorData = await response.json();
			console.error('\n❌ [SWITCHER] Daily.co room creation FAILED!');
			console.error('   Status Code:', response.status);
			console.error('   Status Text:', response.statusText);
			console.error('   Error Data:', JSON.stringify(errorData, null, 2));
			console.error('   API Key being used:', DAILY_API_KEY?.substring(0, 20) + '...');
			throw new Error(`Daily.co API error: ${response.status}`);
		}

		const roomData = await response.json();
		console.log('\n✅ [SWITCHER] Room created successfully!');
		console.log('   Room Name:', roomData.name);
		console.log('   Room URL:', roomData.url);
		console.log('   Privacy:', roomData.privacy);
		console.log('   Max Participants:', roomData.config?.max_participants);
		console.log('   Room expires in 4 hours');
		console.log('   Full response:', JSON.stringify(roomData, null, 2));

		return roomData;
	} catch (err) {
		console.error('\n❌❌❌ [SWITCHER] EXCEPTION during room creation! ❌❌❌');
		console.error('   Error type:', err instanceof Error ? err.constructor.name : typeof err);
		console.error('   Error message:', err instanceof Error ? err.message : String(err));
		console.error('   Error stack:', err instanceof Error ? err.stack : 'No stack trace');
		console.error('   API Key status:', DAILY_API_KEY ? 'SET' : 'NOT SET');
		console.error('   Domain status:', DAILY_DOMAIN ? 'SET' : 'NOT SET');
		throw err;
	}
}

/**
 * Generates a Daily.co meeting token with specified permissions
 * 
 * Token Types:
 * - Owner Token (Admin): Full control, can start/stop streaming, update composition
 * - Guest Token (Sources): Video/audio only, no admin capabilities
 * 
 * @param roomName - Room name to generate token for
 * @param isOwner - Whether this token should have owner privileges
 * @param userName - Optional display name for the participant
 * @returns Token string
 */
async function generateDailyToken(
	roomName: string, 
	isOwner: boolean, 
	userName?: string
) {
	const tokenType = isOwner ? 'OWNER' : 'GUEST';
	console.log(`\n🎫 [SWITCHER] Generating ${tokenType} token...`);
	console.log(`   Room: ${roomName}`);
	console.log(`   User: ${userName || 'Anonymous'}`);

	console.log('   📡 Making token request to Daily.co...');
	console.log('      URL: https://api.daily.co/v1/meeting-tokens');
	console.log('      Room:', roomName);
	console.log('      Is Owner:', isOwner);

	try {
		const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${DAILY_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				properties: {
					room_name: roomName,
					is_owner: isOwner,
					user_name: userName || undefined,
					// Enable cloud recording for owner (required for VCS)
					enable_recording: isOwner ? 'cloud' : undefined,
					// Token expires in 4 hours
					exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
					// Not before timestamp (can join immediately)
					nbf: Math.floor(Date.now() / 1000)
				}
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error(`❌ [SWITCHER] ${tokenType} token generation failed`);
			console.error('   Status:', response.status);
			console.error('   Error:', errorData);
			throw new Error(`Token generation failed: ${response.status}`);
		}

		const tokenData = await response.json();
		console.log(`✅ [SWITCHER] ${tokenType} token generated successfully`);
		console.log(`   Token length: ${tokenData.token.length} chars`);

		return tokenData.token;
	} catch (err) {
		console.error(`❌ [SWITCHER] Exception during ${tokenType} token generation:`, err);
		throw err;
	}
}

/**
 * Generates a QR code as data URL for easy phone scanning
 * 
 * @param url - URL to encode in QR code
 * @returns QR code as data URL (base64)
 */
async function generateQRCode(url: string): Promise<string> {
	try {
		// Generate QR code with high error correction
		const qrDataUrl = await QRCode.toDataURL(url, {
			errorCorrectionLevel: 'H',
			width: 256,
			margin: 2
		});
		console.log('   ✓ QR code generated successfully');
		return qrDataUrl;
	} catch (err) {
		console.error('   ✗ QR code generation failed:', err);
		throw err;
	}
}

/**
 * PAGE LOAD FUNCTION
 * ==================
 * 
 * Executes on every page request. Handles:
 * 1. Authentication and authorization (admin only)
 * 2. Memorial and stream data loading
 * 3. Daily.co room creation
 * 4. Token generation (1 owner + 4 guest tokens)
 * 5. QR code generation for phone sources
 * 
 * Security:
 * - Verifies user is authenticated
 * - Enforces admin role requirement
 * - Validates memorial and stream existence
 */
export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	console.log('\n' + '='.repeat(80));
	console.log('🎬 [SWITCHER] Page load initiated');
	console.log('='.repeat(80));
	console.log(`   Memorial ID: ${params.id}`);
	console.log(`   Stream ID: ${params.streamId}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	// ============================================================================
	// STEP 1: AUTHENTICATION & AUTHORIZATION
	// ============================================================================
	console.log('\n📋 [SWITCHER] Step 1: Authentication & Authorization');

	if (!locals.user) {
		console.error('❌ [SWITCHER] No authenticated user found');
		console.error('   Redirecting to login page...');
		throw redirect(302, `/login?redirect=/memorials/${params.id}/switcher/${params.streamId}`);
	}

	console.log('✅ [SWITCHER] User authenticated');
	console.log(`   User ID: ${locals.user.uid}`);
	console.log(`   Email: ${locals.user.email}`);
	console.log(`   Role: ${locals.user.role}`);

	// CRITICAL: Only admins can access the switcher
	if (locals.user.role !== 'admin') {
		console.error('❌ [SWITCHER] Access denied - User is not admin');
		console.error(`   User role: ${locals.user.role}`);
		console.error('   Redirecting to stream management page...');
		throw redirect(302, `/memorials/${params.id}/manage-streams`);
	}

	console.log('✅ [SWITCHER] Admin access confirmed');

	// ============================================================================
	// STEP 2: VALIDATE DAILY.CO CONFIGURATION
	// ============================================================================
	console.log('\n📋 [SWITCHER] Step 2: Validating Daily.co configuration');
	console.log('   🔍 Checking PRIVATE_DAILY_API_KEY...');
	console.log('      Value:', DAILY_API_KEY ? '✅ EXISTS' : '❌ UNDEFINED/EMPTY');
	if (DAILY_API_KEY) {
		console.log('      Type:', typeof DAILY_API_KEY);
		console.log('      Length:', DAILY_API_KEY.length);
		console.log('      Preview:', DAILY_API_KEY.substring(0, 15) + '...');
	}

	console.log('   🔍 Checking PRIVATE_DAILY_DOMAIN...');
	console.log('      Value:', DAILY_DOMAIN ? '✅ EXISTS' : '❌ UNDEFINED/EMPTY');
	if (DAILY_DOMAIN) {
		console.log('      Type:', typeof DAILY_DOMAIN);
		console.log('      Value:', DAILY_DOMAIN);
	}

	if (!DAILY_API_KEY || !DAILY_DOMAIN) {
		console.error('\n❌❌❌ [SWITCHER] Daily.co is NOT CONFIGURED! ❌❌❌');
		console.error('   PRIVATE_DAILY_API_KEY:', DAILY_API_KEY ? '✅ SET' : '❌ MISSING');
		console.error('   PRIVATE_DAILY_DOMAIN:', DAILY_DOMAIN ? '✅ SET' : '❌ MISSING');
		console.error('   ');
		console.error('   📝 TO FIX THIS:');
		console.error('   1. Add environment variables in Vercel Dashboard');
		console.error('   2. Or create/edit frontend/.env file:');
		console.error('      PRIVATE_DAILY_API_KEY=your_api_key_here');
		console.error('      PRIVATE_DAILY_DOMAIN=your-domain.daily.co');
		console.error('   3. Restart the dev server / Redeploy to Vercel');
		console.error('   ');
		console.error('   Get your API key from: https://dashboard.daily.co/developers');
		console.error('\n   ⚠️  THROWING 500 ERROR NOW...');
		throw error(500, {
			message: 'Video switcher is not configured. Please contact support.'
		});
	}

	console.log('\n✅ [SWITCHER] Daily.co configuration validated successfully!');
	console.log('   Domain: ' + DAILY_DOMAIN);
	console.log('   API Key: CONFIGURED (length: ' + DAILY_API_KEY.length + ')');

	// ============================================================================
	// STEP 3: LOAD MEMORIAL DATA
	// ============================================================================
	console.log('\n📋 [SWITCHER] Step 3: Loading memorial data');

	try {
		// Using internal API to load memorial
		const memorialResponse = await fetch(`/api/memorials/${params.id}`);
		
		if (!memorialResponse.ok) {
			console.error('❌ [SWITCHER] Memorial not found');
			console.error(`   Memorial ID: ${params.id}`);
			throw error(404, { message: 'Memorial not found' });
		}

		const memorial = await memorialResponse.json();
		console.log('✅ [SWITCHER] Memorial loaded successfully');
		console.log(`   Memorial: ${memorial.lovedOneName}`);

		// ============================================================================
		// STEP 4: LOAD STREAM DATA
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 4: Loading stream data');

		const streamsResponse = await fetch(`/api/memorials/${params.id}/streams`);
		
		if (!streamsResponse.ok) {
			console.error('❌ [SWITCHER] Failed to load streams');
			throw error(500, { message: 'Failed to load stream data' });
		}

		const streams = await streamsResponse.json();
		const stream = streams.find((s: any) => s.id === params.streamId);

		if (!stream) {
			console.error('❌ [SWITCHER] Stream not found');
			console.error(`   Stream ID: ${params.streamId}`);
			throw error(404, { message: 'Stream not found' });
		}

		console.log('✅ [SWITCHER] Stream loaded successfully');
		console.log(`   Stream title: ${stream.title}`);
		console.log(`   Stream status: ${stream.status}`);

		// Validate stream is ready for switching
		if (stream.status === 'completed') {
			console.error('❌ [SWITCHER] Cannot switch completed stream');
			throw error(400, { message: 'Cannot use switcher on completed stream' });
		}

		// ============================================================================
		// STEP 5: CREATE DAILY.CO ROOM
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 5: Creating Daily.co room');

		const room = await createDailyRoom(params.id, params.streamId);

		// ============================================================================
		// STEP 6: GENERATE TOKENS
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 6: Generating meeting tokens');

		// Owner token for admin (full control)
		console.log('\n🔑 [SWITCHER] Generating owner token for admin...');
		const ownerToken = await generateDailyToken(
			room.name,
			true, // is_owner = true
			`Admin: ${locals.user.email}`
		);

		// Guest tokens for phone sources (4 sources)
		console.log('\n🔑 [SWITCHER] Generating guest tokens for phone sources...');
		const guestTokens = await Promise.all([
			generateDailyToken(room.name, false, 'Source 1'),
			generateDailyToken(room.name, false, 'Source 2'),
			generateDailyToken(room.name, false, 'Source 3'),
			generateDailyToken(room.name, false, 'Source 4')
		]);

		console.log('✅ [SWITCHER] All tokens generated successfully');
		console.log(`   Total tokens: ${1 + guestTokens.length}`);

		// ============================================================================
		// STEP 7: GENERATE QR CODES
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 7: Generating QR codes for phone sources');

		const sourceQRCodes = await Promise.all(
			guestTokens.map(async (token, index) => {
				console.log(`\n📱 [SWITCHER] Generating QR code for Source ${index + 1}...`);
				const joinUrl = `${room.url}?t=${token}`;
				const qrCode = await generateQRCode(joinUrl);
				
				return {
					slot: index + 1,
					url: joinUrl,
					token: token,
					qrCode: qrCode
				};
			})
		);

		console.log('✅ [SWITCHER] All QR codes generated successfully');

		// ============================================================================
		// STEP 8: GET WHIP ENDPOINT FOR OUTPUT
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 8: Loading WHIP endpoint for stream output');

		// WHIP endpoint is used to push the mixed video to Cloudflare Stream
		const whipUrl = `/api/streams/${params.streamId}/whip`;
		console.log('✅ [SWITCHER] WHIP endpoint configured');
		console.log(`   WHIP URL: ${whipUrl}`);

		// ============================================================================
		// STEP 9: RETURN DATA TO CLIENT
		// ============================================================================
		console.log('\n📋 [SWITCHER] Step 9: Preparing data for client');

		const responseData = {
			// User info
			user: {
				uid: locals.user.uid,
				email: locals.user.email,
				role: locals.user.role
			},
			// Memorial info
			memorial: {
				id: memorial.id,
				lovedOneName: memorial.lovedOneName
			},
			// Stream info
			stream: {
				id: stream.id,
				title: stream.title,
				status: stream.status
			},
			// Daily.co room info
			room: {
				name: room.name,
				url: room.url,
				ownerToken: ownerToken
			},
			// Phone source connection info
			sources: sourceQRCodes,
			// Output configuration
			output: {
				whipUrl: whipUrl
			}
		};

		console.log('\n✅ [SWITCHER] Setup complete! Returning data to client...');
		console.log('   Room URL:', room.url);
		console.log('   Sources configured:', sourceQRCodes.length);
		console.log('   Output endpoint:', whipUrl);
		console.log('='.repeat(80));

		return responseData;

	} catch (err) {
		console.error('\n❌ [SWITCHER] Fatal error during setup');
		console.error('   Error:', err);
		console.error('='.repeat(80));
		
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		// Wrap other errors
		throw error(500, {
			message: 'Failed to initialize video switcher. Please try again.'
		});
	}
};
