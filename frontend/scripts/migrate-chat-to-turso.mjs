// One-time backfill: copies chat history from Firestore into the new unified
// Turso `memorial_chat_messages` / `memorial_chat_settings` tables.
//
// Sources:
//  - streams/{streamId}/chat_messages  (live stream chat — real production data)
//  - memorials/{memorialId}/chat       (old dormant memorial chat — expected near-empty)
//
// This script is idempotent: it reuses each Firestore document's id as the
// new row's id and uses INSERT OR IGNORE, so re-running it only adds
// messages that weren't migrated yet.
//
// Usage:
//   node scripts/migrate-chat-to-turso.mjs --dry-run     # print counts only, no writes
//   node scripts/migrate-chat-to-turso.mjs --yes         # actually write to TURSO_DATABASE_URL
//
// Requires (in the environment, e.g. via .env):
//   PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY   (source: Firestore)
//   TURSO_DATABASE_URL / TURSO_AUTH_TOKEN  (destination: Turso)
//
// This script is NOT run automatically as part of the app deploy — it is a
// manual, one-off cutover step that must be run by someone with production
// credentials, ideally with --dry-run reviewed first.

import 'dotenv/config';
import admin from 'firebase-admin';
import { createClient } from '@libsql/client';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRMED = process.argv.includes('--yes');

if (!DRY_RUN && !CONFIRMED) {
	console.error(
		'Refusing to run without --dry-run or --yes. Review a --dry-run first, then pass --yes to write.'
	);
	process.exit(1);
}

// ── Firestore (source) ─────────────────────────────────────────────────────

const serviceAccountJson = process.env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountJson) {
	console.error('PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY is required to read Firestore.');
	process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
const firestore = admin.firestore();

// ── Turso (destination) ─────────────────────────────────────────────────────

const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const turso = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });

console.log(
	`Source:      Firestore (project ${admin.app().options.credential ? 'from service account' : 'default'})`
);
console.log(
	`Destination: ${tursoUrl.startsWith('file:') ? tursoUrl : tursoUrl.replace(/\/\/.*@/, '//***@')}`
);
console.log(`Mode:        ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE — writing to destination'}`);
console.log('');

function toIsoOrNow(value) {
	if (!value) return new Date().toISOString();
	if (typeof value === 'string') return value;
	if (typeof value?.toDate === 'function') return value.toDate().toISOString();
	const seconds = value?.seconds ?? value?._seconds;
	if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
	const d = new Date(value);
	return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const stats = {
	streamsScanned: 0,
	streamMessages: 0,
	streamMessagesSkippedNoMemorial: 0,
	memorialChatMessages: 0,
	settingsSeeded: 0
};

const insertMessageStmt = `
	INSERT OR IGNORE INTO memorial_chat_messages
		(id, memorial_id, author_type, user_id, user_name, user_role, guest_session_id,
		 message, is_edited, edited_at, is_deleted, deleted_at, deleted_by,
		 flagged, flag_reason, reply_to, source_stream_id, created_at)
	VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

const upsertSettingsStmt = `
	INSERT INTO memorial_chat_settings (memorial_id, enabled, locked, archived, created_at, updated_at)
	VALUES (?,?,?,?,?,?)
	ON CONFLICT(memorial_id) DO UPDATE SET
		enabled = excluded.enabled,
		locked = excluded.locked,
		archived = excluded.archived,
		updated_at = excluded.updated_at
`;

async function writeBatch(statements) {
	if (DRY_RUN || statements.length === 0) return;
	await turso.batch(statements, 'write');
}

// ── 1. Stream chat (real production data) ──────────────────────────────────

const streamsSnap = await firestore.collection('streams').get();
const memorialSettingsSeen = new Map(); // memorialId -> latest chat config seen

for (const streamDoc of streamsSnap.docs) {
	stats.streamsScanned++;
	const stream = streamDoc.data();
	const memorialId = stream.memorialId;

	const chatMessagesSnap = await streamDoc.ref.collection('chat_messages').get();
	if (chatMessagesSnap.empty) continue;

	if (!memorialId) {
		stats.streamMessagesSkippedNoMemorial += chatMessagesSnap.size;
		console.warn(
			`⚠️  Stream ${streamDoc.id} has ${chatMessagesSnap.size} chat message(s) but no memorialId — skipped.`
		);
		continue;
	}

	if (stream.chat) {
		memorialSettingsSeen.set(memorialId, {
			enabled: stream.chat.enabled ?? true,
			locked: stream.chat.locked ?? false,
			archived: stream.chat.archived ?? false
		});
	}

	const batch = [];
	for (const msgDoc of chatMessagesSnap.docs) {
		const m = msgDoc.data();
		const createdAt = toIsoOrNow(m.timestamp);
		batch.push({
			sql: insertMessageStmt,
			args: [
				msgDoc.id,
				memorialId,
				m.isAnonymous ? 'guest' : 'user',
				m.isAnonymous ? null : (m.userId ?? null),
				m.userName ?? 'Anonymous',
				m.userRole ?? null,
				null,
				m.message ?? '',
				false,
				null,
				!!m.deleted,
				m.deletedAt ? toIsoOrNow(m.deletedAt) : null,
				m.deletedBy ?? null,
				!!m.flagged,
				m.flagReason ?? null,
				null,
				streamDoc.id,
				createdAt
			]
		});
	}

	await writeBatch(batch);
	stats.streamMessages += batch.length;
	console.log(`  stream ${streamDoc.id} (memorial ${memorialId}): ${batch.length} message(s)`);
}

// ── 2. Old memorial chat (dormant, expected near-empty) ─────────────────────

const memorialsSnap = await firestore.collection('memorials').get();
for (const memorialDoc of memorialsSnap.docs) {
	const chatSnap = await memorialDoc.ref.collection('chat').get();
	if (chatSnap.empty) continue;

	const batch = [];
	for (const msgDoc of chatSnap.docs) {
		const m = msgDoc.data();
		batch.push({
			sql: insertMessageStmt,
			args: [
				msgDoc.id,
				memorialDoc.id,
				'user',
				m.userId ?? null,
				m.userName ?? 'Anonymous',
				m.userRole ?? null,
				null,
				m.message ?? '',
				!!m.isEdited,
				m.editedAt ? toIsoOrNow(m.editedAt) : null,
				!!m.isDeleted,
				m.deletedAt ? toIsoOrNow(m.deletedAt) : null,
				null,
				false,
				null,
				m.replyTo ?? null,
				null,
				toIsoOrNow(m.timestamp)
			]
		});
	}

	await writeBatch(batch);
	stats.memorialChatMessages += batch.length;
	console.log(`  memorial ${memorialDoc.id} (old chat collection): ${batch.length} message(s)`);
}

// ── 3. Seed settings for every memorial that had stream chat configured ────

const now = new Date().toISOString();
const settingsBatch = [];
for (const [memorialId, cfg] of memorialSettingsSeen) {
	settingsBatch.push({
		sql: upsertSettingsStmt,
		args: [memorialId, cfg.enabled, cfg.locked, cfg.archived, now, now]
	});
}
await writeBatch(settingsBatch);
stats.settingsSeeded = settingsBatch.length;

console.log('');
console.log('Summary:', stats);
if (DRY_RUN) {
	console.log('\nDry run only — no writes were made. Re-run with --yes to apply.');
}

turso.close();
process.exit(0);
