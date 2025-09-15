User Role Implementation Plan (Updated 090725)
This document outlines the plan to implement role-based access control (RBAC) for different user types within the Tributestream platform. It reflects the latest technical design updates (memorial slugs at root, auto-save schedule form, livestream management, and photo/contributor permissions).
The user roles to be implemented are:
•	owner
•	family_member
•	viewer
•	funeral_director
________________________________________
Role Permissions and Abilities
Role	Current Abilities (What they can do NOW)	Target Abilities (What they SHOULD be able to do)
owner	See the "Owner" dashboard. Create/edit/view their own memorials.	Create new memorials. Edit and manage memorials they own. Upload/edit/delete photos. Moderate family photos. Invite/revoke family contributors. Manage schedules, payments, and livestreams.
family_member	See the "Family Member" dashboard.	View assigned memorials. Upload/delete their own photos. View schedule (read-only). Participate via owner invitation only.
viewer	See the "Viewer" dashboard.	Register/login, view memorials, “heart” memorials, see them in My Portal. Read-only access otherwise.
funeral_director	See the "Funeral Director" dashboard.	Create memorials for families via FD Form. Edit schedule for assigned tributes. Upload photos. Start/stop livestreams for memorials they are assigned to. Manage service details with family.
________________________________________
Implementation Steps & Progress Log
Step	Task	Status	Notes
1	Update Data Model & FireCMS	✅ Completed	User type and FireCMS users collection include the role field.
2	Create Role-Setting Endpoint	✅ Completed	/api/set-role-claim live; admins only.
3	Update Server Auth Hook	✅ Completed	event.locals.user includes role and admin.
4	Implement Role-Based UI	✅ Completed	/my-portal renders different placeholders by role.
5	Implement Admin Preview	🔲 Pending	Allow admins to preview portal as different roles.
6	Secure "Create Memorial"	🔲 Pending	Restrict access to Owners & Funeral Directors only.
7	Implement Photo Permissions	🔲 Pending	Owners: full CRUD + moderation. Family: upload/delete own. FD: upload (assigned).
8	Implement Contributor Invites	🔲 Pending	Owner can invite/revoke family by email.
9	Implement Schedule Auto-Save	🔲 Pending	Schedule edits auto-save every ≤5s; consistent across roles.
10	Implement Livestream Permissions	🔲 Pending	Owner + FD (assigned with go_live) can start/stop livestreams. 
11	Audit Trails & Locking	🔲 Pending	One livestream per tribute. Log who started/stopped streams, timestamps, and status.
________________________________________
Step 7: Implement Photo Permissions
•	Owner: Upload/edit/delete own, moderate/remove family photos.
•	Family: Upload/delete own photos only.
•	FD: Upload if assigned.
•	Data Model: PHOTO.removedByOwner flag, uploadedBy userId.
Step 8: Implement Contributor Invites
•	Owner invites by email → creates INVITATION record (status=pending).
•	Family must accept and register/login.
•	Owner can revoke access at any time.
Step 9: Implement Schedule Auto-Save
•	Auto-save all edits to SCHEDULE and SCHEDULE_ITEM within 5s.
•	Expose schedule data consistently across Owner, Family (RO), FD (edit).
Step 10: Implement Livestream Permissions
•	Owner & FD: start/stop livestreams for their tributes.
•	Remote Producer: remote access to livestream controls (phase 2).
•	Onsite Videographer: view event details, optionally upload clips (phase 2).
•	Lock: one active session per tribute.
Step 11: Audit Trails
•	Every livestream session persisted in LIVESTREAM_SESSION.
•	Includes startedBy, endedBy, timestamps, outcome, destination, and recording URL.
•	Prevents duplicate sessions per tribute.
Tributestream — Requirements (Concise)
