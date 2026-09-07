#!/usr/bin/env node

/**
 * Migration Script: Convert legacy memorial content to content blocks
 * 
 * Converts the following deprecated fields into contentBlocks:
 *   - emergencyEmbed       → embed block (embedType: 'video')
 *   - emergencyChatEmbed   → embed block (embedType: 'chat')
 *   - videoFile            → embed block (embedType: 'video')
 *   - publicNote           → text block  (style: 'note')
 * 
 * Also syncs orphan streams (streams without a corresponding livestream block).
 * 
 * Usage:
 *   node scripts/migrate-to-blocks.js --dry-run   # Preview changes
 *   node scripts/migrate-to-blocks.js              # Execute migration
 */

const admin = require('firebase-admin');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../../fir-tweb-service-account.json');

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------

if (!admin.apps.length) {
	const serviceAccount = require(SERVICE_ACCOUNT_PATH);
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount)
	});
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateBlockId() {
	return 'blk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function makeBlock(type, config, order) {
	return {
		id: generateBlockId(),
		type,
		order,
		enabled: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		config
	};
}

// ---------------------------------------------------------------------------
// Migration logic
// ---------------------------------------------------------------------------

async function migrate() {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`  Block Migration Script ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
	console.log(`${'='.repeat(60)}\n`);

	const memorialsSnap = await db.collection('memorials').get();
	console.log(`Found ${memorialsSnap.size} memorials to inspect.\n`);

	let totalMigrated = 0;
	let totalBlocksCreated = 0;
	let totalOrphansSynced = 0;
	const errors = [];

	for (const doc of memorialsSnap.docs) {
		const memorialId = doc.id;
		const data = doc.data();
		const existingBlocks = data.contentBlocks || [];
		const newBlocks = [];
		let nextOrder = existingBlocks.length;

		const changes = [];

		// 1. emergencyEmbed → embed block (video)
		if (data.emergencyEmbed && data.emergencyEmbed.embedCode) {
			const alreadyMigrated = existingBlocks.some(
				b => b.type === 'embed' && b.config?.embedCode === data.emergencyEmbed.embedCode
			);
			if (!alreadyMigrated) {
				newBlocks.push(makeBlock('embed', {
					title: data.emergencyEmbed.title || 'Video Embed',
					embedCode: data.emergencyEmbed.embedCode,
					embedType: 'video'
				}, nextOrder++));
				changes.push('emergencyEmbed → embed block (video)');
			}
		}

		// 2. emergencyChatEmbed → embed block (chat)
		if (data.emergencyChatEmbed && data.emergencyChatEmbed.embedCode) {
			const alreadyMigrated = existingBlocks.some(
				b => b.type === 'embed' && b.config?.embedCode === data.emergencyChatEmbed.embedCode
			);
			if (!alreadyMigrated) {
				newBlocks.push(makeBlock('embed', {
					title: data.emergencyChatEmbed.title || 'Live Chat',
					embedCode: data.emergencyChatEmbed.embedCode,
					embedType: 'chat'
				}, nextOrder++));
				changes.push('emergencyChatEmbed → embed block (chat)');
			}
		}

		// 3. videoFile → embed block (video)
		if (data.videoFile && data.videoFile.url) {
			const alreadyMigrated = existingBlocks.some(
				b => b.type === 'embed' && b.config?.embedCode === data.videoFile.url
			);
			if (!alreadyMigrated) {
				newBlocks.push(makeBlock('embed', {
					title: data.videoFile.title || 'Video Recording',
					embedCode: data.videoFile.url,
					embedType: 'video'
				}, nextOrder++));
				changes.push('videoFile → embed block (video)');
			}
		}

		// 4. publicNote → text block (note)
		if (data.publicNote && data.publicNote.trim()) {
			const alreadyMigrated = existingBlocks.some(
				b => b.type === 'text' && b.config?.content === data.publicNote
			);
			if (!alreadyMigrated) {
				newBlocks.push(makeBlock('text', {
					content: data.publicNote,
					style: 'note'
				}, nextOrder++));
				changes.push('publicNote → text block (note)');
			}
		}

		// 5. Orphan streams → livestream blocks
		try {
			const streamsSnap = await db.collection('streams')
				.where('memorialId', '==', memorialId)
				.get();

			const allBlocks = [...existingBlocks, ...newBlocks];

			for (const streamDoc of streamsSnap.docs) {
				const streamData = streamDoc.data();
				if (streamData.isDeleted) continue;

				const hasBlock = allBlocks.some(
					b => b.type === 'livestream' && b.config?.streamId === streamDoc.id
				);
				if (!hasBlock) {
					const block = makeBlock('livestream', {
						streamId: streamDoc.id
					}, nextOrder++);
					newBlocks.push(block);
					allBlocks.push(block);
					totalOrphansSynced++;
					changes.push(`orphan stream "${streamData.title || streamDoc.id}" → livestream block`);
				}
			}
		} catch (err) {
			errors.push({ memorialId, error: `Stream query failed: ${err.message}` });
		}

		// Apply changes
		if (newBlocks.length > 0) {
			const updatedBlocks = [...existingBlocks, ...newBlocks];

			console.log(`  [${memorialId}] ${data.lovedOneName || 'Unknown'}`);
			for (const change of changes) {
				console.log(`    + ${change}`);
			}
			console.log(`    → ${newBlocks.length} new block(s), total: ${updatedBlocks.length}\n`);

			if (!DRY_RUN) {
				try {
					await db.collection('memorials').doc(memorialId).update({
						contentBlocks: updatedBlocks,
						contentBlocksVersion: (data.contentBlocksVersion || 0) + 1,
						updatedAt: admin.firestore.FieldValue.serverTimestamp()
					});
				} catch (err) {
					errors.push({ memorialId, error: `Update failed: ${err.message}` });
					console.log(`    ❌ FAILED: ${err.message}\n`);
					continue;
				}
			}

			totalMigrated++;
			totalBlocksCreated += newBlocks.length;
		}
	}

	// Summary
	console.log(`${'='.repeat(60)}`);
	console.log(`  Migration Summary ${DRY_RUN ? '(DRY RUN — no changes written)' : ''}`);
	console.log(`${'='.repeat(60)}`);
	console.log(`  Memorials inspected:  ${memorialsSnap.size}`);
	console.log(`  Memorials migrated:   ${totalMigrated}`);
	console.log(`  New blocks created:   ${totalBlocksCreated}`);
	console.log(`  Orphan streams synced: ${totalOrphansSynced}`);
	if (errors.length > 0) {
		console.log(`  Errors:               ${errors.length}`);
		for (const e of errors) {
			console.log(`    - [${e.memorialId}] ${e.error}`);
		}
	}
	console.log('');

	if (DRY_RUN) {
		console.log('  Run without --dry-run to apply changes.\n');
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

migrate()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Fatal error:', err);
		process.exit(1);
	});
