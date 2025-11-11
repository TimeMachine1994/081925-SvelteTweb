# Admin Wiki System - Implementation Guide

## Overview

Private, admin-only wiki system for internal documentation and knowledge management. All content stored in Firestore with full CRUD operations, markdown editing, internal linking, categorization, search, and table of contents generation.

---

## 🎯 Core Features

- ✅ **CRUD Operations** - Create, read, update, delete wiki pages
- ✅ **Markdown Editor** - Simple editor with live preview
- ✅ **Categories & Tags** - Organize content with categories and tags
- ✅ **Internal Linking** - Wiki-style links between pages `[[Page Title]]`
- ✅ **Table of Contents** - Auto-generated from markdown headers
- ✅ **Search** - Full-text search across all pages
- ✅ **Admin-Only Access** - Restricted to admin users only

---

## 📁 File Structure (Isolated)

```
frontend/src/
├── lib/
│   ├── types/
│   │   └── wiki.ts                          # Wiki type definitions
│   ├── utils/
│   │   └── wiki/
│   │       ├── markdown.ts                   # Markdown parsing utilities
│   │       ├── toc.ts                        # Table of contents generator
│   │       └── wiki-links.ts                 # Wiki link parser
│   └── components/
│       └── wiki/
│           ├── WikiEditor.svelte             # Markdown editor component
│           ├── WikiSearch.svelte             # Search component
│           ├── WikiTableOfContents.svelte    # TOC component
│           ├── WikiCategoryFilter.svelte     # Category filter
│           ├── WikiPageCard.svelte           # Page preview card
│           └── WikiBreadcrumbs.svelte        # Navigation breadcrumbs
│
└── routes/
    └── admin/
        └── wiki/
            ├── +page.svelte                  # Wiki homepage (list all pages)
            ├── +page.server.ts               # Load all pages
            ├── new/
            │   ├── +page.svelte              # Create new page
            │   └── +page.server.ts           # Create page action
            ├── [slug]/
            │   ├── +page.svelte              # View page
            │   ├── +page.server.ts           # Load page data
            │   └── edit/
            │       ├── +page.svelte          # Edit page
            │       └── +page.server.ts       # Update page action
            └── api/
                ├── search/
                │   └── +server.ts            # Search endpoint
                └── pages/
                    ├── +server.ts            # List/create pages
                    └── [id]/
                        └── +server.ts        # Update/delete page

```

---

## 🗄️ Firestore Collections

### Collection: `wiki_pages`

```typescript
{
  id: string,                    // Auto-generated document ID
  slug: string,                  // URL-friendly identifier (unique)
  title: string,                 // Page title
  content: string,               // Markdown content
  
  // Organization
  category: string | null,       // Category name
  tags: string[],                // Array of tag strings
  
  // Metadata
  createdBy: string,             // Admin user ID
  createdByEmail: string,        // Admin email
  createdAt: Timestamp,          // Creation timestamp
  updatedBy: string,             // Last editor user ID
  updatedByEmail: string,        // Last editor email
  updatedAt: Timestamp,          // Last update timestamp
  
  // Version tracking
  version: number,               // Current version number
  
  // Statistics
  viewCount: number,             // Number of views
  
  // Hierarchy (optional - for future use)
  parentPageId: string | null,   // Parent page for nesting
  order: number                  // Manual ordering within category
}
```

### Collection: `wiki_categories`

```typescript
{
  id: string,                    // Auto-generated
  name: string,                  // Category name (unique)
  slug: string,                  // URL-friendly identifier
  description: string | null,    // Optional description
  color: string,                 // Hex color for UI
  icon: string | null,           // Optional icon name
  order: number,                 // Display order
  pageCount: number,             // Number of pages in category
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `wiki_page_versions` (Future Enhancement)

```typescript
{
  id: string,
  pageId: string,                // Reference to wiki_pages
  version: number,               // Version number
  title: string,                 // Title at this version
  content: string,               // Content at this version
  editedBy: string,              // Editor user ID
  editedByEmail: string,         // Editor email
  editedAt: Timestamp,           // Edit timestamp
  changeDescription: string | null  // Optional change note
}
```

---

## 🔧 Type Definitions

### `frontend/src/lib/types/wiki.ts`

```typescript
import type { Timestamp } from 'firebase/firestore';

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
  createdAt: Date | Timestamp;
  updatedBy: string;
  updatedByEmail: string;
  updatedAt: Date | Timestamp;
  
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
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface WikiPageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  editedBy: string;
  editedByEmail: string;
  editedAt: Date | Timestamp;
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
```

---

## 🔗 Wiki Link Syntax

### Internal Page Links

```markdown
Link to another page: [[Page Title]]
Link with custom text: [[Page Title|Custom Link Text]]
```

### How It Works

1. Parser finds `[[...]]` patterns in markdown
2. Looks up page by title to get slug
3. Converts to: `<a href="/admin/wiki/{slug}">Page Title</a>`
4. If page doesn't exist: Shows red link (create prompt)

### Implementation: `frontend/src/lib/utils/wiki/wiki-links.ts`

```typescript
export interface WikiLinkMatch {
  fullMatch: string;
  pageTitle: string;
  displayText: string;
  isValid: boolean;
}

/**
 * Parse wiki-style links [[Page Title]] or [[Page Title|Display Text]]
 */
export function parseWikiLinks(content: string): WikiLinkMatch[] {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const matches: WikiLinkMatch[] = [];
  
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      pageTitle: match[1].trim(),
      displayText: (match[2] || match[1]).trim(),
      isValid: true // Will be validated against actual pages
    });
  }
  
  return matches;
}

/**
 * Convert wiki links to HTML links
 */
export async function convertWikiLinksToHtml(
  content: string, 
  pageMap: Map<string, string> // Map of title -> slug
): Promise<string> {
  const links = parseWikiLinks(content);
  let result = content;
  
  for (const link of links) {
    const slug = pageMap.get(link.pageTitle.toLowerCase());
    
    if (slug) {
      // Valid link - convert to anchor
      const htmlLink = `<a href="/admin/wiki/${slug}" class="wiki-link">${link.displayText}</a>`;
      result = result.replace(link.fullMatch, htmlLink);
    } else {
      // Invalid link - show as red/broken link
      const htmlLink = `<span class="wiki-link-broken" title="Page does not exist">${link.displayText}</span>`;
      result = result.replace(link.fullMatch, htmlLink);
    }
  }
  
  return result;
}

/**
 * Extract all wiki links from content
 */
export function extractWikiLinks(content: string): string[] {
  const links = parseWikiLinks(content);
  return [...new Set(links.map(l => l.pageTitle))];
}
```

---

## 📖 Table of Contents Generation

### Implementation: `frontend/src/lib/utils/wiki/toc.ts`

```typescript
import type { TableOfContentsItem } from '$lib/types/wiki';

/**
 * Generate table of contents from markdown content
 */
export function generateTableOfContents(markdown: string): TableOfContentsItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    headings.push({ level, text, id });
  }
  
  return buildTocTree(headings);
}

/**
 * Build hierarchical tree structure from flat heading list
 */
function buildTocTree(headings: { level: number; text: string; id: string }[]): TableOfContentsItem[] {
  const root: TableOfContentsItem[] = [];
  const stack: TableOfContentsItem[] = [];
  
  for (const heading of headings) {
    const item: TableOfContentsItem = {
      id: heading.id,
      text: heading.text,
      level: heading.level,
      children: []
    };
    
    // Find parent based on level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }
    
    stack.push(item);
  }
  
  return root;
}

/**
 * Add IDs to markdown headings for anchor links
 */
export function addHeadingIds(markdown: string): string {
  return markdown.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return `${hashes} ${text} {#${id}}`;
  });
}
```

---

## 🎨 Markdown Processing

### Implementation: `frontend/src/lib/utils/wiki/markdown.ts`

```typescript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Configure marked with custom settings
 */
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  headerIds: true, // Add IDs to headers
  mangle: false, // Don't escape autolinked email
});

/**
 * Parse markdown to HTML with sanitization
 */
export function parseMarkdown(content: string): string {
  const html = marked.parse(content);
  return DOMPurify.sanitize(html as string, {
    ADD_ATTR: ['target'], // Allow target="_blank" for external links
  });
}

/**
 * Extract plain text excerpt from markdown
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
  // Remove markdown syntax
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/\[\[(.+?)(?:\|.+?)?\]\]/g, '$1') // Wiki links
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(markdown: string): number {
  const wordsPerMinute = 200;
  const words = markdown.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
```

---

## 🔍 Search Implementation

### Simple Client-Side Search

For initial implementation, use client-side search across loaded pages:

```typescript
/**
 * Search wiki pages by title and content
 */
export function searchPages(
  pages: WikiPage[], 
  query: string
): WikiSearchResult[] {
  const lowerQuery = query.toLowerCase();
  
  return pages
    .map(page => {
      let relevance = 0;
      
      // Title match (highest priority)
      if (page.title.toLowerCase().includes(lowerQuery)) {
        relevance += 10;
      }
      
      // Tag match
      if (page.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        relevance += 5;
      }
      
      // Category match
      if (page.category?.toLowerCase().includes(lowerQuery)) {
        relevance += 3;
      }
      
      // Content match
      const contentIndex = page.content.toLowerCase().indexOf(lowerQuery);
      if (contentIndex !== -1) {
        relevance += 1;
        
        // Extract excerpt around match
        const start = Math.max(0, contentIndex - 50);
        const end = Math.min(page.content.length, contentIndex + 150);
        const excerpt = '...' + page.content.substring(start, end) + '...';
        
        return {
          id: page.id,
          slug: page.slug,
          title: page.title,
          excerpt,
          category: page.category,
          tags: page.tags,
          relevance
        };
      }
      
      return null;
    })
    .filter((result): result is WikiSearchResult => result !== null && result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
}
```

---

## 🚀 Implementation Steps

### Step 1: Create Type Definitions
Create `frontend/src/lib/types/wiki.ts` with all type interfaces.

### Step 2: Create Utility Functions
- `frontend/src/lib/utils/wiki/markdown.ts` - Markdown parsing
- `frontend/src/lib/utils/wiki/toc.ts` - Table of contents
- `frontend/src/lib/utils/wiki/wiki-links.ts` - Wiki link parser

### Step 3: Install Dependencies

```bash
cd frontend
npm install marked isomorphic-dompurify
npm install -D @types/marked
```

### Step 4: Create Components
- `WikiEditor.svelte` - Markdown editor with preview
- `WikiSearch.svelte` - Search input and results
- `WikiTableOfContents.svelte` - TOC sidebar
- `WikiCategoryFilter.svelte` - Category filtering
- `WikiPageCard.svelte` - Page preview cards

### Step 5: Create Routes
1. **Homepage** - `/admin/wiki/+page.svelte` - List all pages
2. **View Page** - `/admin/wiki/[slug]/+page.svelte` - View single page
3. **Create Page** - `/admin/wiki/new/+page.svelte` - Create new page
4. **Edit Page** - `/admin/wiki/[slug]/edit/+page.svelte` - Edit page

### Step 6: Create API Endpoints
- `GET /admin/wiki/api/pages` - List all pages
- `POST /admin/wiki/api/pages` - Create page
- `PUT /admin/wiki/api/pages/[id]` - Update page
- `DELETE /admin/wiki/api/pages/[id]` - Delete page
- `GET /admin/wiki/api/search?q={query}` - Search pages

### Step 7: Setup Firestore Indexes

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "wiki_pages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "wiki_pages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Step 8: Setup Firestore Security Rules

Add to `firestore.rules`:

```javascript
// Wiki pages - Admin only
match /wiki_pages/{pageId} {
  allow read, write: if isAdmin();
}

match /wiki_categories/{categoryId} {
  allow read, write: if isAdmin();
}

match /wiki_page_versions/{versionId} {
  allow read, write: if isAdmin();
}
```

---

## 🎨 UI Design Guidelines

### Color Scheme
- **Primary**: Use existing admin gold (#D5BA7F)
- **Background**: Light gray/white for readability
- **Sidebar**: Darker gray for TOC/navigation
- **Links**: Blue for external, gold for internal wiki links
- **Broken Links**: Red for non-existent pages

### Layout
```
┌─────────────────────────────────────────────┐
│ Admin Header / Navigation                   │
├──────────┬──────────────────────┬───────────┤
│          │                      │           │
│ Category │   Page Content       │    TOC    │
│ Sidebar  │                      │ Sidebar   │
│          │                      │           │
│ - Cat 1  │   # Page Title       │ • Header1 │
│ - Cat 2  │                      │ • Header2 │
│          │   Content here...    │   - Sub1  │
│          │                      │   - Sub2  │
│          │                      │           │
└──────────┴──────────────────────┴───────────┘
```

### Editor Layout (Split View)
```
┌─────────────────────────────────────────────┐
│ Title: [Input Field]                        │
│ Category: [Dropdown] Tags: [Input]          │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   Markdown Editor    │    Live Preview      │
│                      │                      │
│   # Heading          │  Heading             │
│   Content...         │  Content...          │
│                      │                      │
└──────────────────────┴──────────────────────┘
│ [Cancel] [Save Draft] [Publish]             │
└─────────────────────────────────────────────┘
```

---

## 📋 Example Page Data

### Example Wiki Page

```typescript
{
  id: "abc123",
  slug: "getting-started",
  title: "Getting Started with Tributestream",
  content: `# Getting Started

Welcome to the Tributestream admin wiki!

## Overview
This guide will help you understand the platform.

## Key Concepts
- [[Memorials]] - Creating memorial pages
- [[Streams]] - Setting up live streams
- [[Users]] - Managing user accounts

## Next Steps
1. Read the [[Admin Guide]]
2. Learn about [[Payment Processing]]
3. Review [[Best Practices|our best practices]]
`,
  category: "Documentation",
  tags: ["getting-started", "admin", "guide"],
  createdBy: "admin-uid-123",
  createdByEmail: "admin@tributestream.com",
  createdAt: "2025-01-01T00:00:00Z",
  updatedBy: "admin-uid-123",
  updatedByEmail: "admin@tributestream.com",
  updatedAt: "2025-01-15T10:30:00Z",
  version: 3,
  viewCount: 45,
  parentPageId: null,
  order: 0
}
```

---

## 🔐 Access Control

### Authentication Check

All wiki routes should verify admin access:

```typescript
// In +page.server.ts
export async function load({ locals }) {
  if (!locals.user || locals.user.role !== 'admin') {
    throw redirect(303, '/admin');
  }
  
  // Load wiki data...
}
```

### Firestore Rules

```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.role == 'admin';
}

match /wiki_pages/{pageId} {
  allow read, write: if isAdmin();
}
```

---

## 🎯 Feature Roadmap

### Phase 1: Core (Current)
- ✅ Page CRUD operations
- ✅ Markdown editor
- ✅ Categories and tags
- ✅ Internal wiki links
- ✅ Table of contents
- ✅ Basic search

### Phase 2: Enhancements
- 📋 Version history with diffs
- 📋 File/image uploads to Firebase Storage
- 📋 Page templates
- 📋 Export to PDF/Markdown

### Phase 3: Advanced
- 📋 Full-text search with Algolia
- 📋 Comments/discussions
- 📋 Page analytics
- 📋 Collaborative editing indicators

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "marked": "^11.0.0",
    "isomorphic-dompurify": "^2.11.0"
  },
  "devDependencies": {
    "@types/marked": "^6.0.0"
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Create new wiki page
- [ ] Edit existing page
- [ ] Delete page
- [ ] Search pages by title
- [ ] Search pages by content
- [ ] Filter by category
- [ ] Click wiki links between pages
- [ ] View table of contents
- [ ] Click TOC links to navigate
- [ ] Add/remove tags
- [ ] Change category
- [ ] View markdown preview in editor
- [ ] Verify admin-only access
- [ ] Test broken wiki links display

---

## 📝 Notes

- All wiki content is private and admin-only
- Markdown is the primary content format for simplicity
- Wiki links use `[[Page Title]]` syntax for familiarity
- Table of contents auto-generates from H1-H6 headers
- Search is client-side initially (can upgrade to Algolia later)
- Categories help organize content logically
- Tags enable cross-category connections

---

## 🚀 Quick Start Command

```bash
# Install dependencies
cd frontend
npm install marked isomorphic-dompurify

# Create required directories
mkdir -p src/lib/types
mkdir -p src/lib/utils/wiki
mkdir -p src/lib/components/wiki
mkdir -p src/routes/admin/wiki

# Start implementing based on this guide!
```
