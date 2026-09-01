# Service Schedule Display Fix 📅

## 🐛 Issue Summary

**Problem**: The service start time entered in the calculator/schedule page is not displaying on the memorial page (custom URL).

**Status**: Data is saving and loading correctly, but the UI component to display it is missing.

---

## 🔍 Investigation Results

### ✅ What's Working

1. **Data Entry** - Users can enter service times in `/schedule/[memorialId]`
   - Main service date/time fields work
   - Additional location/day fields work
   - All data binds correctly to form inputs

2. **Data Saving** - Service data saves to Firestore correctly
   - Saves on "Save and Pay Later" button click
   - Saves on "Book Now" button click
   - Data structure matches design spec:
   ```typescript
   services: {
     main: {
       location: { name: string, address: string, isUnknown: boolean },
       time: { date: string, time: string, isUnknown: boolean },
       hours: number
     },
     additional: [
       { type: 'location' | 'day', location: {...}, time: {...}, hours: number }
     ]
   }
   ```

3. **Data Loading** - Memorial page server loads services correctly
   - Server load function includes: `services: memorialData.services || null`
   - Data is available in page component as `memorial.services`

### ❌ What's Broken

**Memorial Page Display** - No UI component to show the service schedule
- ServiceSchedule component exists but not imported
- No code to transform services data into display format
- Service times are invisible to visitors

---

## 🎯 Solution Plan

### Component to Use

We'll integrate the existing **ServiceSchedule component**:
- **Location**: `/lib/components/minimal-modern/ServiceSchedule.svelte`
- **Features**: Beautiful timeline-style schedule display
- **Props Required**:
  - `theme` - Visual theme (we'll use "minimal")
  - `title` - Section heading (we'll use "Service Schedule")
  - `date` - Service date (formatted from `services.main.time.date`)
  - `events` - Array of schedule events (transformed from `services`)

---

## 📝 Implementation Steps

### Step 1: Add Import to Memorial Page

**File**: `src/routes/[fullSlug]/+page.svelte`

Add import at the top of script section:
```svelte
import ServiceSchedule from '$lib/components/minimal-modern/ServiceSchedule.svelte';
```

### Step 2: Add Helper Functions

Add these helper functions to format data:

#### A. Format Service Date
```typescript
function formatServiceDate(dateString: string | null): string {
  if (!dateString) return 'Date TBD';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}
```

**Example Output**: "Monday, December 25, 2025"

#### B. Format Service Time
```typescript
function formatServiceTime(timeString: string | null): string {
  if (!timeString) return 'Time TBD';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return timeString;
  }
}
```

**Example Output**: "2:00 PM"

### Step 3: Create Derived State for Schedule Events

Transform `memorial.services` into the format ServiceSchedule expects:

```typescript
// Derive schedule events from memorial services data
const scheduleEvents = $derived(() => {
  if (!memorial?.services) return [];
  
  const events = [];
  
  // Main service event
  if (memorial.services.main) {
    const mainService = memorial.services.main;
    const hasTime = mainService.time?.date && 
                    mainService.time?.time && 
                    !mainService.time.isUnknown;
    
    if (hasTime) {
      events.push({
        id: 'main-service',
        title: mainService.location?.name || 'Memorial Service',
        time: mainService.time.time,
        duration: `${mainService.hours || 2} hour${mainService.hours !== 1 ? 's' : ''}`,
        location: mainService.location?.address || mainService.location?.name,
        description: 'Celebration of Life Service'
      });
    }
  }
  
  // Additional services (additional locations and days)
  if (Array.isArray(memorial.services.additional)) {
    memorial.services.additional.forEach((service, index) => {
      const hasTime = service.time?.date && 
                      service.time?.time && 
                      !service.time.isUnknown;
      
      if (hasTime) {
        const isAdditionalDay = service.type === 'day';
        
        events.push({
          id: `additional-${index}`,
          title: service.location?.name || 
                 (isAdditionalDay ? 'Additional Day Service' : 'Additional Location Service'),
          time: service.time.time,
          duration: `${service.hours || 2} hour${service.hours !== 1 ? 's' : ''}`,
          location: service.location?.address || service.location?.name,
          description: isAdditionalDay ? 
            'Extended memorial service' : 
            'Service at additional location'
        });
      }
    });
  }
  
  // Sort events by time
  return events.sort((a, b) => a.time.localeCompare(b.time));
});
```

### Step 4: Add Component to Page Layout

Insert the ServiceSchedule component in the memorial body section:

**Location**: After the memorial header, before the streaming section

```svelte
<!-- Body Section -->
<div class="memorial-body">
  <!-- Service Schedule Section - NEW -->
  {#if scheduleEvents().length > 0}
    <div class="schedule-section">
      <ServiceSchedule 
        theme="minimal"
        title="Service Schedule"
        date={formatServiceDate(memorial.services.main?.time?.date)}
        events={scheduleEvents()}
      />
    </div>
  {/if}
  
  <!-- Stream Section - Always show, component handles empty state -->
  <div class="streaming-section">
    <MemorialStreamDisplay 
      streams={streams || []} 
      memorialName={memorial.lovedOneName}
      emergencyEmbed={memorial.emergencyEmbed}
    />
  </div>
  
  <!-- Content area for future features -->
</div>
```

### Step 5: Add Styling

Add CSS for the schedule section:

```css
.schedule-section {
  max-width: 1200px;
  margin: 0 auto 3rem auto;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .schedule-section {
    padding: 0 1rem;
  }
}
```

---

## 🎨 Visual Result

After implementation, visitors will see:

```
┌─────────────────────────────────────────────────────────┐
│  Celebration of Life for                                │
│  John Doe                                               │
│  June 15, 1950 - December 1, 2024                       │
│  [Slideshow]                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Service Schedule                                        │
│  Monday, December 25, 2025                              │
│  ─────────────────────────────────────────────────────  │
│  ●  Memorial Service                                    │
│     2:00 PM (2 hours)                                   │
│     📍 Smith Funeral Home, 123 Main St                  │
│     Celebration of Life Service                         │
│  ─────────────────────────────────────────────────────  │
│  ●  Additional Location Service                         │
│     5:00 PM (3 hours)                                   │
│     📍 Community Center, 456 Oak Ave                    │
│     Service at additional location                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📹 Livestream                                          │
│  [Countdown/Video Player]                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌───────────────────────────────────────────────────────────┐
│  USER ENTERS SERVICE TIME                                 │
│  /schedule/[memorialId]                                   │
│                                                           │
│  Main Service:                                            │
│  • Date: 2025-12-25                                       │
│  • Time: 14:00                                            │
│  • Location: Smith Funeral Home                           │
│  • Hours: 2                                               │
│                                                           │
│  Clicks: "Save and Pay Later"                             │
└───────────────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│  SAVE TO FIRESTORE                                        │
│  memorials/[id]                                           │
│                                                           │
│  services: {                                              │
│    main: {                                                │
│      location: { name: "Smith Funeral Home", ... },      │
│      time: { date: "2025-12-25", time: "14:00", ... },   │
│      hours: 2                                             │
│    },                                                     │
│    additional: [...]                                      │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│  LOAD ON MEMORIAL PAGE                                    │
│  /[fullSlug]/+page.server.ts                              │
│                                                           │
│  const memorial = {                                       │
│    services: memorialData.services,  // ✅ Loaded         │
│    ...                                                    │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│  TRANSFORM TO SCHEDULE FORMAT                             │
│  /[fullSlug]/+page.svelte                                 │
│                                                           │
│  const scheduleEvents = $derived(() => {                  │
│    return [{                                              │
│      id: 'main-service',                                  │
│      title: 'Memorial Service',                           │
│      time: '14:00',                                       │
│      duration: '2 hours',                                 │
│      location: 'Smith Funeral Home'                       │
│    }];                                                    │
│  });                                                      │
└───────────────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│  DISPLAY ON PAGE                                          │
│  ServiceSchedule Component                                │
│                                                           │
│  📅 Service Schedule                                      │
│  Monday, December 25, 2025                                │
│  ─────────────────────────────────                       │
│  ● Memorial Service                                       │
│    2:00 PM (2 hours)                                      │
│    📍 Smith Funeral Home                                  │
│    Celebration of Life Service                            │
└───────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Plan

### Test Case 1: Main Service Only
1. Go to `/schedule/[memorialId]`
2. Fill in main service:
   - Date: 2025-12-25
   - Time: 14:00
   - Location: Smith Funeral Home
   - Hours: 2
3. Click "Save and Pay Later"
4. Visit memorial page
5. **Expected**: Service schedule shows one event at 2:00 PM

### Test Case 2: Main + Additional Location
1. Fill in main service (as above)
2. Enable additional location
3. Fill in additional location:
   - Date: 2025-12-25
   - Time: 17:00
   - Location: Community Center
   - Hours: 3
4. Save and visit memorial page
5. **Expected**: Schedule shows two events (2:00 PM, 5:00 PM)

### Test Case 3: Main + Additional Day
1. Fill in main service for Dec 25
2. Enable additional day
3. Fill in additional day for Dec 26:
   - Date: 2025-12-26
   - Time: 10:00
   - Location: Chapel
   - Hours: 2
4. Save and visit memorial page
5. **Expected**: Schedule shows main service (Dec 25 date shown, both times visible if same day)

### Test Case 4: No Service Times
1. Don't fill in any service times
2. Save and visit memorial page
3. **Expected**: Service schedule section doesn't appear (conditional rendering)

### Test Case 5: Time Unknown
1. Fill in service but check "Time Unknown"
2. Save and visit memorial page
3. **Expected**: Service schedule section doesn't appear (only shows if time is known)

---

## 📁 Files Modified

### 1. `/routes/[fullSlug]/+page.svelte`
**Changes**:
- Add import for ServiceSchedule component
- Add `formatServiceDate()` helper function
- Add `formatServiceTime()` helper function (optional, component handles this)
- Add `scheduleEvents` derived state
- Add ServiceSchedule component to page layout
- Add CSS for schedule section

**Lines Added**: ~100 lines
**Lines Modified**: 0 (pure addition)

---

## 🎯 Success Criteria

After implementation:

✅ Service times entered in calculator appear on memorial page  
✅ Beautiful timeline-style schedule display  
✅ Shows main service and all additional services  
✅ Displays location, time, and duration for each service  
✅ Only shows when service times are actually set (not "Time Unknown")  
✅ Responsive design works on mobile  
✅ Integrates seamlessly with existing memorial page layout  

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] Test with memorial that has only main service
- [ ] Test with memorial that has main + additional location
- [ ] Test with memorial that has main + additional day
- [ ] Test with memorial that has no service times
- [ ] Test with memorial that has "Time Unknown" checked
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify styling matches site theme
- [ ] Confirm no console errors

---

## 📝 Notes

### Why This Component?

We're using the existing `ServiceSchedule` component because:
1. **Already built** - Beautiful timeline design with gold accents
2. **Theme integrated** - Uses minimal-modern theme system
3. **Feature complete** - Handles time formatting, multiple events, responsive design
4. **Professional** - Matches the quality of the rest of the site

### Alternative Considered

We could build a custom component, but the existing ServiceSchedule:
- Has all features we need
- Matches the design system
- Is already tested and working
- Saves development time

### Future Enhancements

After this fix, we could add:
- Live stream integration (pass `streamUrl` to events)
- "Add to Calendar" button
- Email reminders for service times
- Time zone handling for remote attendees

---

**Status**: Ready for implementation  
**Estimated Time**: 15 minutes  
**Risk Level**: Low (pure addition, no breaking changes)  
**Testing Required**: Moderate (test various service configurations)
