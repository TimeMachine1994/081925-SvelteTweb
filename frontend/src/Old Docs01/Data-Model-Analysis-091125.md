# Data Model Analysis - V1 Refactor (As of 2025-09-11)

This document provides a comprehensive review of the Firestore data models as implemented in the V1 refactored codebase. The V1 version simplifies the role system to only support `admin`, `owner`, and `funeral_director` roles, removing `family_member` and `viewer` roles for a cleaner, more maintainable system.

## 1. Users Collection (`users`)

**Intended Schema (`admin.ts -> UserManagementData`):**
```typescript
{
    uid: string;
    email: string;
    displayName?: string;
    role: 'admin' | 'owner' | 'funeral_director';
    isAdmin: boolean;
    suspended: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
}
```

**Implementation Analysis:**
- The `users` collection is primarily written to in `/register/funeral-director/+page.server.ts` when a funeral director registers a new family contact.
- In this file, the following object is created:
  ```typescript
  const userProfile = {
      email: familyContactEmail,
      displayName: familyContactName,
      phone: familyContactPhone, // Field is NOT in the type definition
      role: 'owner',
      createdAt: new Date(),
      createdByFuneralDirector: directorUid // Field is NOT in the type definition
  };
  ```

**V1 Status:**
✅ **Resolved:** Role system simplified to three roles only: `admin`, `owner`, `funeral_director`

**Remaining Inconsistencies:**
1.  **Missing Fields in Type:** The `UserManagementData` type is missing `phone` and `createdByFuneralDirector`, which are being actively written to the database.
2.  **Ambiguous User Model:** The application lacks a single, authoritative `User` or `UserProfile` type. `UserManagementData` seems specific to the admin panel, but it's the closest thing to a global user model.

---

## 2. Memorials Collection (`memorials`)

**Intended Schema (`memorial.ts -> Memorial`):**
```typescript
{
    id: string;
    lovedOneName: string;
    slug: string;
    createdByUserId: string;
    ownerUid?: string;
    funeralDirectorUid?: string;
    // ... and many other fields
}
```

**Implementation Analysis:**
- Memorials are created in several places, most notably `/register/funeral-director/+page.server.ts` and `/register/loved-one/+page.server.ts`.
- As identified previously, the creation logic in `/register/funeral-director/+page.server.ts` was writing both `ownerUid` and `createdByUserId` with different values, creating a direct conflict. (This was recently fixed).
- The type definition itself contains comments like `// Adding optional fields that might be missing` and `// Missing properties used in ViewerPortal`, which is a strong indicator that the type is out of sync with the implementation.

**V1 Status:**
✅ **Resolved:** Removed `familyMemberUids` field from Memorial type
✅ **Resolved:** Removed redundant `createdByUserId` field from memorial creation logic

**Remaining Inconsistencies:**
1.  **In-Type Patching**: The `Memorial` type has been patched with comments to account for fields used elsewhere in the code but not formally added to the schema. This indicates a breakdown in maintaining a single source of truth for the data model.

---

## 3. Funeral Directors Collection (`funeral_directors`)

**V1 Simplified Schema (`funeral-director.ts -> FuneralDirector`):**
```typescript
{
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'approved' | 'suspended' | 'inactive'; // V1: auto-approved
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**V1 Status:**
✅ **Resolved:** Removed license number requirements - not needed for V1
✅ **Resolved:** Simplified status to auto-approved registration
✅ **Resolved:** Removed complex permissions and streaming configuration
✅ **Resolved:** Removed application approval workflow - funeral directors are auto-approved

**Implementation Analysis:**
- V1 funeral directors register directly and are immediately approved
- No license verification or admin approval process required
- Simplified address structure without country field

---

## 4. Livestream / Booking Configuration (Collection Name Unclear)

**Intended Schema (Multiple Conflicting Types in `livestream.ts`):**
- `LivestreamConfig`: Includes `formData`, `bookingItems`, `total`, `userId`, `memorialId`, `status`, and payment information.
- `CalculatorConfig`: A very similar structure, also containing `formData`, `bookingItems`, and `total`, but with a different `status` field and an `autoSave` object.

**Implementation Analysis:**
- The file `/frontend/src/routes/app/calculator/+page.server.ts` writes to a `livestream_configs` collection.
- The data being saved in the `saveConfiguration` action appears to match the `CalculatorConfig` interface, including the `autoSave` object.

**Inconsistencies Found:**
1.  **Duplicate, Conflicting Models**: The existence of both `LivestreamConfig` and `CalculatorConfig` for what is essentially the same data is a major inconsistency. They have different fields and status types, which will lead to bugs and make the code difficult to maintain.
2.  **Unclear Source of Truth**: It is not clear which of these two models should be considered the authoritative source of truth for a livestream booking.

## V1 Refactor Summary

The V1 refactor has successfully addressed several major data model inconsistencies:

### ✅ **Resolved Issues:**
- **Role System Simplified**: Removed `family_member` and `viewer` roles, keeping only `admin`, `owner`, and `funeral_director`
- **Memorial Access Control**: Removed `familyMemberUids` field and redundant `createdByUserId` logic
- **Funeral Director Workflow**: Simplified to auto-approved registration without license requirements
- **Admin Dashboard**: Removed complex application approval system

### 🔄 **Remaining Issues to Address:**
- **User Model Ambiguity**: Still lacks a single, authoritative `User` type (missing `phone` and `createdByFuneralDirector` fields)
- **Memorial Type Patching**: In-type comments indicate ongoing schema drift
- **Livestream Model Conflicts**: Two conflicting models (`LivestreamConfig` vs `CalculatorConfig`) still exist

### 📈 **V1 Benefits:**
- **Reduced Complexity**: Fewer roles mean simpler access control logic
- **Faster Onboarding**: Auto-approved funeral directors can start immediately
- **Cleaner Codebase**: Removed unused invitation and approval systems
- **Better Maintainability**: Fewer edge cases and role combinations to handle

The V1 refactor significantly improves the application's maintainability while maintaining core functionality for the three essential user types.
