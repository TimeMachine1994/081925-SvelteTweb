# Fixes To Make

## ✅ FIXED: Funeral Director Memorial Tracking (Oct 29, 2025)

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
- Added query to fetch funeral director profile before memorial creation
- Added `funeralDirectorUid: locals.user?.uid || null` to memorial data
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

#### 2. Updated Memorial Type (`memorial.ts`)
- Added `funeralDirector` object to Memorial interface for TypeScript support

#### 3. Enhanced Profile Page Query (`/profile/+page.server.ts`)
- Made query robust by checking BOTH fields:
  - Query 1: `where('funeralDirectorUid', '==', uid)` (old format)
  - Query 2: `where('funeralDirector.id', '==', uid)` (new format)
- Deduplicate results using Map to avoid showing same memorial twice
- Ensures backward compatibility with existing memorials

### Impact
- ✅ Funeral directors can now see all memorials they create
- ✅ "Managed Memorials" section on profile page works correctly
- ✅ Funeral directors can edit and manage their memorials
- ✅ Backward compatible with existing memorials in database

### Testing Needed
1. Create new memorial via `/register/funeral-director` as funeral director
2. Verify memorial appears in profile page "Managed Memorials" section
3. Verify "Schedule" and "Manage Streams" buttons work
4. Test with existing funeral director account that has old memorials

---

## 🔧 TO DO

1. Make Complete Payment button takes you to to the calculator page. 
2. Fix "If you have any questions, please don't hesitate to contact our support team at support@tributestream.com or (555) 123-4567." in our Service Confirmtion Details Message