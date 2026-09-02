
export interface WikiPage {
	id: string;
	slug: string;
	title: string;
	content: string;

	// Organization
	category: string | null;
	tags: string[];

	// Metadata
	createdBy: string;
	createdByEmail: string;
	createdAt: string;
	updatedBy: string;
	updatedByEmail: string;
	updatedAt: string;

	// Version
	version: number;

	// Statistics
	viewCount: number;

	// Hierarchy
	parentPageId: string | null;
	order: number;
}

export interface WikiCategory {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	color: string;
	icon: string | null;
	order: number;
	pageCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface WikiPageVersion {
	id: string;
	pageId: string;
	version: number;
	title: string;
	content: string;
	editedBy: string;
	editedByEmail: string;
	editedAt: string;
	changeDescription: string | null;
}

export interface WikiSearchResult {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	category: string | null;
	tags: string[];
	relevance: number;
}

export interface TableOfContentsItem {
	id: string;
	text: string;
	level: number;
	children: TableOfContentsItem[];
}
