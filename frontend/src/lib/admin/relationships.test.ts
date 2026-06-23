import { describe, it, expect } from 'vitest';
import {
	resolveReference,
	resolveNativeReference,
	resolveAnyReference,
	referenceHref,
	databaseDeepLink
} from './relationships';

describe('resolveReference', () => {
	it('resolves an id-based field with a dedicated route', () => {
		const ref = resolveReference('memorialId', 'abc123');
		expect(ref).toEqual({
			collection: 'memorials',
			by: 'id',
			value: 'abc123',
			route: '/admin/services/memorials/abc123'
		});
	});

	it('resolves a user id-based field to the memorial-owners route', () => {
		const ref = resolveReference('ownerUid', 'user-1');
		expect(ref?.collection).toBe('users');
		expect(ref?.route).toBe('/admin/users/memorial-owners/user-1');
	});

	it('resolves an email-based field without a dedicated route', () => {
		const ref = resolveReference('creatorEmail', 'a@b.com');
		expect(ref).toEqual({
			collection: 'users',
			by: 'email',
			value: 'a@b.com',
			route: null
		});
	});

	it('returns null for unknown fields', () => {
		expect(resolveReference('someRandomField', 'value')).toBeNull();
	});

	it('returns null for empty or non-string values', () => {
		expect(resolveReference('memorialId', '')).toBeNull();
		expect(resolveReference('memorialId', '   ')).toBeNull();
		expect(resolveReference('memorialId', 123)).toBeNull();
		expect(resolveReference('memorialId', null)).toBeNull();
	});

	it('trims surrounding whitespace from the value', () => {
		expect(resolveReference('memorialId', '  abc  ')?.value).toBe('abc');
	});
});

describe('resolveNativeReference', () => {
	it('parses a serialized Firestore reference path', () => {
		const ref = resolveNativeReference({ __type: 'reference', path: 'memorials/m1' });
		expect(ref).toEqual({
			collection: 'memorials',
			by: 'id',
			value: 'm1',
			route: '/admin/services/memorials/m1'
		});
	});

	it('uses the final collection/doc pair for nested paths', () => {
		const ref = resolveNativeReference({
			__type: 'reference',
			path: 'memorials/m1/slideshows/s1'
		});
		expect(ref?.collection).toBe('slideshows');
		expect(ref?.value).toBe('s1');
		expect(ref?.route).toBeNull();
	});

	it('returns null for non-reference values', () => {
		expect(resolveNativeReference({ __type: 'timestamp', value: 'x' })).toBeNull();
		expect(resolveNativeReference('memorials/m1')).toBeNull();
		expect(resolveNativeReference(null)).toBeNull();
	});

	it('returns null for malformed paths', () => {
		expect(resolveNativeReference({ __type: 'reference', path: 'single' })).toBeNull();
		expect(resolveNativeReference({ __type: 'reference', path: '' })).toBeNull();
	});
});

describe('resolveAnyReference', () => {
	it('prefers a native reference over a field match', () => {
		const ref = resolveAnyReference('memorialId', { __type: 'reference', path: 'users/u1' });
		expect(ref?.collection).toBe('users');
		expect(ref?.value).toBe('u1');
	});

	it('falls back to the conventional field resolver', () => {
		const ref = resolveAnyReference('memorialId', 'm1');
		expect(ref?.collection).toBe('memorials');
	});
});

describe('referenceHref', () => {
	it('uses the dedicated route when available', () => {
		const ref = resolveReference('memorialId', 'm1')!;
		expect(referenceHref(ref)).toBe('/admin/services/memorials/m1');
	});

	it('deep-links to the DB browser by document for id refs without a route', () => {
		const ref = resolveReference('streamId', 's1')!;
		expect(referenceHref(ref)).toBe('/admin/system/database?collection=streams&document=s1');
	});

	it('deep-links to the DB browser by field for email refs', () => {
		const ref = resolveReference('creatorEmail', 'a@b.com')!;
		expect(referenceHref(ref)).toBe(
			'/admin/system/database?collection=users&field=email&value=a%40b.com'
		);
	});
});

describe('databaseDeepLink', () => {
	it('builds a collection-only link', () => {
		expect(databaseDeepLink('memorials')).toBe('/admin/system/database?collection=memorials');
	});

	it('builds a document link', () => {
		expect(databaseDeepLink('streams', { document: 's1' })).toBe(
			'/admin/system/database?collection=streams&document=s1'
		);
	});

	it('builds a field/value link', () => {
		expect(databaseDeepLink('users', { field: 'email', value: 'a@b.com' })).toBe(
			'/admin/system/database?collection=users&field=email&value=a%40b.com'
		);
	});
});
