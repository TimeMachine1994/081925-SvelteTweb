// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';

let dir: string;

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'tweb-chat-test-'));
	process.env.TURSO_DATABASE_URL = `file:${join(dir, 'test.db')}`;
	const { getDb } = await import('../client');
	await migrate(getDb(), { migrationsFolder: join(process.cwd(), 'drizzle') });
});

afterAll(async () => {
	const { getLibsqlClient } = await import('../client');
	getLibsqlClient().close();
	// Windows can briefly hold a lock on the sqlite file after close(); retry the cleanup.
	rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe('chat repo', () => {
	it('defaults to enabled/unlocked settings when none exist yet', async () => {
		const { getChatSettings } = await import('./chat');
		const settings = await getChatSettings('mem-1');
		expect(settings).toEqual({
			memorialId: 'mem-1',
			enabled: true,
			locked: false,
			archived: false
		});
	});

	it('upserts settings', async () => {
		const { upsertChatSettings, getChatSettings } = await import('./chat');
		await upsertChatSettings('mem-1', { locked: true });
		expect(await getChatSettings('mem-1')).toMatchObject({ locked: true, enabled: true });

		await upsertChatSettings('mem-1', { enabled: false });
		expect(await getChatSettings('mem-1')).toMatchObject({ locked: true, enabled: false });
	});

	it('creates, lists, edits, and soft-deletes messages for a user', async () => {
		const {
			createMemorialChatMessage,
			listMemorialChatMessages,
			editMemorialChatMessage,
			softDeleteMemorialChatMessage
		} = await import('./chat');

		const msg = await createMemorialChatMessage({
			memorialId: 'mem-2',
			authorType: 'user',
			userId: 'u1',
			userName: 'Jane',
			userRole: 'owner',
			message: 'Hello world'
		});
		expect(msg.id).toBeTruthy();
		expect(msg.isDeleted).toBe(false);

		let list = await listMemorialChatMessages('mem-2', { limit: 10 });
		expect(list).toHaveLength(1);
		expect(list[0].message).toBe('Hello world');

		await editMemorialChatMessage('mem-2', msg.id, 'Hello, edited');
		list = await listMemorialChatMessages('mem-2', { limit: 10 });
		expect(list[0].message).toBe('Hello, edited');
		expect(list[0].isEdited).toBe(true);

		await softDeleteMemorialChatMessage('mem-2', msg.id, 'u1');
		list = await listMemorialChatMessages('mem-2', { limit: 10 });
		expect(list[0].isDeleted).toBe(true);
		expect(list[0].deletedBy).toBe('u1');
	});

	it('creates guest messages without a userId', async () => {
		const { createMemorialChatMessage } = await import('./chat');
		const msg = await createMemorialChatMessage({
			memorialId: 'mem-3',
			authorType: 'guest',
			userName: 'A Friend',
			guestSessionId: 'sess-abc',
			message: 'Thinking of you all'
		});
		expect(msg.authorType).toBe('guest');
		expect(msg.userId).toBeUndefined();
		expect(msg.guestSessionId).toBe('sess-abc');
	});

	it('lists only messages created after a given timestamp, ascending', async () => {
		const { createMemorialChatMessage, listMemorialChatMessagesSince } = await import('./chat');
		const first = await createMemorialChatMessage({
			memorialId: 'mem-4',
			authorType: 'guest',
			userName: 'Guest A',
			message: 'first'
		});
		await new Promise((r) => setTimeout(r, 5));
		const second = await createMemorialChatMessage({
			memorialId: 'mem-4',
			authorType: 'guest',
			userName: 'Guest B',
			message: 'second'
		});

		const since = await listMemorialChatMessagesSince('mem-4', first.createdAt);
		expect(since.map((m) => m.id)).toEqual([second.id]);
	});

	it('flags and unflags a message', async () => {
		const { createMemorialChatMessage, setMemorialChatMessageFlag, getMemorialChatMessage } =
			await import('./chat');
		const msg = await createMemorialChatMessage({
			memorialId: 'mem-5',
			authorType: 'guest',
			userName: 'Guest',
			message: 'spam?'
		});

		await setMemorialChatMessageFlag('mem-5', msg.id, true, 'reported by viewer');
		let fetched = await getMemorialChatMessage('mem-5', msg.id);
		expect(fetched?.flagged).toBe(true);
		expect(fetched?.flagReason).toBe('reported by viewer');

		await setMemorialChatMessageFlag('mem-5', msg.id, false);
		fetched = await getMemorialChatMessage('mem-5', msg.id);
		expect(fetched?.flagged).toBe(false);
		expect(fetched?.flagReason).toBeUndefined();
	});
});
