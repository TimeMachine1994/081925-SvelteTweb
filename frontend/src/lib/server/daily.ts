import { PRIVATE_DAILY_API_KEY } from '$env/static/private';

const DAILY_API_BASE = 'https://api.daily.co/v1';

if (!PRIVATE_DAILY_API_KEY) {
	console.warn('⚠️ PRIVATE_DAILY_API_KEY is missing. Daily.co integration will fail.');
}

interface CreateRoomOptions {
	name?: string;
	privacy?: 'public' | 'private';
	properties?: Record<string, any>;
}

/**
 * Create a new Daily room or return existing one
 * Per Daily docs: HLS streaming requires streaming_endpoints configuration
 */
export async function createDailyRoom(options: CreateRoomOptions = {}) {
	const response = await fetch(`${DAILY_API_BASE}/rooms`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${PRIVATE_DAILY_API_KEY}`
		},
		body: JSON.stringify({
			name: options.name, // Optional: Daily generates one if empty
			privacy: options.privacy || 'private',
			properties: {
				enable_recording: 'cloud',
				enable_chat: true,
				start_video_off: false, // Cameras should start with video
				start_audio_off: false, // Cameras should start with audio
				// Enable live streaming capabilities
				enable_live_captions_ui: false,
				// Owner-only broadcast ensures only admins can start streams
				owner_only_broadcast: true,
				...options.properties
			}
		})
	});

	if (!response.ok) {
		// If room already exists, fetch it
		if (options.name) {
			const existing = await getDailyRoom(options.name);
			if (existing) return existing;
		}
		const error = await response.json();
		throw new Error(`Failed to create Daily room: ${JSON.stringify(error)}`);
	}

	return await response.json();
}

/**
 * Get existing Daily room
 */
export async function getDailyRoom(name: string) {
	const response = await fetch(`${DAILY_API_BASE}/rooms/${name}`, {
		headers: {
			Authorization: `Bearer ${PRIVATE_DAILY_API_KEY}`
		}
	});

	if (!response.ok) return null;
	return await response.json();
}

/**
 * Create a meeting token
 */
export async function createDailyToken(roomName: string, options: {
	isOwner?: boolean;
	userName?: string;
	expiresIn?: number; // seconds
} = {}) {
	const body: any = {
		properties: {
			room_name: roomName,
			is_owner: options.isOwner,
			user_name: options.userName,
		}
	};

	if (options.expiresIn) {
		body.properties.exp = Math.floor(Date.now() / 1000) + options.expiresIn;
	}

	const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${PRIVATE_DAILY_API_KEY}`
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`Failed to create token: ${JSON.stringify(error)}`);
	}

	return await response.json();
}
