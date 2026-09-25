# Notes on duplicate / redirected renders

## Update: gated pages now captured (authenticated as admin)

All 22 routes below were re-captured using a real admin session cookie
(super_admin role). They now show actual UI, not the login redirect. Three of
them, however, are byte-identical to each other because they all landed on the
same `/profile` page, which currently 500s server-side (unrelated to auth):

- `funeral-director-dashboard.png` → deduped, see `profile.png` (both landed on
  `/profile`, which returned a 500 — likely a real bug worth flagging, not an
  auth issue: an admin visiting `/funeral-director/dashboard` gets redirected
  to `/profile`, which then errors)
- `schedule.png` → deduped, see `profile.png` (same 500 redirect)

Other role-based redirects observed with the admin session (not bugs, just
role-gating): `/payment` → `/schedule`, `/my-portal` → `/admin`.

---

## Original note (no session at all — now superseded above)

These routes originally required authentication and, with no session cookie, all
redirected to `/login` — producing a byte-identical screenshot to `login.png`.
Superseded by the re-capture above, kept here for history:

- `/admin`
- `/admin/wiki`
- `/admin/wiki/new`
- `/admin/content/blog`
- `/admin/content/blog/create`
- `/admin/services/memorials`
- `/admin/services/memorials/create`
- `/admin/services/receipts`
- `/admin/services/recordings`
- `/admin/services/streams`
- `/admin/system/audit-logs`
- `/admin/system/database`
- `/admin/system/email-logs`
- `/admin/users/funeral-directors`
- `/admin/users/memorial-owners`
- `/profile`
- `/profile/settings`
- `/my-portal`
- `/funeral-director/dashboard`
- `/app/book`
- `/payment`
- `/schedule`
- `/register/funeral-director` (redirects to `/login?redirect=/register/funeral-director`)

See `login.png` for what all of these currently look like unauthenticated.
To get their real UI, re-run with an authenticated session (dev-mode "Quick
Login" button, or seeded test credentials).
