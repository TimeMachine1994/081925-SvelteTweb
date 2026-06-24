/**
 * ADMIN ICON REGISTRY
 *
 * Maps semantic string keys to Lucide icon components, replacing the
 * emoji-as-icon pattern previously used throughout the admin UI.
 *
 * Navigation and components reference icons by key (e.g. 'memorials'),
 * and `AdminIcon` resolves the key to a component. Unknown keys fall
 * back to a neutral dot icon.
 */
import {
	LayoutDashboard,
	Home,
	HeartHandshake,
	ReceiptText,
	Video,
	Users,
	User,
	Building2,
	FileText,
	Newspaper,
	ScrollText,
	Mail,
	Database,
	BookOpen,
	Settings,
	Search,
	Bird,
	Archive,
	Calendar,
	CircleCheck,
	TriangleAlert,
	CircleDollarSign,
	Circle,
	Plus,
	Filter,
	Pencil,
	Trash2,
	Eye,
	RefreshCw,
	Globe,
	Lock,
	type IconProps
} from '@lucide/svelte';
import type { Component } from 'svelte';

export type IconComponent = Component<IconProps>;

export type IconKey =
	| 'dashboard'
	| 'overview'
	| 'services'
	| 'memorials'
	| 'receipts'
	| 'recordings'
	| 'streams'
	| 'users'
	| 'user'
	| 'funeral-directors'
	| 'content'
	| 'blog'
	| 'audit-logs'
	| 'email-logs'
	| 'database'
	| 'wiki'
	| 'system'
	| 'search'
	| 'logo'
	| 'archive'
	| 'calendar'
	| 'complete'
	| 'incomplete'
	| 'payment'
	| 'add'
	| 'filter'
	| 'edit'
	| 'delete'
	| 'view'
	| 'refresh'
	| 'public'
	| 'private';

export const ICONS: Record<IconKey, IconComponent> = {
	dashboard: LayoutDashboard,
	overview: Home,
	services: Bird,
	memorials: HeartHandshake,
	receipts: ReceiptText,
	recordings: Video,
	streams: Video,
	users: Users,
	user: User,
	'funeral-directors': Building2,
	content: FileText,
	blog: Newspaper,
	'audit-logs': ScrollText,
	'email-logs': Mail,
	database: Database,
	wiki: BookOpen,
	system: Settings,
	search: Search,
	logo: Bird,
	archive: Archive,
	calendar: Calendar,
	complete: CircleCheck,
	incomplete: TriangleAlert,
	payment: CircleDollarSign,
	add: Plus,
	filter: Filter,
	edit: Pencil,
	delete: Trash2,
	view: Eye,
	refresh: RefreshCw,
	public: Globe,
	private: Lock
};

export function resolveIcon(key: string | undefined): IconComponent {
	if (key && key in ICONS) {
		return ICONS[key as IconKey];
	}
	return Circle;
}
