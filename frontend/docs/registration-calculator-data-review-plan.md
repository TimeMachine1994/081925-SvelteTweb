# Registration & Calculator Data Consistency Review Plan

## Executive Summary
This document analyzes the data flow between memorial registration (via `/my-portal/tributes/new`) and the calculator booking system (`/app/calculator`) to ensure data consistency and enable pre-population of forms with existing memorial data.

## 1. Current State Analysis

### 1.1 Memorial Registration Data Flow

#### Routes & Endpoints
- **Frontend Route**: `/my-portal/tributes/new`
- **Backend Processing**: `+page.server.ts` actions
- **Database**: Firestore `memorials` collection

#### Data Created During Registration
```typescript
// From +page.server.ts (lines 38-54)
const memorialData = {
    lovedOneName: string,           // Required, user input
    slug: string,                    // Auto-generated
    fullSlug: string,                // Auto-generated
    createdByUserId: string,         // From auth
    creatorEmail: string,            // From auth
    familyContactEmail: string,      // Set to creator's email
    createdAt: Timestamp,
    updatedAt: Timestamp,
    creatorUid: string,              // Legacy field
    creatorName: string,             // From auth or empty
    isPublic: boolean,               // Default: true
    content: string,                 // Default: empty
    custom_html: null                // Default: null
}
```

### 1.2 Calculator Booking Data Flow

#### Routes & Endpoints
- **Frontend Route**: `/app/calculator`
- **API Endpoints**: 
  - `POST /api/bookings` - Create new booking
  - `PUT /api/bookings/{bookingId}` - Update booking
- **Database**: Firestore `bookings` collection

#### FormState Schema (Calculator)
```typescript
// From frontend/src/lib/types/index.ts
interface FormState {
    lovedOneName: string,
    memorialDate: string,
    memorialTime: string,
    locationName: string,
    locationAddress: string,
    website: string
}
```

### 1.3 Memorial TypeScript Interface
```typescript
// From frontend/src/lib/types/memorial.ts (selected fields)
interface Memorial {
    id: string,
    lovedOneName: string,
    memorialDate?: string,
    memorialTime?: string,
    memorialLocationName?: string,
    memorialLocationAddress?: string,
    // Note: No 'website' field in Memorial interface
    // But has these related fields:
    familyContactEmail?: string,
    familyContactPhone?: string,
    livestreamConfig?: any
}
```

## 2. Data Mapping & Overlaps

### 2.1 Common Fields Between Systems

| Field | Memorial Registration | Calculator FormState | Memorial Interface | Status |
|-------|----------------------|---------------------|-------------------|---------|
| `lovedOneName` | ✅ Created | ✅ Used | ✅ Stored | **Aligned** |
| `memorialDate` | ❌ Not captured | ✅ Used | ✅ Optional field exists | **Gap** |
| `memorialTime` | ❌ Not captured | ✅ Used | ✅ Optional field exists | **Gap** |
| `locationName` | ❌ Not captured | ✅ Used | ✅ `memorialLocationName` | **Naming mismatch** |
| `locationAddress` | ❌ Not captured | ✅ Used | ✅ `memorialLocationAddress` | **Naming mismatch** |
| `website` | ❌ Not captured | ✅ Used | ❌ Not in interface | **Missing field** |

### 2.2 Current Data Flow Issues

1. **Incomplete Initial Data**: Memorial registration only captures `lovedOneName`, missing other critical details
2. **Field Naming Inconsistency**: 
   - Calculator uses `locationName` / `locationAddress`
   - Memorial interface uses `memorialLocationName` / `memorialLocationAddress`
3. **Missing Fields**: `website` field exists in calculator but not in Memorial interface
4. **No Pre-population Logic**: Calculator's `onMemorialSelect` function attempts to populate form but fields don't align

## 3. Identified Gaps & Inconsistencies

### 3.1 Critical Issues

1. **Data Loss Risk**: Memorial details entered in calculator aren't persisted back to the memorial record
2. **Duplicate Data Entry**: Users must re-enter memorial details even if they've created a memorial
3. **Schema Mismatch**: FormState and Memorial interfaces don't align properly
4. **Incomplete CRUD**: No API endpoint to update memorial with calculator data

### 3.2 Code Analysis - Calculator's onMemorialSelect Function

```typescript
// From frontend/src/routes/app/calculator/+page.svelte (lines 105-116)
async function onMemorialSelect(memorialId: string) {
    const selectedMemorial = data.memorials?.find((m: Memorial) => m.id === memorialId);
    if (selectedMemorial) {
        form.lovedOneName = selectedMemorial.lovedOneName || '';
        // Attempting to use fields that may not exist or have different names:
        form.memorialDate = selectedMemorial.memorialDate ? new Date(selectedMemorial.memorialDate).toISOString().split('T')[0] : '';
        form.memorialTime = selectedMemorial.memorialTime || '';
        form.locationName = selectedMemorial.locationName || '';  // Wrong field name!
        form.locationAddress = selectedMemorial.locationAddress || '';  // Wrong field name!
        form.website = selectedMemorial.website || '';  // Field doesn't exist!
    }
}
```

## 4. Proposed Solutions

### 4.1 Short-term Fixes (Immediate)

1. **Fix Field Mapping in Calculator**
```typescript
// Update onMemorialSelect to use correct field names
form.locationName = selectedMemorial.memorialLocationName || '';
form.locationAddress = selectedMemorial.memorialLocationAddress || '';
form.website = selectedMemorial.livestreamConfig?.website || '';  // Or add website field
```

2. **Add Missing Fields to Memorial Interface**
```typescript
interface Memorial {
    // ... existing fields ...
    website?: string;  // Add this field
    // Consider renaming for consistency:
    locationName?: string;  // Alias for memorialLocationName
    locationAddress?: string;  // Alias for memorialLocationAddress
}
```

### 4.2 Medium-term Improvements

 

2. **Create Bidirectional Sync**
   - When calculator saves booking, also update memorial record
   - Add API endpoint: `PUT /api/memorials/{memorialId}/details`
 
### 4.3 Long-term Architecture

1. **Unified Data Model**
```typescript
interface UnifiedMemorialData {
    // Core identification
    id: string;
    lovedOneName: string;
    
    // Event details (shared between memorial and booking)
    eventDate?: string;
    eventTime?: string;
    eventLocation?: {
        name: string;
        address: string;
    };
    
    // Online presence
    tributePageUrl?: string;
    livestreamUrl?: string;
    
    // Booking specific
    bookingId?: string;
    packageType?: PackageKey;
    
    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

2. **Single Source of Truth**
   - Memorial record should be the primary source
   - Bookings should reference and extend memorial data
   - Implement proper foreign key relationships

## 5. Implementation Plan

### Phase 1: Immediate Fixes (1-2 days)
- [ ] Fix field mapping in calculator's `onMemorialSelect`
- [ ] Add `website` field to Memorial interface
- [ ] Update calculator to correctly read memorial fields

### Phase 2: Data Consistency (3-5 days)
- [ ] Create API endpoint to update memorial from calculator
- [ ] Modify `handleSave` in calculator to sync with memorial
- [ ] Add validation to ensure data consistency

### Phase 3: Enhanced Registration (1 week)
- [ ] Expand memorial creation form with optional fields
- [ ] Create memorial selection/creation flow in calculator
- [ ] Implement proper data pre-population

### Phase 4: Testing & Migration (3-5 days)
- [ ] Write unit tests for data mapping
- [ ] Create integration tests for full flow
- [ ] Develop and run data migration scripts
- [ ] Test with existing user data

## 6. Testing Strategy

### 6.1 Unit Tests
- Test field mapping functions
- Validate data transformation logic
- Ensure type safety

### 6.2 Integration Tests
1. **New User Flow**
   - Create memorial → Navigate to calculator → Verify pre-population
   - Complete booking → Verify memorial update

2. **Existing User Flow**
   - Load existing memorial → Verify all fields populate
   - Update via calculator → Verify persistence

3. **Edge Cases**
   - Missing fields
   - Invalid data formats
   - Concurrent updates

### 6.3 User Acceptance Testing
- Test with real user scenarios
- Verify no data loss
- Ensure backward compatibility

## 7. Success Metrics

- **Zero Data Re-entry**: Users shouldn't enter the same information twice
- **100% Field Mapping**: All calculator fields should map to memorial fields
- **Data Integrity**: No data loss during transitions
- **Performance**: Pre-population should be instant (<100ms)

## 8. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup all data, test in staging first |
| Breaking existing bookings | High | Maintain backward compatibility |
| Performance degradation | Medium | Optimize queries, add indexes |
| User confusion | Medium | Clear UI indicators, help text |

## 9. Conclusion

The current implementation has significant gaps in data consistency between memorial registration and the calculator booking system. The primary issues are:

1. Incomplete data capture during memorial creation
2. Field naming inconsistencies
3. Missing bidirectional data sync
4. No proper pre-population mechanism

By implementing the proposed solutions in phases, we can achieve:
- Seamless data flow between registration and calculator
- Reduced user friction
- Improved data integrity
- Better user experience

The immediate priority should be fixing the field mapping issues and adding the missing `website` field to prevent data loss and improve the current user experience.