# Location and Service Details Refactor Plan
**Date**: September 18, 2025  
**Purpose**: Consolidate service details into Event collection and eliminate data duplication

## Problem Statement

Currently, service details (locations, times, duration) are duplicated across two collections:

1. **Event Collection**: Basic service fields (`memorialDate`, `memorialTime`, `memorialLocationName`, etc.)
2. **LivestreamConfig Collection**: Detailed service structures (`ServiceDetails`, `AdditionalServiceDetails`, `LocationInfo`, `TimeInfo`)

This creates data inconsistency and maintenance overhead.

## Solution Overview

**Move service detail interfaces and data to Event collection as the single source of truth, while keeping calculator-specific functionality (packages, addons, pricing) in LivestreamConfig.**

### Data Flow Design
- **Funeral Director Registration**: Collects initial service location → writes to `Event.services.main`
- **Calculator Page**: Reads existing service data → allows adding/removing additional locations → writes back to Event
- **LivestreamConfig**: References Event via `memorialId` + manages booking-specific data only

## Data Model Changes

### Event Collection Updates

#### Before (Current)
```typescript
interface Event {
  // Scattered service fields
  memorialDate?: string;
  memorialTime?: string;
  serviceDate?: string;
  serviceTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  location?: string;
  duration?: number;
  // ... other fields
}
```

#### After (Refactored)
```typescript
interface Event {
  // Consolidated service structure
  services: {
    main: ServiceDetails;         // Primary service details
    additional: AdditionalServiceDetails[]; // Additional locations/days
  };
  // ... other fields (unchanged)
}

// Service Detail Interfaces (moved from LivestreamConfig)
interface ServiceDetails {
  location: LocationInfo;         // Service location
  time: TimeInfo;                 // Service time
  hours: number;                  // Duration in hours
}

interface AdditionalServiceDetails {
  enabled: boolean;               // Whether service is enabled
  location: LocationInfo;         // Service location
  time: TimeInfo;                 // Service time
  hours: number;                  // Duration in hours
}

interface LocationInfo {
  name: string;                   // Location name
  address: string;                // Location address
  isUnknown: boolean;             // Unknown location flag
}

interface TimeInfo {
  date: string | null;            // Service date
  time: string | null;            // Service time
  isUnknown: boolean;             // Unknown time flag
}
```

### LivestreamConfig Collection Updates

#### Before (Current)
```typescript
interface CalculatorFormData {
  memorialId?: string;
  lovedOneName: string;           // Duplicated from Event
  selectedTier: 'record' | 'live' | 'legacy' | null;
  mainService: ServiceDetails;    // Duplicated service data
  additionalLocation: AdditionalServiceDetails; // Duplicated
  additionalDay: AdditionalServiceDetails;      // Duplicated
  funeralDirectorName: string;    // Duplicated contact info
  funeralHome: string;            // Duplicated contact info
  addons: Addons;
  // ... metadata
}
```

#### After (Refactored)
```typescript
interface CalculatorFormData {
  // Event Reference (service details now stored in Event)
  memorialId: string;             // Required - references Event for service data
  
  // Calculator-Specific Configuration Only
  selectedTier: 'record' | 'live' | 'legacy' | null; // Service tier
  addons: Addons;                 // Selected add-on services
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  autoSaved?: boolean;
}
```

## Implementation Plan

### Phase 1: Data Model Updates
**Estimated Time**: 2-3 days

#### 1.1 Update TypeScript Interfaces
- [ ] Move service interfaces from `livestream.ts` to `event.ts`
- [ ] Update Event interface to include `services` structure
- [ ] Simplify CalculatorFormData interface
- [ ] Update all imports across codebase

#### 1.2 Update Database Schema Documentation
- [x] Update `02-data-model-schema.md` with new structure
- [x] Document data flow and authority relationships

### Phase 2: API Endpoint Updates
**Estimated Time**: 3-4 days

#### 2.1 Event Creation Endpoints
- [ ] Update `/api/funeral-director/create-event` to write to `Event.services.main`
- [ ] Update `/register/new-event-and-account` to create basic service structure
- [ ] Update `/register/funeral-director` to populate initial service details

#### 2.2 Calculator API Endpoints
- [ ] Update `/api/memorials/[memorialId]/schedule` to read from Event.services
- [ ] Update `/api/memorials/[memorialId]/schedule/auto-save` to write to Event.services
- [ ] Modify calculator APIs to reference Event for service data

#### 2.3 Event Management APIs
- [ ] Update event retrieval endpoints to include services structure
- [ ] Update event update endpoints to handle services changes

### Phase 3: Frontend Component Updates
**Estimated Time**: 4-5 days

#### 3.1 Calculator Components
- [ ] Update `Calculator.svelte` to load service data from Event
- [ ] Modify `BookingForm.svelte` to read/write Event.services
- [ ] Update service addition/removal logic for `Event.services.additional[]`
- [ ] Ensure auto-save writes to correct collections

#### 3.2 Registration Components
- [ ] Update funeral director registration to create `Event.services.main`
- [ ] Modify family registration to initialize basic service structure

#### 3.3 Event Display Components
- [ ] Update event viewing components to read from new services structure
- [ ] Modify admin and portal components to display consolidated service data

### Phase 4: Data Migration
**Estimated Time**: 2-3 days

#### 4.1 Migration Script Development
- [ ] Create migration script to transform existing Event documents
- [ ] Map old service fields to new `services.main` structure
- [ ] Handle existing LivestreamConfig data consolidation

#### 4.2 Migration Execution
- [ ] Test migration on development data
- [ ] Execute migration on staging environment
- [ ] Validate data integrity post-migration
- [ ] Execute production migration

#### 4.3 Cleanup
- [ ] Remove deprecated fields from Event interface
- [ ] Clean up unused service interfaces in LivestreamConfig
- [ ] Update database indexes if needed

### Phase 5: Testing & Validation
**Estimated Time**: 2-3 days

#### 5.1 Unit Tests
- [ ] Update event creation tests
- [ ] Update calculator component tests
- [ ] Update API endpoint tests
- [ ] Test service addition/removal functionality

#### 5.2 Integration Tests
- [ ] Test full funeral director → calculator workflow
- [ ] Test service data persistence across sessions
- [ ] Test auto-save functionality with new structure

#### 5.3 End-to-End Tests
- [ ] Test complete event creation flow
- [ ] Test calculator service management
- [ ] Test data consistency across collections

## Benefits

### Immediate Benefits
- **Eliminates Data Duplication**: Single source of truth for service details
- **Improves Data Consistency**: No more sync issues between collections
- **Simplifies Calculator Logic**: Calculator reads from Event, writes to both appropriately
- **Cleaner API Design**: Clear separation of concerns between collections

### Long-term Benefits
- **Easier Maintenance**: Changes to service structure only need updates in one place
- **Better Performance**: Fewer database queries needed for service information
- **Scalability**: Cleaner data model supports future enhancements
- **Developer Experience**: More intuitive data relationships

## Risk Mitigation

### Data Migration Risks
- **Backup Strategy**: Full database backup before migration
- **Rollback Plan**: Script to revert changes if issues arise
- **Staged Rollout**: Test on development → staging → production

### Code Integration Risks
- **Feature Flags**: Use feature flags to toggle between old/new implementations
- **Gradual Migration**: Update components incrementally
- **Comprehensive Testing**: Extensive test coverage before deployment

## Success Criteria

- [ ] All service details stored in Event collection only
- [ ] Calculator successfully reads/writes service data to Event
- [ ] LivestreamConfig contains only booking-specific data
- [ ] No data duplication between collections
- [ ] All existing functionality preserved
- [ ] Performance maintained or improved
- [ ] All tests passing

## Timeline

**Total Estimated Time**: 13-18 days

- **Week 1**: Phases 1-2 (Data model + API updates)
- **Week 2**: Phase 3 (Frontend components)
- **Week 3**: Phases 4-5 (Migration + Testing)

## Dependencies

- Access to production database for migration
- Coordination with any ongoing development work
- Testing environment availability
- Stakeholder approval for data model changes

---

**Next Steps**: 
1. Review and approve this refactor plan
2. Create detailed tickets for each phase
3. Begin Phase 1 implementation
4. Set up feature flags for gradual rollout
