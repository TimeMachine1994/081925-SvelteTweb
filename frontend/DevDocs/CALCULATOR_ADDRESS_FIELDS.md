# Calculator Address Fields - MVP

**Status:** ✅ Already Implemented  
**Last Reviewed:** January 30, 2026

---

## Overview

The calculator booking form includes simple text input fields for location addresses. No validation, autocomplete, or maps - just plain text inputs.

---

## Implementation

### Data Model

```typescript
// Location structure used throughout
location: {
  name: string;      // e.g., "St. Mary's Church"
  address: string;   // e.g., "123 Main St, Anytown, USA"
  isUnknown: boolean;
}
```

### File Location

`src/lib/components/calculator/BookingForm.svelte`

---

## Address Fields

### 1. Main Service Address

**Lines 145-154**

```svelte
<label class="label md:col-span-3">
  <span>Location Address</span>
  <input
    class="input"
    type="text"
    bind:value={services.main.location.address}
    disabled={services.main.location.isUnknown}
    placeholder="123 Main St, Anytown, USA"
  />
</label>
```

- Full-width input (spans 3 columns on desktop)
- Disabled when "Unknown" is toggled
- Placeholder shows expected format

---

### 2. Additional Location Address

**Lines 210-212**

```svelte
<label class="label">
  <span>Location Address</span>
  <input class="input" type="text" bind:value={additionalLocation.location.address} />
</label>
```

- Standard width input
- Only visible when "Add a second location" is enabled

---

### 3. Additional Day Address

**Lines 261-263**

```svelte
<label class="label md:col-span-3">
  <span>Location Address</span>
  <input class="input" type="text" bind:value={additionalDay.location.address} />
</label>
```

- Full-width input
- Only visible when "Add another day" is enabled

---

## User Flow

1. User enters **Location Name** (e.g., "Grace Church")
2. User enters **Location Address** (e.g., "456 Oak Ave, Springfield, IL 62701")
3. If location is unknown, user clicks "Unknown" button to disable both fields
4. Data saves to `memorial.services.main.location.address` in Firestore

---

## What's NOT Included (By Design)

- ❌ Address validation
- ❌ Google Places autocomplete
- ❌ Map preview
- ❌ Separate city/state/zip fields
- ❌ Required field enforcement

---

## Storage

Addresses are stored in Firestore under the memorial document:

```
memorials/{memorialId}
  └── services
      ├── main
      │   └── location
      │       ├── name: "St. Mary's Church"
      │       ├── address: "123 Main St, Anytown, USA"
      │       └── isUnknown: false
      └── additional[]
          └── location
              ├── name: "Cemetery"
              ├── address: "789 Peace Rd, Anytown, USA"
              └── isUnknown: false
```

---

*Simple. Done.*
