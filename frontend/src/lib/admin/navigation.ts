/**
 * ADMIN NAVIGATION CONFIGURATION
 * 
 * Domain-based navigation structure following ADMIN_REFACTOR_1_ARCHITECTURE.md
 */

export interface NavItem {
	id: string;
	label: string;
	href: string;
	icon: string;
	description?: string;
	requiredPermission?: { resource: string; action: string };
	children?: NavItem[];
	badge?: () => Promise<number | null>;
}

export interface NavDomain {
	id: string;
	label: string;
	icon: string;
	items: NavItem[];
}

/**
 * Primary admin navigation organized by domain
 */
export const ADMIN_NAV: NavDomain[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		icon: '📊',
		items: [
			{
				id: 'overview',
				label: 'Overview',
				href: '/admin',
				icon: '🏠',
				description: 'System overview and key metrics'
			}
		]
	},
	{
		id: 'services',
		label: 'Services',
		icon: '🕊️',
		items: [
			{
				id: 'memorials',
				label: 'Memorials',
				href: '/admin/services/memorials',
				icon: '💝',
				description: 'All memorial pages',
				requiredPermission: { resource: 'memorial', action: 'read' }
			},
			{
				id: 'receipts',
				label: 'Receipts',
				href: '/admin/services/receipts',
				icon: '🧾',
				description: 'Payment receipts and invoices',
				requiredPermission: { resource: 'memorial', action: 'read' }
			}
		]
	},
	{
		id: 'users',
		label: 'Users',
		icon: '👥',
		items: [
			{
				id: 'memorial-owners',
				label: 'Memorial Owners',
				href: '/admin/users/memorial-owners',
				icon: '👤',
				description: 'Family and individual users',
				requiredPermission: { resource: 'user', action: 'read' }
			},
			{
				id: 'funeral-directors',
				label: 'Funeral Directors',
				href: '/admin/users/funeral-directors',
				icon: '🏥',
				description: 'Funeral home accounts',
				requiredPermission: { resource: 'funeral_director', action: 'read' }
			}
		]
	},
	{
		id: 'content',
		label: 'Content',
		icon: '📝',
		items: [
			{
				id: 'blog',
				label: 'Blog Posts',
				href: '/admin/content/blog',
				icon: '📰',
				description: 'Blog content management',
				requiredPermission: { resource: 'blog', action: 'read' }
			}
		]
	},
	{
		id: 'system',
		label: 'System',
		icon: '⚙️',
		items: [
			{
				id: 'audit-logs',
				label: 'Audit Logs',
				href: '/admin/system/audit-logs',
				icon: '📋',
				description: 'System activity logs',
				requiredPermission: { resource: 'audit_log', action: 'read' }
			},
			{
				id: 'email-logs',
				label: 'Email Logs',
				href: '/admin/system/email-logs',
				icon: '📧',
				description: 'Email audit trail — view all sent emails',
				requiredPermission: { resource: 'audit_log', action: 'read' }
			},
			{
				id: 'database',
				label: 'Database',
				href: '/admin/system/database',
				icon: '🗄️',
				description: 'Firestore collection CRUD console',
				requiredPermission: { resource: 'system', action: 'read' }
			},
			{
				id: 'wiki',
				label: 'Wiki',
				href: '/admin/wiki',
				icon: '📚',
				description: 'Internal documentation',
				requiredPermission: { resource: 'system', action: 'read' }
			}
		]
	}
];

/**
 * Get nav items accessible to a user based on permissions
 */
export function getAccessibleNav(
	canAccess: (resource: string, action: string) => boolean
): NavDomain[] {
	return ADMIN_NAV.map((domain) => ({
		...domain,
		items: domain.items.filter((item) => {
			if (!item.requiredPermission) return true;
			return canAccess(item.requiredPermission.resource, item.requiredPermission.action);
		})
	})).filter((domain) => domain.items.length > 0);
}

/**
 * Flatten navigation for search
 */
export function getFlatNav(): NavItem[] {
	const flat: NavItem[] = [];
	
	for (const domain of ADMIN_NAV) {
		for (const item of domain.items) {
			flat.push(item);
			if (item.children) {
				flat.push(...item.children);
			}
		}
	}
	
	return flat;
}

/**
 * Find nav item by href
 */
export function findNavItem(href: string): NavItem | null {
	const flat = getFlatNav();
	return flat.find((item) => item.href === href) || null;
}

/**
 * Build breadcrumb trail from current path
 */
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
	const breadcrumbs: Array<{ label: string; href: string }> = [
		{ label: 'Admin', href: '/admin' }
	];

	// Find matching nav item
	const navItem = findNavItem(pathname);
	if (navItem) {
		// Find parent domain
		for (const domain of ADMIN_NAV) {
			if (domain.items.some((item) => item.id === navItem.id)) {
				breadcrumbs.push({
					label: domain.label,
					href: `#${domain.id}`
				});
				break;
			}
		}

		// Add current item
		breadcrumbs.push({
			label: navItem.label,
			href: navItem.href
		});
	}

	return breadcrumbs;
}
