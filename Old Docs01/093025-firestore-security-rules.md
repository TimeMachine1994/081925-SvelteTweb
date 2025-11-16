# Tributestream Firestore Security Rules Documentation
**Date:** September 30, 2025  
**Purpose:** Define what determines if content is readable by unauthorized users

## Overview

Firestore security rules determine what data can be accessed by different types of users. This document explains how our security model works for public memorial pages and stream visibility.

## Security Architecture

### **Server-Side vs Client-Side Access**

1. **Server-Side (Firebase Admin SDK)**
   - **Bypasses all security rules** - can read/write any data
   - Used in `+page.server.ts` files and API endpoints
   - Requires server authentication (service account)

2. **Client-Side (Firebase Client SDK)**
   - **Subject to security rules** - must pass rule validation
   - Used in browser JavaScript/Svelte components
   - User authentication determines permissions

## Memorial Page Public Access Rules

### **Memorial Collection (`/memorials/{memorialId}`)**

```javascript
allow read: if isAdmin() || 
           resource.data.isPublic == true || 
           request.auth.uid == resource.data.creatorUid ||
           (request.auth != null && resource.data.funeralDirector.id == request.auth.uid);
```

**Public Access Criteria:**
- ✅ **Memorial.isPublic == true** → Anyone can read (no authentication required)
- ✅ **Memorial owner** → Can always read their memorial
- ✅ **Funeral director** → Can read memorials they manage
- ✅ **Admins** → Can read any memorial

### **Streams Collection (`/streams/{streamId}`) - NEW RULES**

```javascript
// Public can read visible streams from public memorials
allow read: if resource.data.isVisible == true && 
           resource.data.memorialId != null &&
           isMemorialPublic(resource.data.memorialId);
```

**Public Stream Access Criteria:**
- ✅ **Stream.isVisible == true** AND
- ✅ **Associated memorial is public** AND  
- ✅ **Stream has memorialId** (is associated with a memorial)

## Security Layers for Public Memorial Pages

### **Layer 1: Memorial Visibility**
```javascript
Memorial.isPublic == true  // Memorial must be public
```

### **Layer 2: Stream Visibility**  
```javascript
Stream.isVisible == true   // Stream must be marked visible
```

### **Layer 3: Stream Status Filtering (Application Logic)**
```javascript
// Only show appropriate streams to public
if (stream.status === 'live') return true;           // Live streams
if (stream.status === 'scheduled') return true;      // Upcoming services  
if (stream.status === 'completed' && stream.recordingReady) return true; // Recordings
return false; // Hide other statuses
```

## Data Flow Security Model

### **[fullSlug] Page Security Flow**

1. **Server-Side Query** (`+page.server.ts`)
   ```typescript
   // Uses Admin SDK - bypasses security rules
   const streamsQuery = adminDb.collection('streams')
     .where('memorialId', '==', memorial.id)
     .where('isVisible', '!=', false);
   ```

2. **Application-Level Filtering**
   ```typescript
   // Filter to only show appropriate streams
   publicStreams = publicStreams.filter(stream => {
     if (stream.status === 'live') return true;
     if (stream.status === 'scheduled') return true;
     if (stream.status === 'completed' && stream.recordingReady) return true;
     return false;
   });
   ```

3. **Client-Side Display**
   ```svelte
   <!-- Only displays pre-filtered public streams -->
   {#each publicStreams as stream}
     <span class="stream-title">{stream.title}</span>
   {/each}
   ```

### **Management Interface Security Flow**

1. **Authentication Required**
   ```typescript
   // Must be logged in to access /memorials/[id]/streams
   if (!locals.user) return redirect('/login');
   ```

2. **Permission Validation**
   ```typescript
   // Check if user can manage this memorial's streams
   const canAccess = await canAccessMemorialStreams(memorialId, locals.user);
   ```

3. **Firestore Rules Enforcement**
   ```javascript
   // Rules allow managers to see all streams (including hidden ones)
   allow read: if canManageMemorial(resource.data.memorialId);
   ```

## Security Rule Functions

### **Helper Functions in Firestore Rules**

```javascript
// Check if user can manage the memorial
function canManageMemorial(memorialId) {
  let memorial = get(/databases/$(database)/documents/memorials/$(memorialId)).data;
  return isAdmin() ||
         (request.auth != null && request.auth.uid == memorial.ownerUid) ||
         (request.auth != null && request.auth.uid == memorial.funeralDirectorUid);
}

// Check if memorial is public
function isMemorialPublic(memorialId) {
  let memorial = get(/databases/$(database)/documents/memorials/$(memorialId)).data;
  return memorial.isPublic == true;
}
```

## Public Access Decision Matrix

| User Type | Memorial.isPublic | Stream.isVisible | Stream.status | Can View? |
|-----------|------------------|------------------|---------------|-----------|
| **Guest** | ✅ true | ✅ true | live | ✅ Yes |
| **Guest** | ✅ true | ✅ true | scheduled | ✅ Yes |
| **Guest** | ✅ true | ✅ true | completed + recording | ✅ Yes |
| **Guest** | ✅ true | ❌ false | any | ❌ No |
| **Guest** | ❌ false | ✅ true | any | ❌ No |
| **Owner** | any | any | any | ✅ Yes |
| **Funeral Director** | any | any | any | ✅ Yes |
| **Admin** | any | any | any | ✅ Yes |

## Implementation Recommendations

### **For Public Memorial Pages**
1. **Always check Memorial.isPublic** before showing any content
2. **Filter streams by isVisible** for public viewers
3. **Apply status filtering** to show appropriate streams
4. **Use server-side queries** for better performance and security

### **For Management Interfaces**
1. **Require authentication** for all management functions
2. **Validate permissions** server-side before showing data
3. **Use middleware** for consistent permission checking
4. **Log access attempts** for security monitoring

### **For Future Features**
1. **Follow the same pattern**: Memorial.isPublic + Feature.isVisible
2. **Add application-level filtering** for appropriate content
3. **Document security decisions** in this file
4. **Test with unauthenticated users** to verify public access

## Security Testing Checklist

- [ ] Unauthenticated users can view public memorial pages
- [ ] Unauthenticated users cannot view private memorial pages  
- [ ] Public users only see visible streams from public memorials
- [ ] Hidden streams don't appear on public pages
- [ ] Management interfaces require authentication
- [ ] Users can only manage memorials they own/are assigned to
- [ ] Firestore rules block unauthorized direct database access

## Deployment Notes

**IMPORTANT:** After updating Firestore rules:
1. Deploy rules using `firebase deploy --only firestore:rules`
2. Test public access with incognito browser
3. Verify management interfaces still work for authenticated users
4. Monitor Firebase console for rule violations
