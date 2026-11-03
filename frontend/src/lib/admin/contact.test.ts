import { describe, it, expect } from 'vitest';
import { toTel, contactPhones, formatPhones, memorialRowHref } from './contact';

describe('toTel', () => {
	it('keeps a leading + and strips formatting', () => {
		expect(toTel('+1 (555) 123-4567')).toBe('+15551234567');
		expect(toTel('555-123-4567')).toBe('5551234567');
	});
});

describe('contactPhones', () => {
	it('returns both labeled numbers when different', () => {
		const r = contactPhones({ familyContactPhone: '555-111-2222', ownerPhone: '555-333-4444' });
		expect(r.map((e) => e.label)).toEqual(['family', 'account']);
	});
	it('dedupes numbers that differ only in formatting, family wins', () => {
		const r = contactPhones({ familyContactPhone: '(555) 111-2222', ownerPhone: '555-111-2222' });
		expect(r).toHaveLength(1);
		expect(r[0].label).toBe('family');
	});
	it('handles account-only, family-only and neither', () => {
		expect(contactPhones({ ownerPhone: '555-1' })[0].label).toBe('account');
		expect(contactPhones({ familyContactPhone: '555-1' })[0].label).toBe('family');
		expect(contactPhones({ familyContactPhone: ' ', ownerPhone: null })).toEqual([]);
	});
});

describe('formatPhones', () => {
	it('formats entries and empty state', () => {
		expect(formatPhones([])).toBe('—');
		expect(formatPhones(contactPhones({ familyContactPhone: '111', ownerPhone: '222' }))).toBe(
			'111 (family) · 222 (account)'
		);
	});
});

describe('memorialRowHref', () => {
	it('goes to the owner when present and permitted', () => {
		expect(memorialRowHref({ id: 'm1', ownerUid: 'u1' }, true)).toBe(
			'/admin/users/memorial-owners/u1'
		);
	});
	it('falls back to the memorial otherwise', () => {
		expect(memorialRowHref({ id: 'm1', ownerUid: 'u1' }, false)).toBe(
			'/admin/services/memorials/m1'
		);
		expect(memorialRowHref({ id: 'm1', ownerUid: '' }, true)).toBe('/admin/services/memorials/m1');
		expect(memorialRowHref({ id: 'm1' }, false)).toBe('/admin/services/memorials/m1');
	});
});
