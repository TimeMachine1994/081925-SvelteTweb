import {
	sqliteTable,
	text,
	integer,
	primaryKey,
	index,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { bool, extra, timestamps } from './_helpers';

export const blogPosts = sqliteTable(
	'blog_posts',
	{
		id: text('id').primaryKey(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		excerpt: text('excerpt').notNull().default(''),
		content: text('content').notNull().default(''),
		authorName: text('author_name'),
		authorEmail: text('author_email'),
		authorBio: text('author_bio'),
		authorAvatar: text('author_avatar'),
		featuredImage: text('featured_image'),
		featuredImageAlt: text('featured_image_alt'),
		category: text('category'),
		status: text('status').notNull().default('draft'),
		featured: bool('featured').notNull().default(false),
		metaTitle: text('meta_title'),
		metaDescription: text('meta_description'),
		viewCount: integer('view_count').notNull().default(0),
		publishedAt: text('published_at'),
		isDeleted: bool('is_deleted').notNull().default(false),
		extra,
		...timestamps
	},
	(t) => [
		uniqueIndex('blog_slug_uq').on(t.slug),
		index('blog_status_published_idx').on(t.status, t.publishedAt)
	]
);

export const blogPostTags = sqliteTable(
	'blog_post_tags',
	{
		postId: text('post_id').notNull(),
		tag: text('tag').notNull(),
		kind: text('kind').notNull().default('tag') // 'tag' | 'keyword'
	},
	(t) => [primaryKey({ columns: [t.postId, t.tag, t.kind] })]
);

export const wikiPages = sqliteTable(
	'wiki_pages',
	{
		id: text('id').primaryKey(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		content: text('content').notNull().default(''),
		category: text('category'),
		createdBy: text('created_by').notNull().default(''),
		createdByEmail: text('created_by_email').notNull().default(''),
		updatedBy: text('updated_by').notNull().default(''),
		updatedByEmail: text('updated_by_email').notNull().default(''),
		version: integer('version').notNull().default(1),
		viewCount: integer('view_count').notNull().default(0),
		parentPageId: text('parent_page_id'),
		position: integer('position').notNull().default(0),
		...timestamps
	},
	(t) => [uniqueIndex('wiki_slug_uq').on(t.slug), index('wiki_category_idx').on(t.category)]
);

export const wikiPageTags = sqliteTable(
	'wiki_page_tags',
	{
		pageId: text('page_id').notNull(),
		tag: text('tag').notNull()
	},
	(t) => [primaryKey({ columns: [t.pageId, t.tag] })]
);

export const wikiPageVersions = sqliteTable(
	'wiki_page_versions',
	{
		id: text('id').primaryKey(),
		pageId: text('page_id').notNull(),
		version: integer('version').notNull(),
		title: text('title').notNull(),
		content: text('content').notNull(),
		editedBy: text('edited_by').notNull(),
		editedByEmail: text('edited_by_email').notNull().default(''),
		editedAt: text('edited_at').notNull(),
		changeDescription: text('change_description')
	},
	(t) => [index('wpv_page_idx').on(t.pageId, t.version)]
);

export const wikiCategories = sqliteTable('wiki_categories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	color: text('color').notNull().default('#888888'),
	icon: text('icon'),
	position: integer('position').notNull().default(0),
	...timestamps
});
