# Fixes To Make

## ✅ FIXED: Funeral Director Event Tracking (Oct 29, 2025)

### Problem
Memorials created by funeral directors through `/register/funeral-director` were not appearing in their "Managed Memorials" list on the profile page.

### Root Cause
The registration form was missing critical tracking fields:
- `funeralDirectorUid` - Used by profile page queries
- `funeralDirector` object - Used by API endpoint queries

This caused a disconnect where memorials were created but not linked to the funeral director who created them.

### Solution Applied

#### 1. Updated Registration Form (`/register/funeral-director/+page.server.ts`)
- Added `locals` parameter to action function
- Added query to fetch funeral director profile before event creation
- Added `funeralDirectorUid: locals.user?.uid || null` to event data
- Added `funeralDirector` object with full director details:
  ```typescript
  funeralDirector: locals.user ? {
    id: locals.user.uid,
    companyName: funeralDirectorProfile?.companyName || funeralHomeName,
    contactPerson: funeralDirectorProfile?.contactPerson || directorName,
    phone: funeralDirectorProfile?.phone || '',
    email: funeralDirectorProfile?.email || directorEmail || ''
  } : null
  ```

#### 2. Updated Event Type (`event.ts`)
- Added `funeralDirector` object to Event interface for TypeScript support

#### 3. Enhanced Profile Page Query (`/profile/+page.server.ts`)
- Made query robust by checking BOTH fields:
  - Query 1: `where('funeralDirectorUid', '==', uid)` (old format)
  - Query 2: `where('funeralDirector.id', '==', uid)` (new format)
- Deduplicate results using Map to avoid showing same event twice
- Ensures backward compatibility with existing memorials

### Impact
- ✅ Funeral directors can now see all memorials they create
- ✅ "Managed Memorials" section on profile page works correctly
- ✅ Funeral directors can edit and manage their memorials
- ✅ Backward compatible with existing memorials in database

### Testing Needed
1. Create new event via `/register/funeral-director` as funeral director
2. Verify event appears in profile page "Managed Memorials" section
3. Verify "Schedule" and "Manage Streams" buttons work
4. Test with existing funeral director account that has old memorials

---

---

## ✅ FIXED: Complete Payment Button Link (Oct 29, 2025)

### Problem
The "Complete Payment" button on the profile page had no link - it didn't take users anywhere when clicked.

### Solution
Added link to the schedule/calculator page for the user's event:
```svelte
<a href="/schedule/{data.memorials?.[0]?.id}" class="inline-block">
  <Button>Complete Payment</Button>
</a>
```

Since owners should only have one event, we use `data.memorials?.[0]?.id` to get their first event's ID and link to `/schedule/[id]`.

**File Modified:** `lib/components/Profile.svelte` (line 399)

---

## 🔧 TO DO

1. ~~Make Complete Payment button takes you to to the calculator page.~~ ✅ DONE
2. Fix "If you have any questions, please don't hesitate to contact our support team at support@tributestream.com or (555) 123-4567." in our Service Confirmtion Details Message