#!/usr/bin/env node

/**
 * One-off fix: publish the correct Mux recording for the Cortis Beryl Douglas memorial.
 *
 * Problem: the public player shows the LATEST recording in `mux.recordings[]`.
 * For the "Service" stream the latest is a tiny accidental reconnect clip, so the
 * wrong video plays. This sets `mux.publishedRecordings` to the longest recording
 * ONLY when the latest recording is shorter than the longest (the junk-clip case),
 * which leaves streams whose recordings are equal length (e.g. "Committal") untouched.
 *
 * Targets a single memorial by id to limit blast radius. Connects to PRODUCTION
 * via PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY (same as other admin scripts).
 *
 * Usage:
 *   node fix-douglas-recordings.js            # dry run (no writes)
 *   node fix-douglas-recordings.js --apply    # write changes
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const MEMORIAL_ID = 'WXXIyp1YfpNdjHHk878m';
const APPLY = process.argv.includes('--apply');

function initAdmin() {
	if (getApps().length) return;
	const serviceAccountJson = process.env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
	if (!serviceAccountJson) {
		throw new Error('PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env');
	}
	initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
}

async function main() {
	console.log(`🔧 ${APPLY ? 'APPLYING' : 'DRY RUN'} — fixing recordings for memorial ${MEMORIAL_ID}`);
	initAdmin();
	const db = getFirestore();

	const snap = await db.collection('streams').where('memorialId', '==', MEMORIAL_ID).get();
	if (snap.empty) {
		console.log('⚠️ No streams found for this memorial.');
		return;
	}

	for (const doc of snap.docs) {
		const data = doc.data();
		const mux = data.mux;
		const recordings = Array.isArray(mux?.recordings) ? mux.recordings : [];

		console.log(`\n📺 Stream ${doc.id} — "${data.title}" (status: ${data.status})`);
		if (recordings.length === 0) {
			console.log('   • No recordings; skipping.');
			continue;
		}

		recordings.forEach((r, i) =>
			console.log(`   • [${i}] ${r.vodPlaybackId} — ${r.duration ?? '?'} (${r.createdAt})`)
		);

		if (mux.publishedRecordings?.length) {
			console.log(`   ✓ Already has publishedRecordings: ${mux.publishedRecordings.join(', ')}; skipping.`);
			continue;
		}

		const latest = recordings[recordings.length - 1];
		const longest = recordings.reduce((a, b) => ((b.duration ?? 0) > (a.duration ?? 0) ? b : a));

		if ((longest.duration ?? 0) > (latest.duration ?? 0)) {
			console.log(
				`   → Latest (${latest.duration}) is shorter than longest (${longest.duration}). ` +
					`Publishing longest: ${longest.vodPlaybackId}`
			);
			if (APPLY) {
				await doc.ref.update({
					'mux.publishedRecordings': [longest.vodPlaybackId],
					updatedAt: new Date().toISOString()
				});
				console.log('   ✅ Updated.');
			}
		} else {
			console.log('   ✓ Latest recording is already the longest; no change needed.');
		}
	}

	if (APPLY) {
		console.log(`\n🔄 Triggering force-refresh for viewers...`);
		await db.collection('memorials').doc(MEMORIAL_ID).update({
			forceRefreshAt: new Date().toISOString()
		});
		console.log('✅ Done.');
	} else {
		console.log('\nℹ️ Dry run complete. Re-run with --apply to write changes.');
	}
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('❌ Error:', err);
		process.exit(1);
	});
