# Implementation Plan: Role-Based Portal Features (v2)

This document outlines the phased implementation plan for building out the distinct features for the `owner`, `family_member`, and `viewer` user roles, including critical security rule modifications.

## Phase 1: Backend & Data Model Foundation

This phase focuses on creating the necessary Firestore collections, API endpoints, and security rules to support the new features.

| Task | Status |
| :--- | :--- |
| **Invitations System** | |
| 1.1: Design `invitations` collection schema | 🔲 Pending |
| 1.2: Create `POST /api/memorials/[memorialId]/invite` endpoint | 🔲 Pending |
| 1.3: Add Firestore rules for `invitations` collection | 🔲 Pending |
| **Follows System** | |
| 1.4: Design `followers` sub-collection schema | 🔲 Pending |
| 1.5: Create `POST /api/memorials/[memorialId]/follow` endpoint |  pencin Pending |
| 1.6: Add Firestore rules for `followers` sub-collection | 🔲 Pending |
| **Family Member Photo Uploads** | |
| 1.7: Update Firebase Storage rules for `family_member` uploads | 🔲 Pending |

## Phase 2: `owner` Portal Implementation

This phase focuses on building the UI for the `owner` to manage their memorials and invite other users.

| Task | Status |
| :--- | :--- |
| 2.1: Implement "Manage Invitations" UI in `OwnerPortal.svelte` | 🔲 Pending |
| 2.2: Connect invitation form to the new API endpoint | 🔲 Pending |
| 2.3: Display list of pending/accepted invitations | 🔲 Pending |
| 2.4: Verify all core owner actions are present and functional |  pencin Pending |

## Phase 3: `family_member` & `viewer` Portal Implementation

This phase focuses on building the specific, limited portal experiences for these roles.

| Task | Status |
| :--- | :--- |
| **`family_member` Portal** | |
| 3.1: Update `/my-portal` `load` function for `family_member` role | 🔲 Pending |
| 3.2: Implement memorial list in `FamilyMemberPortal.svelte` | 🔲 Pending |
| 3.3: Ensure "Add Photos" is the only available action | 🔲 Pending |
| **`viewer` Portal & Follow Feature** | |
| 3.4: Update `/my-portal` `load` function for `viewer` role | 🔲 Pending |
| 3.5: Implement followed memorials list in `ViewerPortal.svelte` | 🔲 Pending |
| 3.6: Add "Follow" button to public memorial page (`/tributes/[fullSlug]`) | 🔲 Pending |
