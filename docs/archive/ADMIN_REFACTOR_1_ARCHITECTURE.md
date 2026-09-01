# Admin Dashboard Refactor - Part 1: Information Architecture & Navigation

## Overview

This document outlines the information architecture and navigation refactor for the Tributestream admin dashboard, based on our Firestore collections and enterprise admin UI best practices.

---

## 1. Domain-Based Mental Model

### Core Domains (Top-Level Navigation)

```
┌─────────────────────────────────────────────────────────────┐
│  [Dashboard] [Services] [Users] [Content] [System]         │
└─────────────────────────────────────────────────────────────┘
```

#### **Dashboard** (Home)
- Quick stats and metrics
- Task inbox (pending approvals)
- Recent activity feed
- System health indicators

#### **Services** Domain
- **Memorials** - Memorial management
- **Streams** - Livestream oversight
- **Slideshows** - Photo slideshow library
- **Recordings** - Archive management

#### **Users** Domain
- **Memorial Owners** - Family accounts
- **Funeral Directors** - Professional accounts
- **Viewers** - Public accounts
- **Admins** - Staff accounts

#### **Content** Domain
- **Blog Posts** - CMS management
- **Public Pages** - Static content
- **Email Templates** - Communication templates

#### **System** Domain
- **Audit Logs** - Activity history
- **Edit Requests** - Schedule change approvals
- **Demo Sessions** - Demo environment management
- **Settings** - System configuration

---

## 2. Navigation Structure

### Global Navigation (Top Bar)

```svelte
<nav class="global-nav">
  <!-- Left: Domain switcher -->
  <div class="nav-primary">
    <a href="/admin" class="home-icon">🏠</a>
    <NavItem href="/admin/services" icon="🎬">Services</NavItem>
    <NavItem href="/admin/users" icon="👥">Users</NavItem>
    <NavItem href="/admin/content" icon="📝">Content</NavItem>
    <NavItem href="/admin/system" icon="⚙️">System</NavItem>
  </div>
  
  <!-- Right: Global utilities -->
  <div class="nav-utilities">
    <SearchTrigger />
    <TaskInbox count={pendingCount} />
    <NotificationBell />
    <UserMenu />
  </div>
</nav>
```

### Subnav by Task (Contextual)

**Example: /admin/services**
```
Services > [Memorials] [Streams] [Slideshows] [Recordings]
```

**Example: /admin/users**
```
Users > [Memorial Owners] [Funeral Directors] [Viewers] [Admins]
```

### Breadcrumbs (Always Visible)

```typescript
// Every page has deep-linkable URL structure
/admin/services/memorials
/admin/services/memorials?status=unpaid&sort=createdAt:desc
/admin/services/memorials/abc123
/admin/services/memorials/abc123/edit
/admin/services/memorials/abc123/history
```

**Implementation:**
```svelte
<Breadcrumbs>
  <Crumb href="/admin">Admin</Crumb>
  <Crumb href="/admin/services">Services</Crumb>
  <Crumb href="/admin/services/memorials">Memorials</Crumb>
  {#if memorial}
    <Crumb current>{memorial.lovedOneName}</Crumb>
  {/if}
</Breadcrumbs>
```

---

## 3. Unified Search System

### Search-First Entry Point

**Global Search (Cmd/Ctrl + K)**
```typescript
interface SearchResult {
  type: 'memorial' | 'stream' | 'user' | 'funeral_director' | 
        'blog_post' | 'audit_log' | 'session';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  metadata?: Record<string, any>;
}
```

**Search Scopes:**
- **All Records** - Search across all collections
- **Memorials** - By loved one name, slug, owner email
- **Users** - By name, email, role
- **Streams** - By title, memorial name, status
- **Funeral Directors** - By company name, contact person
- **Audit Logs** - By action, user, resource type
- **IDs** - Direct ID lookup (memorial ID, user UID, stream ID)

**Implementation:**
```svelte
<CommandPalette bind:open={searchOpen}>
  <SearchInput 
    placeholder="Search memorials, users, streams, logs..."
    on:input={handleSearch}
  />
  
  <SearchFilters>
    <FilterChip value="type:memorial">Memorials</FilterChip>
    <FilterChip value="type:user">Users</FilterChip>
    <FilterChip value="status:pending">Pending</FilterChip>
    <FilterChip value="isPaid:false">Unpaid</FilterChip>
  </SearchFilters>
  
  <SearchResults>
    {#each results as result}
      <ResultItem 
        type={result.type} 
        title={result.title}
        subtitle={result.subtitle}
        href={result.url}
      />
    {/each}
  </SearchResults>
</CommandPalette>
```

### Search API Endpoint

```typescript
// /api/admin/search/+server.ts
export async function GET({ url, locals }) {
  const query = url.searchParams.get('q');
  const types = url.searchParams.getAll('type');
  const filters = parseFilters(url.searchParams);
  
  // Search across collections
  const results = await Promise.all([
    types.includes('memorial') ? searchMemorials(query, filters) : [],
    types.includes('user') ? searchUsers(query, filters) : [],
    types.includes('stream') ? searchStreams(query, filters) : [],
    // ... other collections
  ]);
  
  return json({
    results: results.flat().slice(0, 50),
    count: results.flat().length
  });
}
```

---

## 4. Saved Views System

### User-Specific Saved Filters

**Data Structure:**
```typescript
interface SavedView {
  id: string;
  userId: string;
  name: string;
  domain: 'memorials' | 'users' | 'streams' | 'audit_logs';
  filters: Record<string, any>;
  columns: string[];
  sort: { field: string; direction: 'asc' | 'desc' }[];
  isDefault?: boolean;
  isShared?: boolean;
  teamId?: string;
}
```

**Storage:**
```typescript
// Firestore: admin_saved_views collection
await adminDb.collection('admin_saved_views').add({
  userId: locals.user.uid,
  name: 'Unpaid Memorials This Month',
  domain: 'memorials',
  filters: {
    isPaid: false,
    createdAt: { gte: startOfMonth, lte: endOfMonth }
  },
  columns: ['lovedOneName', 'ownerEmail', 'createdAt', 'services.main.location.name'],
  sort: [{ field: 'createdAt', direction: 'desc' }],
  isDefault: false
});
```

### UI Implementation

```svelte
<ViewSelector>
  <ViewTrigger>
    {currentView.name} ▼
  </ViewTrigger>
  
  <ViewDropdown>
    <!-- Personal Views -->
    <ViewSection title="My Views">
      {#each myViews as view}
        <ViewItem 
          name={view.name}
          on:select={() => loadView(view)}
          on:delete={() => deleteView(view.id)}
        />
      {/each}
      <ViewItem 
        icon="➕" 
        name="Save current view"
        on:click={saveCurrentView}
      />
    </ViewSection>
    
    <!-- Team Views -->
    {#if teamViews.length}
      <ViewSection title="Team Views">
        {#each teamViews as view}
          <ViewItem 
            name={view.name}
            shared={true}
            on:select={() => loadView(view)}
          />
        {/each}
      </ViewSection>
    {/if}
    
    <!-- Quick Filters -->
    <ViewSection title="Quick Filters">
      <ViewItem name="Unpaid memorials" on:click={() => applyQuickFilter('unpaid')} />
      <ViewItem name="Pending approvals" on:click={() => applyQuickFilter('pending')} />
      <ViewItem name="Active streams" on:click={() => applyQuickFilter('active-streams')} />
    </ViewSection>
  </ViewDropdown>
</ViewSelector>
```

### Team Presets

**Admin-Created Shared Views:**
```typescript
// Predefined team views for common workflows
const TEAM_PRESETS: SavedView[] = [
  {
    name: '🔴 Unpaid Memorials',
    domain: 'memorials',
    filters: { isPaid: false },
    columns: ['lovedOneName', 'ownerEmail', 'createdAt', 'familyContactPhone'],
    sort: [{ field: 'createdAt', direction: 'desc' }],
    isShared: true
  },
  {
    name: '⏰ Pending Edit Requests',
    domain: 'schedule_edit_requests',
    filters: { status: 'pending' },
    columns: ['memorialName', 'requestedBy', 'createdAt', 'reason'],
    sort: [{ field: 'createdAt', direction: 'asc' }],
    isShared: true
  },
  {
    name: '🎥 Live Streams Now',
    domain: 'streams',
    filters: { status: 'live' },
    columns: ['title', 'memorialName', 'viewerCount', 'startedAt'],
    sort: [{ field: 'startedAt', direction: 'desc' }],
    isShared: true
  }
];
```

---

## 5. URL Structure & Deep Linking

### Consistent URL Patterns

```typescript
// List views with filters
/admin/services/memorials
/admin/services/memorials?status=unpaid
/admin/services/memorials?status=unpaid&sort=createdAt:desc&page=2
/admin/services/memorials?view=abc123 // Saved view ID

// Detail views
/admin/services/memorials/{memorialId}
/admin/services/memorials/{memorialId}/edit
/admin/services/memorials/{memorialId}/history
/admin/services/memorials/{memorialId}/audit

// Related resources
/admin/services/memorials/{memorialId}/streams
/admin/services/memorials/{memorialId}/slideshows

// Cross-domain links
/admin/users/owners/{userId}
/admin/users/owners/{userId}/memorials
/admin/system/audit-logs?resourceId={memorialId}
```

### URL Parsing Utility

```typescript
// lib/admin/urlState.ts
export function parseAdminUrl(url: URL) {
  return {
    domain: url.pathname.split('/')[2], // 'services', 'users', etc.
    resource: url.pathname.split('/')[3], // 'memorials', 'streams', etc.
    id: url.pathname.split('/')[4],
    action: url.pathname.split('/')[5], // 'edit', 'history', etc.
    filters: parseFilters(url.searchParams),
    sort: url.searchParams.get('sort')?.split(':') || ['createdAt', 'desc'],
    page: parseInt(url.searchParams.get('page') || '1'),
    viewId: url.searchParams.get('view')
  };
}

export function buildAdminUrl(state: AdminUrlState) {
  const params = new URLSearchParams();
  
  // Add filters
  Object.entries(state.filters).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  
  // Add sort
  if (state.sort) {
    params.set('sort', `${state.sort[0]}:${state.sort[1]}`);
  }
  
  // Add pagination
  if (state.page > 1) {
    params.set('page', String(state.page));
  }
  
  return `${state.path}?${params.toString()}`;
}
```

### Reload-Safe State Management

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { parseAdminUrl, buildAdminUrl } from '$lib/admin/urlState';
  
  // Parse URL on mount and updates
  $: urlState = parseAdminUrl($page.url);
  
  // Update URL when filters change
  function updateFilters(newFilters) {
    const newUrl = buildAdminUrl({
      ...urlState,
      filters: { ...urlState.filters, ...newFilters },
      page: 1 // Reset to page 1
    });
    goto(newUrl, { replaceState: false, keepFocus: true });
  }
  
  // URL changes trigger data reload automatically
  $: loadData(urlState);
</script>
```

---

## 6. Page Layout Template

### Standard Admin Page Structure

```svelte
<!-- AdminPageLayout.svelte -->
<div class="admin-page">
  <!-- Breadcrumbs -->
  <div class="page-header">
    <Breadcrumbs items={breadcrumbs} />
    <PageActions>
      <slot name="actions" />
    </PageActions>
  </div>
  
  <!-- Filters & Search -->
  <div class="page-controls">
    <div class="left-controls">
      <ViewSelector bind:currentView />
      <FilterBar bind:filters />
    </div>
    <div class="right-controls">
      <SearchInput placeholder="Search..." bind:value={searchQuery} />
      <slot name="controls" />
    </div>
  </div>
  
  <!-- Main Content -->
  <div class="page-content">
    <slot />
  </div>
  
  <!-- Footer with pagination -->
  <div class="page-footer">
    <ResultsCount total={totalResults} showing={showingResults} />
    <Pagination 
      currentPage={page} 
      totalPages={totalPages}
      on:change={handlePageChange}
    />
  </div>
</div>
```

### Example Usage: Memorials List

```svelte
<!-- /admin/services/memorials/+page.svelte -->
<AdminPageLayout breadcrumbs={[
  { label: 'Admin', href: '/admin' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Memorials', current: true }
]}>
  <svelte:fragment slot="actions">
    <Button on:click={exportToCSV}>Export</Button>
    <Button variant="primary" on:click={createMemorial}>Create Memorial</Button>
  </svelte:fragment>
  
  <svelte:fragment slot="controls">
    <ColumnSelector bind:visibleColumns />
    <BulkActions selected={selectedMemorials} />
  </svelte:fragment>
  
  <!-- Data grid -->
  <DataGrid 
    data={memorials}
    columns={visibleColumns}
    sortable={true}
    selectable={true}
    bind:selected={selectedMemorials}
    on:rowClick={handleRowClick}
  />
</AdminPageLayout>
```

---

## 7. Navigation State Management

### Store for Navigation Context

```typescript
// lib/stores/adminNav.ts
import { writable, derived } from 'svelte/store';

interface AdminNavState {
  currentDomain: 'dashboard' | 'services' | 'users' | 'content' | 'system';
  currentResource?: string;
  breadcrumbs: Breadcrumb[];
  pendingTasks: number;
  recentlyViewed: RecentItem[];
}

export const adminNav = writable<AdminNavState>({
  currentDomain: 'dashboard',
  breadcrumbs: [],
  pendingTasks: 0,
  recentlyViewed: []
});

// Track recently viewed items
export function addToRecentlyViewed(item: RecentItem) {
  adminNav.update(state => ({
    ...state,
    recentlyViewed: [item, ...state.recentlyViewed.slice(0, 9)] // Keep 10 max
  }));
}

// Quick navigation to recent items
export const recentlyViewed = derived(adminNav, $nav => $nav.recentlyViewed);
```

---

## 8. Mobile Considerations

### Responsive Navigation

**Desktop: Full horizontal nav**
```
[Dashboard] [Services] [Users] [Content] [System]  |  [Search] [Tasks] [Profile]
```

**Mobile: Hamburger menu**
```
[☰] Tributestream Admin                            [Search] [Tasks]

--- Sidebar when opened ---
Dashboard
Services
  - Memorials
  - Streams
  - Slideshows
Users
  - Owners
  - Funeral Directors
Content
System
```

### Touch-Optimized Controls

```svelte
<nav class="mobile-nav">
  <button class="menu-toggle" on:click={toggleSidebar}>
    ☰
  </button>
  <h1>Admin</h1>
  <button class="search-toggle" on:click={openSearch}>
    🔍
  </button>
  <button class="tasks-toggle" on:click={openTasks}>
    <Badge count={pendingTasks} />
    📋
  </button>
</nav>

<style>
  .mobile-nav button {
    min-height: 44px; /* Touch target size */
    min-width: 44px;
    padding: 12px;
  }
</style>
```

---

## 9. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create global navigation component
- [ ] Implement domain-based routing structure
- [ ] Build breadcrumb system with URL parsing
- [ ] Create AdminPageLayout template
- [ ] Set up URL state management utilities

### Phase 2: Search (Week 2)
- [ ] Implement command palette UI (Cmd+K)
- [ ] Build unified search API endpoint
- [ ] Add Algolia/Firestore search integration
- [ ] Create search result components
- [ ] Add filter chips and scoping

### Phase 3: Saved Views (Week 3)
- [ ] Create `admin_saved_views` Firestore collection
- [ ] Build view selector UI component
- [ ] Implement save/load/delete view logic
- [ ] Create team preset views
- [ ] Add share view functionality

### Phase 4: Polish (Week 4)
- [ ] Mobile-responsive navigation
- [ ] Recently viewed tracking
- [ ] Task inbox integration
- [ ] Performance optimization
- [ ] User testing and refinement

---

## 10. Success Metrics

**Navigation Efficiency:**
- Time to find specific memorial: < 10 seconds
- Clicks to common actions: ≤ 3 clicks
- Search success rate: > 95%

**User Adoption:**
- % of admins using saved views: > 60%
- % using global search daily: > 80%
- Mobile admin usage: > 20% of sessions

**System Performance:**
- Search response time: < 300ms
- Page load time: < 1.5s
- URL state persistence: 100%

---

*Next: See ADMIN_REFACTOR_2_DATA_OPERATIONS.md for data grid, forms, and editing workflows*
