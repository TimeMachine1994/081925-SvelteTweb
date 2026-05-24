# Project Status & Documentation Gap Analysis (082425)
This document provides an overview of the current application status by comparing the implemented codebase against the master technical documents (082325-master-tech-doc-cont.md, 082325-RolePlan.md, 082325-admincomponent-progress.md).

The following pages, features, and API endpoints have been implemented in the application but are not yet described in the official documentation.

1. Undocumented Pages & Features
Calculator & Checkout Flow

Description: A complete feature set allowing users to calculate service costs and complete payments.
Location: /frontend/src/routes/app/calculator/ and /frontend/src/routes/app/checkout/
Components: All components within frontend/src/lib/components/calculator/
Server Logic: frontend/src/lib/server/stripe.ts
User Profile Page

Description: A dedicated page for users to view and manage their profile information.
Location: /frontend/src/routes/profile/
Component: frontend/src/lib/components/Profile.svelte
Public Tribute Page

Description: The public-facing page that displays a memorial tribute to visitors.
Location: /frontend/src/routes/tributes/[fullSlug]/
Multi-Step Registration

Description: A specialized registration flow with distinct paths for 'Funeral Directors' and 'Loved Ones'.
Location: /frontend/src/routes/register/funeral-director/ and /frontend/src/routes/register/loved-one/
Livestream Management

Description: A user-facing page for creating and managing new livestreams associated with a memorial.
Location: /frontend/src/routes/my-portal/tributes/[memorialId]/livestream/new/
Theme Showcase Pages

Description: Two pages that appear to be for internal development and testing of visual themes.
Location: /frontend/src/routes/theme/ and /frontend/src/routes/theme2/
2. Undocumented API Endpoints
Create Livestream

Endpoint: POST /api/livestream/create
Description: Creates a new livestream session.
Location: frontend/src/routes/api/livestream/create/+server.ts
Follow Memorial

Endpoint: POST /api/memorials/[memorialId]/follow
Description: Allows a user to follow a specific memorial.
Location: frontend/src/routes/api/memorials/[memorialId]/follow/+server.ts
Invite to Memorial

Endpoint: POST /api/memorials/[memorialId]/invite
Description: Enables sending invitations for a memorial to other users.
Location: frontend/src/routes/api/memorials/[memorialId]/invite/+server.ts
User Logout

Endpoint: POST /logout
Description: A dedicated endpoint to terminate the user's session.
Location: frontend/src/routes/logout/+server.ts
Session Management

Endpoint: /api/session
Description: Handles authentication session-related tasks.
Location: frontend/src/routes/api/session/+server.ts
3. Undocumented Components & Types
Core Layout Components:
Navbar.svelte: The main application navigation bar.
Footer.svelte: The application footer.
Data Types:
follower.ts: Type definitions related to the 'follow' feature.
invitation.ts: Type definitions for the user invitation system.
livestream.ts: Type definitions for livestream management.