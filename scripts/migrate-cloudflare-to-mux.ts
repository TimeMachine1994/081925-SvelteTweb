/**
 * Migration Script: Cloudflare Stream → Mux Platform
 * 
 * Created: January 22, 2026
 * Purpose: Migrate existing Cloudflare streams to Mux platform
 * 
 * This script:
 * 1. Finds all streams with Cloudflare configuration
 * 2. Creates equivalent Mux live streams
 * 3. Creates Mux chat spaces
 * 4. Updates Firestore with Mux configuration
 * 5. Preserves Cloudflare IDs as legacy fields
 * 
 * Usage:
 *   npx tsx scripts/migrate-cloudflare-to-mux.ts
 * 
 * Options:
 *   --dry-run    : Preview migration without making changes
 *   --limit=N    : Limit number of streams to migrate
 *   --stream-id=ID : Migrate specific stream only
 */

import { adminDb } from '../frontend/src/lib/server/firebase';
import { createMuxLiveStream, createMuxChatSpace } from '../frontend/src/lib/server/mux';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
const streamIdArg = args.find(arg => arg.startsWith('--stream-id='));
const specificStreamId = streamIdArg ? streamIdArg.split('=')[1] : null;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     CLOUDFLARE STREAM → MUX PLATFORM MIGRATION SCRIPT          ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('📅 Date:', new Date().toISOString());
console.log('🏃 Mode:', isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)');
if (limit) console.log('📊 Limit:', limit, 'streams');
if (specificStreamId) console.log('🎯 Target:', specificStreamId);
console.log('');

/**
 * Migration statistics
 */
interface MigrationStats {
	total: number;
	migrated: number;
	skipped: number;
	failed: number;
	errors: Array<{ streamId: string; error: string }>;
}

const stats: MigrationStats = {
	total: 0,
	migrated: 0,
	skipped: 0,
	failed: 0,
	errors: []
};

/**
 * Migrate a single stream from Cloudflare to Mux
 */
async function migrateStream(streamId: string, streamData: any): Promise<boolean> {
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('🎬 Stream:', streamId);
	console.log('📝 Title:', streamData.title);
	console.log('📍 Status:', streamData.status);

	try {
		// Check if already migrated
		if (streamData.mux?.liveStreamId) {
			console.log('⚠️ [SKIP] Stream already has Mux configuration');
			console.log('🔗 Mux Live Stream ID:', streamData.mux.liveStreamId);
			stats.skipped++;
			return false;
		}

		// Check if has Cloudflare configuration
		const hasCloudflare = streamData.streamCredentials?.cloudflareInputId || 
		                      streamData.cloudflareInputId;

		if (!hasCloudflare) {
			console.log('⚠️ [SKIP] No Cloudflare configuration found');
			stats.skipped++;
			return false;
		}

		console.log('✅ Stream eligible for migration');
		console.log('🔗 Cloudflare Input ID:', 
			streamData.streamCredentials?.cloudflareInputId || streamData.cloudflareInputId);

		if (isDryRun) {
			console.log('🔍 [DRY RUN] Would create Mux live stream and chat space');
			stats.migrated++;
			return true;
		}

		// Step 1: Create Mux Live Stream
		console.log('');
		console.log('🎬 [MUX] Creating live stream...');
		const muxStream = await createMuxLiveStream(streamData.title || 'Migrated Stream', {
			reconnectWindow: 60,
			reducedLatency: true
		});

		console.log('✅ [MUX] Live stream created');
		console.log('🆔 Live Stream ID:', muxStream.id);
		console.log('🎥 Playback ID:', muxStream.playbackId);

		// Step 2: Create Mux Chat Space
		console.log('');
		console.log('💬 [MUX] Creating chat space...');
		const chatSpace = await createMuxChatSpace(
			`Stream: ${streamData.title}`,
			streamData.description || `Chat for ${streamData.title}`
		);

		console.log('✅ [MUX] Chat space created');
		console.log('🆔 Chat Space ID:', chatSpace.id);

		// Step 3: Update Firestore
		console.log('');
		console.log('💾 [FIRESTORE] Updating stream document...');

		const updateData: any = {
			// Add Mux configuration
			mux: {
				liveStreamId: muxStream.id,
				playbackId: muxStream.playbackId,
				rtmpUrl: muxStream.rtmpUrl,
				streamKey: muxStream.streamKey,
				recordingReady: false,
				streamingStatus: 'idle',
				reconnectWindow: 60
			},

			// Add Chat configuration
			chat: {
				spaceId: chatSpace.id,
				enabled: true,
				archived: false,
				messageCount: 0,
				participantCount: 0,
				moderationMode: 'manual'
			},

			// Preserve Cloudflare ID as legacy field
			legacyCloudflareInputId: streamData.streamCredentials?.cloudflareInputId || 
			                         streamData.cloudflareInputId,

			// Update metadata
			updatedAt: new Date().toISOString()
		};

		await adminDb.collection('streams').doc(streamId).update(updateData);

		console.log('✅ [FIRESTORE] Stream updated successfully');
		console.log('');
		console.log('🎉 Migration complete for stream:', streamId);

		stats.migrated++;
		return true;

	} catch (error) {
		console.error('❌ [ERROR] Failed to migrate stream:', streamId);
		console.error('❌ [ERROR] Message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('❌ [ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
		
		stats.failed++;
		stats.errors.push({
			streamId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		return false;
	}
}

/**
 * Main migration function
 */
async function runMigration() {
	try {
		console.log('🔍 Searching for streams to migrate...');
		console.log('');

		let query = adminDb.collection('streams');

		// Filter by specific stream ID if provided
		if (specificStreamId) {
			const streamDoc = await adminDb.collection('streams').doc(specificStreamId).get();
			
			if (!streamDoc.exists) {
				console.error('❌ Stream not found:', specificStreamId);
				process.exit(1);
			}

			console.log('✅ Found specific stream');
			stats.total = 1;

			await migrateStream(streamDoc.id, streamDoc.data());

		} else {
			// Query all streams (we'll filter in code)
			const snapshot = await query.get();

			console.log('✅ Found', snapshot.size, 'total streams');
			stats.total = snapshot.size;
			console.log('');

			let processed = 0;

			for (const doc of snapshot.docs) {
				// Apply limit if specified
				if (limit && processed >= limit) {
					console.log('');
					console.log('📊 Reached limit of', limit, 'streams');
					break;
				}

				await migrateStream(doc.id, doc.data());
				processed++;

				// Add delay between migrations to avoid rate limits
				if (!isDryRun && processed < snapshot.size) {
					console.log('⏳ Waiting 2 seconds before next migration...');
					await new Promise(resolve => setTimeout(resolve, 2000));
				}

				console.log('');
			}
		}

		// Print summary
		console.log('╔════════════════════════════════════════════════════════════════╗');
		console.log('║                      MIGRATION SUMMARY                         ║');
		console.log('╚════════════════════════════════════════════════════════════════╝');
		console.log('');
		console.log('📊 Total streams found:', stats.total);
		console.log('✅ Successfully migrated:', stats.migrated);
		console.log('⚠️ Skipped (already migrated or no Cloudflare config):', stats.skipped);
		console.log('❌ Failed:', stats.failed);
		console.log('');

		if (stats.errors.length > 0) {
			console.log('❌ Errors encountered:');
			stats.errors.forEach(({ streamId, error }) => {
				console.log(`   - ${streamId}: ${error}`);
			});
			console.log('');
		}

		if (isDryRun) {
			console.log('🔍 [DRY RUN] No changes were made');
			console.log('💡 Run without --dry-run to perform actual migration');
		} else {
			console.log('✅ Migration complete!');
			console.log('');
			console.log('📋 Next steps:');
			console.log('   1. Test migrated streams in staging environment');
			console.log('   2. Verify RTMP credentials work with OBS');
			console.log('   3. Test live streaming and recording');
			console.log('   4. Verify chat functionality');
			console.log('   5. Check analytics data');
		}

		console.log('');
		console.log('╚════════════════════════════════════════════════════════════════╝');

		process.exit(stats.failed > 0 ? 1 : 0);

	} catch (error) {
		console.error('');
		console.error('╔════════════════════════════════════════════════════════════════╗');
		console.error('║                     FATAL ERROR                                ║');
		console.error('╚════════════════════════════════════════════════════════════════╝');
		console.error('');
		console.error('❌ Migration failed with fatal error:');
		console.error('❌ Message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack trace');
		console.error('');
		process.exit(1);
	}
}

// Run migration
runMigration();
