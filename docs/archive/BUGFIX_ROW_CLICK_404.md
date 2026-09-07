# 🐛 Bug Fix: Row Click Navigation 404 Issue

**Issue:** Clicking on rows in DataGrid (including checkboxes) was triggering navigation to non-existent detail pages, resulting in 404 errors.

**Date Fixed:** November 12, 2025

---

## 🔍 Root Cause

1. **Row Click Handler Always Active** - All admin pages had `onRowClick` handlers that navigated to detail pages (e.g., `/admin/services/memorials/abc123`)
2. **Detail Pages Don't Exist Yet** - Phase 1 focused on list pages; detail pages are planned for Phase 3
3. **Checkbox Click Propagation** - Clicking checkboxes was triggering the row click handler despite `stopPropagation`

---

## ✅ Solution

### 1. Enhanced DataGrid Component
**File:** `frontend/src/lib/components/admin/DataGrid.svelte`

**Changes:**
- Added proper click target detection to prevent checkbox clicks from triggering row navigation
- Added `.clickable` CSS class to show cursor:pointer only when `onRowClick` is provided
- Wrapped checkbox `<td>` with `onclick={(e) => e.stopPropagation()}` to stop event bubbling
- Enhanced row click handler to check if target is INPUT or inside `.checkbox-cell`

```svelte
<tr
  class="data-row"
  class:clickable={onRowClick}
  onclick={(e) => {
    if (!onRowClick) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('.checkbox-cell')) return;
    onRowClick(row);
  }}
>
  {#if selectable}
    <td class="checkbox-cell" onclick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={selectedMemorials.has(row.id)}
        onchange={() => toggleSelection(row.id)}
      />
    </td>
  {/if}
  <!-- ... columns ... -->
</tr>
```

### 2. Temporarily Disabled Row Click Navigation
**Files:** All 10 admin page components

**Changed in:**
- `routes/admin/services/memorials/+page.svelte`
- `routes/admin/services/streams/+page.svelte`
- `routes/admin/services/slideshows/+page.svelte`
- `routes/admin/services/schedule-requests/+page.svelte`
- `routes/admin/users/memorial-owners/+page.svelte`
- `routes/admin/users/funeral-directors/+page.svelte`
- `routes/admin/users/admin-users/+page.svelte`
- `routes/admin/content/blog/+page.svelte`
- `routes/admin/system/audit-logs/+page.svelte`
- `routes/admin/system/demo-sessions/+page.svelte`
- `routes/admin/system/deleted-items/+page.svelte`

**Action Taken:**
- Removed `onRowClick={handleRowClick}` prop from all `<DataGrid>` components
- Added HTML comments indicating feature is temporarily disabled
- Kept handler functions for future use when detail pages are created

**Example:**
```svelte
<DataGrid
  {columns}
  data={data.memorials}
  selectable={$can('memorial', 'update')}
  selectedMemorials={selectedMemorials}
  onBulkAction={handleBulkAction}
  resourceType="memorial"
/>
<!-- onRowClick disabled until detail pages are created -->
```

---

## 🎯 Expected Behavior Now

### ✅ Working Correctly
- **Checkbox Selection** - Click checkboxes to select/deselect items without navigation
- **Bulk Actions** - Select multiple items and perform bulk operations
- **Row Hover** - Rows still highlight on hover
- **Sorting** - Click column headers to sort
- **Filtering** - Use FilterBuilder to filter data

### 🚧 Temporarily Disabled
- **Row Click Navigation** - Clicking rows does nothing (no 404s)
- Will be re-enabled when detail pages are created in Phase 3

---

## 📋 Next Steps (Phase 3)

1. **Create Detail Pages** for each resource type:
   - `/admin/services/memorials/[id]` - Memorial detail view
   - `/admin/services/streams/[id]` - Stream detail view
   - `/admin/users/memorial-owners/[id]` - User profile view
   - `/admin/users/funeral-directors/[id]` - Director profile view
   - etc.

2. **Re-enable Row Click Navigation** by adding back `onRowClick` prop once detail pages exist

3. **Add Edit Forms** for inline/modal editing

---

## 🧪 Testing Checklist

- [x] Click checkbox - selects item without navigation
- [x] Click row (not checkbox) - no navigation, no 404
- [x] Select multiple items - bulk action bar appears
- [x] Click anywhere on row - no 404 errors
- [x] Hover over row - still shows hover effect
- [x] Sort columns - works correctly
- [x] Filter data - works correctly

---

## 🎉 Result

**Before:** Clicking anywhere on a row → 404 error  
**After:** Clicking row → no action, checkboxes work perfectly

Users can now safely:
- Select items with checkboxes
- Perform bulk actions
- Sort and filter data
- Browse all admin pages without encountering 404s
