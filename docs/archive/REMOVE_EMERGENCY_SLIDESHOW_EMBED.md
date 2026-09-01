# Remove Emergency Slideshow Embed Feature

## 🎯 Objective
Remove the Emergency Slideshow Embed override functionality completely, leaving only the normal PhotoSlideshowCreator slideshows.

---

## 📋 Files to Modify/Delete

### **Files to DELETE Completely**
1. `frontend/src/routes/api/memorials/[memorialId]/slideshow-embed/+server.ts`

### **Files to MODIFY**
1. `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`
2. `frontend/src/lib/components/SlideshowSection.svelte`
3. `frontend/src/routes/[fullSlug]/+page.svelte`
4. `frontend/src/routes/[fullSlug]/+page.server.ts`
5. `frontend/src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

---

## 🗑️ Step 1: Delete API Endpoint

**File:** `frontend/src/routes/api/memorials/[memorialId]/slideshow-embed/+server.ts`

**Action:** DELETE entire file (85 lines)

This removes the POST and DELETE endpoints for creating/removing slideshow embeds.

---

## 🔧 Step 2: Remove Admin UI Components

**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`

### **A. Remove State Variables (Lines 43-51)**
```svelte
// DELETE THESE LINES:
let showSlideshowEmbed = $state(false);
let slideshowEmbedCode = $state('');
let slideshowEmbedTitle = $state('');
let slideshowEmbedLocation = $state('header'); // 'header' or 'body'
let isCreatingSlideshowEmbed = $state(false);

// Edit slideshow embed modal
let showEditSlideshowModal = $state(false);
```

### **B. Remove Handler Functions (Lines 222-295)**
```svelte
// DELETE ALL THESE FUNCTIONS:

async function handleCreateSlideshowEmbed() {
	// ... lines 223-256
}

function cancelSlideshowEmbedForm() {
	// ... lines 258-263
}

function openEditSlideshowModal() {
	// ... lines 265-267
}

function closeEditSlideshowModal() {
	// ... lines 269-271
}

async function handleRemoveSlideshowEmbed() {
	// ... lines 273-295
}
```

### **C. Simplify Slideshows Section (Lines 482-598)**

**REPLACE the entire section with:**
```svelte
<div class="card">
	<div class="section-header">
		<h2>🖼️ Slideshows ({slideshows.length})</h2>
	</div>
	
	{#if slideshows.length === 0}
		<p class="empty-message">No slideshows yet. Create one to commemorate {memorial.lovedOneName}.</p>
	{/if}
	
	<div class="slideshows-list">
		{#each slideshows as slideshow}
			<a 
				href="/slideshow-generator?memorialId={memorial.id}&slideshowId={slideshow.id}" 
				class="slideshow-item"
				title="Click to edit slideshow"
			>
				<div class="slideshow-info">
					<h3>{slideshow.title}</h3>
					<p>{slideshow.photos?.length || 0} photos • Status: {slideshow.status}</p>
					{#if slideshow.musicTrackTitle}
						<p class="music-info">🎵 {slideshow.musicTrackTitle}</p>
					{/if}
				</div>
				<div class="slideshow-actions">
					<span class="edit-icon">✏️ Edit</span>
				</div>
			</a>
		{/each}
	</div>
</div>
```

**Lines to DELETE:**
- Lines 485-487: "Create Slideshow Embed" button
- Lines 490-508: Active slideshow embed display
- Lines 510-572: Slideshow embed creation form
- Lines 617-649: Edit slideshow modal

---

## 🔧 Step 3: Simplify SlideshowSection Component

**File:** `frontend/src/lib/components/SlideshowSection.svelte`

### **A. Remove TypeScript Interface (Lines 5-12)**
```typescript
// DELETE THIS INTERFACE:
interface SlideshowEmbed {
	embedCode: string;
	title: string;
	location: string;
	createdAt: string;
	createdBy: string;
	createdByEmail?: string;
}
```

### **B. Update Props Interface (Lines 14-22)**
```typescript
// REMOVE slideshowEmbed from Props:
interface Props {
	slideshows: MemorialSlideshow[];
	memorialName: string;
	memorialId: string;
	editable?: boolean;
	currentUserId?: string;
	heroMode?: boolean;
	// slideshowEmbed?: SlideshowEmbed | null; ← DELETE THIS LINE
}
```

### **C. Update Props Destructuring (Line 24)**
```svelte
// REMOVE slideshowEmbed from destructuring:
let { slideshows, memorialName, memorialId, editable = false, currentUserId, heroMode = false }: Props = $props();
```

### **D. Simplify Template (Lines 37-70)**

**REPLACE entire section template with:**
```svelte
<section class="slideshow-section" class:hero-mode={heroMode}>
	{#if sortedSlideshows().length > 0}
		<div class="slideshows-container" class:hero-container={heroMode}>
			{#each sortedSlideshows() as slideshow (slideshow.id)}
				<SlideshowPlayer {slideshow} {editable} {currentUserId} />
			{/each}
		</div>
	{:else if editable && !heroMode}
		<!-- Empty state with create button for authorized users -->
		<div class="empty-slideshow-state">
			<div class="empty-content">
				<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
				<h3>No Slideshow Yet</h3>
				<p>Create a beautiful photo slideshow to commemorate {memorialName}</p>
				<a href="/slideshow-generator?memorialId={memorialId}" class="create-slideshow-btn">
					<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Create Slideshow
				</a>
			</div>
		</div>
	{/if}
	
	<!-- Create button for when slideshows exist (non-hero mode only) -->
	{#if editable && sortedSlideshows().length > 0 && !heroMode}
		<div class="add-slideshow-container">
			<a href="/slideshow-generator?memorialId={memorialId}" class="add-slideshow-btn">
				<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
				</svg>
				Add Another Slideshow
			</a>
		</div>
	{/if}
</section>
```

**Lines to DELETE:**
- Lines 38-46: Slideshow embed conditional rendering
- Lines 205-224: Slideshow embed CSS styles

---

## 🔧 Step 4: Update Memorial Page Server Load

**File:** `frontend/src/routes/[fullSlug]/+page.server.ts`

### **Remove slideshowEmbed from Memorial Object (Lines 82-108)**

```typescript
// DELETE THESE LINES from memorial object:
// Slideshow embed override
slideshowEmbed: memorialData.slideshowEmbed || null,
```

**Also remove debug logging (Lines 101-108):**
```typescript
// DELETE THIS DEBUG BLOCK:
// Debug slideshow embed
if (memorial.slideshowEmbed) {
	console.log('🎨 [MEMORIAL_PAGE] Slideshow Embed detected:', {
		title: memorial.slideshowEmbed.title,
		location: memorial.slideshowEmbed.location,
		embedCodeLength: memorial.slideshowEmbed.embedCode?.length
	});
}
```

**Update memorial logging (Lines 92-99):**
```typescript
// REMOVE hasSlideshowEmbed from logging:
console.log('🏠 [MEMORIAL_PAGE] Memorial found:', {
	id: memorial.id,
	lovedOneName: memorial.lovedOneName,
	fullSlug: memorial.fullSlug,
	isPublic: memorial.isPublic,
	hasEmergencyEmbed: !!memorial.emergencyEmbed
	// hasSlideshowEmbed: !!memorial.slideshowEmbed ← DELETE THIS LINE
});
```

---

## 🔧 Step 5: Update Memorial Page Client Side

**File:** `frontend/src/routes/[fullSlug]/+page.svelte`

### **A. Remove Debug Logging (Lines 52-65)**
```typescript
// SIMPLIFY onMount to remove slideshow embed logging:
onMount(() => {
	console.log('🎨 [MEMORIAL PAGE] Client-side data loaded:', {
		memorialId: memorial?.id,
		hasEmergencyEmbed: !!memorial?.emergencyEmbed
		// DELETE THESE LINES:
		// hasSlideshowEmbed: !!memorial?.slideshowEmbed,
		// slideshowEmbedLocation: memorial?.slideshowEmbed?.location,
		// slideshowEmbedTitle: memorial?.slideshowEmbed?.title
	});
	
	// DELETE THIS BLOCK:
	// if (memorial?.slideshowEmbed) {
	// 	console.log('🎨 [MEMORIAL PAGE] Slideshow embed will display in:', memorial.slideshowEmbed.location);
	// }
});
```

### **B. Update Legacy Layout Hero Slideshow (Lines 310-320)**

**REPLACE:**
```svelte
<div class="hero-slideshow">
	<SlideshowSection 
		{slideshows} 
		memorialName={memorial.lovedOneName || 'Unknown'}
		memorialId={memorial.id}
		editable={canEditSlideshows()}
		currentUserId={user?.uid}
		heroMode={true}
	/>
</div>
```

**DELETE this line:**
```svelte
slideshowEmbed={memorial.slideshowEmbed?.location === 'header' ? memorial.slideshowEmbed : null}
```

### **C. Remove Legacy Layout Body Slideshow Conditional (Lines 333-346)**

**REPLACE the entire conditional block with:**
```svelte
<!-- Body Slideshow Section - Always show -->
<div class="body-slideshow-section">
	<SlideshowSection 
		{slideshows} 
		memorialName={memorial.lovedOneName || 'Unknown'}
		memorialId={memorial.id}
		editable={canEditSlideshows()}
		currentUserId={user?.uid}
		heroMode={false}
	/>
</div>
```

**DELETE:**
```svelte
{#if memorial.slideshowEmbed?.location === 'body'}
	<!-- ... -->
{/if}
slideshowEmbed={memorial.slideshowEmbed}
```

### **D. Update Standard Layout Hero Slideshow (Lines 420-431)**

**REPLACE:**
```svelte
<div class="hero-slideshow">
	<SlideshowSection 
		{slideshows} 
		memorialName={memorial.lovedOneName || 'Unknown'}
		memorialId={memorial.id}
		editable={canEditSlideshows()}
		currentUserId={user?.uid}
		heroMode={true}
	/>
</div>
```

**DELETE this line:**
```svelte
slideshowEmbed={memorial.slideshowEmbed?.location === 'header' ? memorial.slideshowEmbed : null}
```

### **E. Remove Standard Layout Body Slideshow Conditional (Lines 465-478)**

**REPLACE the entire conditional block with:**
```svelte
<!-- Body Slideshow Section - Always show -->
<div class="body-slideshow-section">
	<SlideshowSection 
		{slideshows} 
		memorialName={memorial.lovedOneName || 'Unknown'}
		memorialId={memorial.id}
		editable={canEditSlideshows()}
		currentUserId={user?.uid}
		heroMode={false}
	/>
</div>
```

**DELETE:**
```svelte
{#if memorial.slideshowEmbed?.location === 'body'}
	<!-- ... -->
{/if}
slideshowEmbed={memorial.slideshowEmbed}
```

---

## 🔧 Step 6: Update Admin Memorial Page Server Load

**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

### **Remove slideshowEmbed from Return Data**

Find where the memorial data is loaded and returned, and **remove any references to `slideshowEmbed`**.

Typically around the load function return statement:
```typescript
return {
	memorial: {
		// ... other fields
		// slideshowEmbed: memorialData.slideshowEmbed || null, ← DELETE THIS
	},
	streams,
	slideshows,
	followerCount
};
```

---

## 🗄️ Step 7: Database Cleanup (Optional)

### **Firestore Field Removal**

If you want to clean up existing data, run a migration script or manually remove `slideshowEmbed` field from memorial documents in Firestore console.

**Manual Cleanup:**
1. Open Firebase Console
2. Navigate to Firestore Database
3. Find memorials collection
4. For each memorial with `slideshowEmbed` field:
   - Click the document
   - Delete the `slideshowEmbed` field
   - Save

**Automated Cleanup Script (Optional):**
```javascript
// scripts/cleanup-slideshow-embeds.js
import { adminDb } from '../lib/server/firebase';

async function cleanupSlideshowEmbeds() {
	const memorialsRef = adminDb.collection('memorials');
	const snapshot = await memorialsRef.where('slideshowEmbed', '!=', null).get();
	
	console.log(`Found ${snapshot.docs.length} memorials with slideshowEmbed field`);
	
	const batch = adminDb.batch();
	snapshot.docs.forEach(doc => {
		batch.update(doc.ref, {
			slideshowEmbed: adminDb.FieldValue.delete()
		});
	});
	
	await batch.commit();
	console.log('✅ Cleaned up all slideshowEmbed fields');
}

cleanupSlideshowEmbeds().catch(console.error);
```

---

## ✅ Testing Checklist

After making all changes, verify:

### **Admin Dashboard**
- [ ] Memorial detail page loads without errors
- [ ] Slideshows section shows only normal slideshows
- [ ] No "Create Slideshow Embed" button visible
- [ ] No modal/form for slideshow embeds

### **Memorial Pages**
- [ ] Legacy layout memorial pages load correctly
- [ ] Standard layout memorial pages load correctly
- [ ] Hero slideshow section displays normal slideshows
- [ ] Body slideshow section displays normal slideshows
- [ ] No embed overrides appear

### **API Endpoints**
- [ ] Slideshow embed endpoints return 404 (deleted)
- [ ] Normal slideshow endpoints still work

### **Console Errors**
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console
- [ ] No 404 errors for deleted endpoint

---

## 📊 Summary

### **Lines of Code Removed**
- API Endpoint: ~85 lines
- Admin UI: ~150 lines
- SlideshowSection: ~40 lines
- Memorial Page Server: ~25 lines
- Memorial Page Client: ~30 lines

**Total: ~330 lines of code removed**

### **Files Modified**
- 5 files modified
- 1 file deleted

### **Functionality Removed**
- ❌ Emergency slideshow embed creation
- ❌ Slideshow embed override system
- ❌ Location-based (header/body) embed placement
- ❌ Admin UI for managing embeds
- ✅ **Keeps:** Normal PhotoSlideshowCreator slideshows
- ✅ **Keeps:** All existing slideshow functionality

---

## 🚀 Deployment Notes

1. **Test locally first** before deploying to production
2. **Backup Firestore data** before running cleanup script
3. **Deploy in order:**
   - Backend API changes first
   - Frontend component changes second
   - Database cleanup last (optional)
4. **Monitor for errors** after deployment
5. **Communicate to users** that embed feature is removed

---

## 🔄 Rollback Plan

If issues arise:
1. Revert Git commit
2. Redeploy previous version
3. Restore `slideshowEmbed` field in Firestore (if cleaned up)

Keep backup of deleted `slideshow-embed/+server.ts` file for reference.
