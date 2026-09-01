# Calculator-Stream Integration Implementation Plan

## Problem Statement

Currently, regular memorial owners can only schedule services through the service calculator, while stream creation is restricted to funeral directors and admins. The calculator saves scheduling data but doesn't create actual streams, creating a disconnect between service planning and stream management.

## Desired Outcome

Create a seamless workflow where:
- Memorial owners schedule services via calculator → streams are auto-created
- Both calculator and stream management interfaces stay synchronized
- Funeral directors can manage auto-created streams normally on service day

## Current Architecture Analysis

### Service Calculator Flow (Owners)
- **Location**: `/schedule` or similar calculator interface
- **Current Behavior**: Saves scheduling data to database
- **User Role**: Memorial owners (`role: 'owner'`)
- **Data Captured**: Service timing, location, duration, etc.

### Stream Management Flow (Funeral Directors)
- **Location**: `/memorials/[id]/streams`
- **Current Behavior**: Manual stream creation via "Create Stream" button
- **User Role**: Funeral directors (`role: 'funeral_director'`) and admins
- **Data Captured**: Stream title, description, scheduled start time

## Implementation Plan

### Phase 1: Identify Current Calculator Implementation
- [ ] Locate service calculator components and API endpoints
- [ ] Analyze current data structure and storage
- [ ] Document existing scheduling workflow

### Phase 2: Stream Auto-Creation
- [ ] Modify calculator submission to trigger stream creation
- [ ] Create API endpoint for auto-stream generation
- [ ] Map calculator data to stream parameters:
  - Service name → Stream title
  - Service date/time → Scheduled start time
  - Service description → Stream description

### Phase 3: Bidirectional Synchronization
- [ ] **Calculator → Stream**: Update stream when calculator data changes
- [ ] **Stream → Calculator**: Update calculator when stream timing changes
- [ ] Implement data consistency checks
- [ ] Handle edge cases (deleted streams, conflicting updates)

### Phase 4: UI/UX Integration
- [ ] Update stream management to show auto-created streams
- [ ] Add visual indicators for calculator-generated streams
- [ ] Ensure funeral directors can manage auto-created streams normally
- [ ] Update calculator UI to reflect stream creation status

## Technical Requirements

### Database Schema Changes
- Link calculator entries to stream records
- Add metadata to identify auto-created streams
- Ensure referential integrity between services and streams

### API Endpoints to Modify/Create
- **Calculator submission endpoint**: Add stream creation logic
- **Stream update endpoint**: Sync back to calculator data
- **Calculator update endpoint**: Sync forward to stream data

### Data Flow
```
Owner schedules service (Calculator) 
    ↓
Auto-create stream with scheduling data
    ↓
Stream appears in management dashboard
    ↓
Funeral director manages stream on service day
```

### Synchronization Logic
```
Calculator Update → Check for linked stream → Update stream timing
Stream Update → Check for linked calculator entry → Update service timing
```

## Success Criteria

1. **Seamless Creation**: Calculator submissions automatically create streams
2. **Bidirectional Sync**: Changes in either interface update the other
3. **Role Separation**: Owners plan, funeral directors execute
4. **Data Consistency**: No conflicts between calculator and stream data
5. **Backward Compatibility**: Existing manual streams continue working

## Potential Challenges

### Data Mapping
- Calculator fields may not directly map to stream fields
- Need to handle optional vs required fields in both systems

### Timing Conflicts
- What happens if calculator and stream are updated simultaneously?
- How to resolve conflicts between different data sources?

### User Permissions
- Auto-created streams should be manageable by funeral directors
- Owners should see their scheduled services reflected as streams

### Edge Cases
- What if calculator entry is deleted but stream exists?
- How to handle streams that are manually modified after auto-creation?

## Implementation Order

1. **Research Phase**: Document current calculator implementation ✅ **COMPLETED**
2. **Backend Integration**: Create auto-stream creation logic ✅ **COMPLETED**
3. **Synchronization**: Implement bidirectional updates ✅ **COMPLETED**
4. **Frontend Updates**: Update UIs to reflect new workflow ✅ **COMPLETED**
5. **Testing**: Ensure all scenarios work correctly ⏳ **READY FOR TESTING**
6. **Documentation**: Update user guides and technical docs ⏳ **PENDING**

## ✅ IMPLEMENTATION COMPLETED

### What Was Built

**✅ Auto-Stream Creation (Calculator → Streams)**
- Enhanced `createStreamsFromSchedule()` function in Calculator.svelte
- Added calculator service linking metadata (`calculatorServiceType`, `calculatorServiceIndex`)
- Streams are automatically created when users save calculator data with dates/times

**✅ Bidirectional Synchronization (Streams → Calculator)**
- Updated Stream type definition with calculator linking fields
- Modified stream creation API to store calculator metadata
- Enhanced stream update API to sync timing changes back to calculator
- Direct database updates for optimal performance

**✅ Visual Integration**
- Added "Calculator" badge to auto-generated streams in StreamHeader component
- Visual distinction between manual and auto-created streams
- Maintains existing stream management functionality

### Data Flow Implemented

```
Owner uses calculator → Auto-creates streams → Appears in stream dashboard
                    ↕ (bidirectional sync)
FD updates stream timing → Updates calculator data → Owner sees changes
```

## Files Likely to be Modified

### Calculator Components
- Service calculator form components
- Calculator API endpoints
- Calculator data models

### Stream Management
- `/frontend/src/routes/memorials/[id]/streams/+page.svelte`
- Stream creation API endpoints
- Stream data models

### Database
- Add linking fields between services and streams
- Migration scripts for existing data

## Next Steps

1. Locate and analyze current service calculator implementation
2. Map data structures between calculator and streams
3. Design the auto-creation and synchronization logic
4. Implement backend changes first, then frontend updates
