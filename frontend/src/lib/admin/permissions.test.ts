import { describe, it, expect } from 'vitest';
import { hasPermission } from './permissions';

const as = (adminRole: string) => ({ uid: 'u1', email: 'a@b.c', adminRole });

describe('invoice permissions', () => {
	it.each(['super_admin', 'content_admin', 'financial_admin'])(
		'%s can create/update invoices',
		(role) => {
			expect(hasPermission(as(role), 'invoice', 'create')).toBe(true);
			expect(hasPermission(as(role), 'invoice', 'update')).toBe(true);
			expect(hasPermission(as(role), 'invoice', 'read')).toBe(true);
		}
	);

	it.each(['customer_support', 'readonly_admin'])('%s cannot create/update invoices', (role) => {
		expect(hasPermission(as(role), 'invoice', 'create')).toBe(false);
		expect(hasPermission(as(role), 'invoice', 'update')).toBe(false);
	});

	it('readonly_admin can still read invoices', () => {
		expect(hasPermission(as('readonly_admin'), 'invoice', 'read')).toBe(true);
	});
});
