export interface PhoneEntry {
	label: 'family' | 'account';
	value: string;
	tel: string;
}

export const memorialAdminHref = (id: string) => `/admin/services/memorials/${id}`;
export const userAdminHref = (uid: string) => `/admin/users/memorial-owners/${uid}`;

const digits = (s: string) => s.replace(/\D/g, '');

export function toTel(phone: string): string {
	const trimmed = phone.trim();
	return (trimmed.startsWith('+') ? '+' : '') + digits(trimmed);
}

export function contactPhones(opts: {
	familyContactPhone?: string | null;
	ownerPhone?: string | null;
}): PhoneEntry[] {
	const candidates: Array<[PhoneEntry['label'], string | null | undefined]> = [
		['family', opts.familyContactPhone],
		['account', opts.ownerPhone]
	];
	const seen = new Set<string>();
	const out: PhoneEntry[] = [];
	for (const [label, raw] of candidates) {
		const value = typeof raw === 'string' ? raw.trim() : '';
		const key = digits(value);
		if (!value || !key || seen.has(key)) continue;
		seen.add(key);
		out.push({ label, value, tel: toTel(value) });
	}
	return out;
}

export function formatPhones(entries: PhoneEntry[]): string {
	if (entries.length === 0) return '—';
	return entries.map((e) => `${e.value} (${e.label})`).join(' · ');
}

export function memorialRowHref(
	m: { id: string; ownerUid?: string | null },
	canViewUsers: boolean
): string {
	return m.ownerUid && canViewUsers ? userAdminHref(m.ownerUid) : memorialAdminHref(m.id);
}
