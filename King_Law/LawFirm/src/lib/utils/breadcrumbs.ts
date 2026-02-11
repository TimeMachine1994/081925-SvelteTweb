type Breadcrumb = {
	label: string;
	href: string;
};

const segmentLabels: Record<string, string> = {
	dashboard: 'Dashboard',
	client: 'Client',
	lawyer: 'Lawyer',
	admin: 'Admin',
	staff: 'Staff',
	cases: 'Cases',
	case: 'Case',
	documents: 'Documents',
	invoices: 'Invoices',
	messages: 'Messages',
	settings: 'Settings',
	users: 'Users',
	'staff-codes': 'Staff Codes',
	'audit-log': 'Audit Log',
	'pay-bill': 'Pay Bill'
};

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
	const segments = pathname.split('/').filter(Boolean);
	const crumbs: Breadcrumb[] = [];

	// Skip if we're not in the dashboard
	if (segments[0] !== 'dashboard') return [];

	// The role segment (client/lawyer/admin/staff) becomes the "Dashboard" root
	const role = segments[1];
	if (!role) return [];

	crumbs.push({
		label: 'Dashboard',
		href: `/dashboard/${role}`
	});

	// Build remaining breadcrumbs starting after the role segment
	for (let i = 2; i < segments.length; i++) {
		const segment = segments[i];
		const href = '/' + segments.slice(0, i + 1).join('/');

		// If this looks like a dynamic ID (e.g., a UUID or short hash), use the previous segment as context
		if (segment.length > 8 && !segmentLabels[segment]) {
			// It's likely a dynamic [id] param — label it with the previous segment's context
			const parentLabel = segmentLabels[segments[i - 1]] || segments[i - 1];
			crumbs.push({
				label: `${parentLabel} Detail`,
				href
			});
		} else {
			crumbs.push({
				label: segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
				href
			});
		}
	}

	return crumbs;
}
