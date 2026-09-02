// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { createTestDb, type TestDb } from '../setup-db';
import { memorials, memorialFollowers, users } from '../../src/lib/server/db/schema';

let db: TestDb;
let cleanup: () => void;

beforeAll(async () => {
	({ db, cleanup } = await createTestDb());
});
afterAll(() => cleanup());

describe('turso schema', () => {
	it('applies migrations and round-trips a memorial', async () => {
		await db.insert(memorials).values({
			id: 'm1',
			lovedOneName: 'Jane Doe',
			slug: 'jane-doe',
			fullSlug: 'celebration-of-life-for-jane-doe',
			calculatorConfig: { status: 'draft', total: 100 }
		});
		const [row] = await db
			.select()
			.from(memorials)
			.where(eq(memorials.fullSlug, 'celebration-of-life-for-jane-doe'));
		expect(row.lovedOneName).toBe('Jane Doe');
		expect(row.isPublic).toBe(true);
		expect(row.calculatorConfig).toEqual({ status: 'draft', total: 100 });
		expect(row.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it('enforces unique full_slug', async () => {
		await expect(
			db
				.insert(memorials)
				.values({
					id: 'm2',
					lovedOneName: 'X',
					slug: 'x',
					fullSlug: 'celebration-of-life-for-jane-doe'
				})
		).rejects.toThrow();
	});

	it('indexes public memorials in FTS5 via triggers', async () => {
		const hits = await db.all<{ entity_id: string }>(
			sql`select entity_id from search_index where search_index match 'jane'`
		);
		expect(hits.map((h) => h.entity_id)).toEqual(['m1']);

		await db.update(memorials).set({ isPublic: false }).where(eq(memorials.id, 'm1'));
		const after = await db.all(
			sql`select entity_id from search_index where search_index match 'jane'`
		);
		expect(after).toHaveLength(0);
	});

	it('follower join table is idempotent and countable', async () => {
		await db.insert(users).values({ id: 'u1', email: 'u1@x.test' });
		const follow = { memorialId: 'm1', userId: 'u1', followedAt: new Date().toISOString() };
		await db.insert(memorialFollowers).values(follow).onConflictDoNothing();
		await db.insert(memorialFollowers).values(follow).onConflictDoNothing();
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(memorialFollowers)
			.where(eq(memorialFollowers.memorialId, 'm1'));
		expect(count).toBe(1);
	});
});
