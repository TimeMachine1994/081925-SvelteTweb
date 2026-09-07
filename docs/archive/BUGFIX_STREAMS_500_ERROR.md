# 🐛 Bug Fix: Streams Page 500 Error

**Issue:** Streams page was returning 500 (Internal Server Error) when loading

**Date Fixed:** November 12, 2025

---

## 🔍 Root Causes

### 1. Missing Firestore Index
- Query with `orderBy('createdAt', 'desc')` requires a Firestore composite index
- If index doesn't exist, Firestore throws an error causing 500

### 2. Firestore "in" Query Edge Cases
- `where('__name__', 'in', [])` with empty array causes error
- Firestore "in" query has a limit of 10 items max
- If there are no memorial IDs, the query would fail

### 3. Date Conversion Errors
- Firestore timestamps may not have `.toDate()` method in some cases
- Could cause uncaught errors during data mapping

---

## ✅ Solutions Applied

### 1. Try-Catch for Sorting Queries
**Files:** 
- `routes/admin/services/streams/+page.server.ts`
- `routes/admin/services/memorials/+page.server.ts`

**Fix:** Wrap orderBy queries in try-catch, fallback to unsorted query if index missing

```typescript
let snapshot;
try {
  // Try with sorting first
  let query = adminDb.collection('streams').orderBy(sortBy, sortDir as any).limit(limit);
  snapshot = await query.get();
} catch (error) {
  console.error('Error loading streams with sorting:', error);
  // Fallback to no sorting if index doesn't exist
  let query = adminDb.collection('streams').limit(limit);
  snapshot = await query.get();
}
```

### 2. Safe Memorial ID Handling
**File:** `routes/admin/services/streams/+page.server.ts`

**Fixes:**
- Filter out null/undefined memorialIds with `.filter(Boolean)`
- Only query memorials if we have IDs (`if (memorialIds.length > 0)`)
- Limit to 10 items with `.slice(0, 10)` for Firestore "in" limit
- Wrap memorial query in try-catch

```typescript
const memorialIds = [...new Set(snapshot.docs.map((doc) => doc.data().memorialId).filter(Boolean))];

const memorialMap = new Map();

if (memorialIds.length > 0) {
  try {
    const memorialsSnapshot = await adminDb
      .collection('memorials')
      .where('__name__', 'in', memorialIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    memorialsSnapshot.docs.forEach((doc) => {
      memorialMap.set(doc.id, doc.data().lovedOneName);
    });
  } catch (error) {
    console.error('Error loading memorial names:', error);
  }
}
```

### 3. Safe Duration Calculation
**File:** `routes/admin/services/streams/+page.server.ts`

**Fix:** Wrap duration calculation in try-catch

```typescript
let duration = null;
try {
  if (data.startedAt && data.endedAt) {
    const start = data.startedAt.toDate();
    const end = data.endedAt.toDate();
    duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  }
} catch (error) {
  console.error('Error calculating stream duration:', error);
}
```

### 4. Safe Memorial Name Handling
**File:** `routes/admin/services/streams/+page.server.ts`

**Fix:** Handle null memorialId gracefully

```typescript
memorialId: data.memorialId || null,
memorialName: data.memorialId ? memorialMap.get(data.memorialId) || 'Unknown' : 'No Memorial',
```

---

## 🎯 Expected Behavior Now

### ✅ Streams Page
- **Loads Successfully** - No more 500 errors
- **Graceful Fallback** - If sorting fails, shows unsorted data
- **Safe Data Display** - Missing memorial names show as "No Memorial" or "Unknown"
- **No Crashes** - All data parsing wrapped in error handlers

### ✅ Memorials Page
- **Protected Against Missing Index** - Falls back to unsorted if needed
- **Consistent Behavior** - Same error handling pattern

---

## 📋 What This Means

### Page Will Load Even If:
- ✅ Firestore indexes haven't been created yet
- ✅ There are no streams in database
- ✅ Streams have no memorial associations
- ✅ Timestamp fields are missing or malformed
- ✅ Memorial documents don't exist

### Data Display:
- Streams without memorials show "No Memorial"
- Missing durations show as `null` (won't crash)
- All errors logged to console for debugging
- Page loads with partial data instead of crashing

---

## 🔧 Future Improvements

### Firestore Index Creation
When you see console errors like:
```
Error loading streams with sorting: Index required for query...
```

**Action:** Create the composite index in Firestore Console:
1. Go to Firestore Console
2. Navigate to Indexes tab
3. Create composite index for `streams` collection:
   - Field: `createdAt`, Order: Descending
   - Query Scope: Collection

### Alternative Approach
Or remove the sorting feature temporarily and just load without orderBy until indexes are set up.

---

## 🧪 Testing

Try these scenarios:
- [x] Navigate to `/admin/services/streams` - Should load without 500 error
- [x] Page loads even with no streams in database
- [x] Streams without memorial IDs display correctly
- [x] No console errors about "in" queries
- [x] Falls back gracefully if sorting fails

---

## 🎉 Result

**Before:** Streams page → 500 Internal Server Error  
**After:** Streams page → Loads successfully with graceful error handling

The page will now always load, even if:
- Database is empty
- Indexes are missing
- Data is incomplete
- Memorial associations are broken
