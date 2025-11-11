# Tributestream Firestore Collections - Complete Documentation Index

Complete reference documentation for all Firestore collections used in the Tributestream application.

---

## 📚 Documentation Files

This documentation is split into three focused documents:

### 1. [FIRESTORE_COLLECTIONS_CORE.md](./FIRESTORE_COLLECTIONS_CORE.md)
**Core application collections powering primary functionality:**
- `users` - User accounts and profiles
- `memorials` - Memorial pages
- `streams` - Livestreams and recordings
- `funeral_directors` - Professional profiles

### 2. [FIRESTORE_COLLECTIONS_ADMIN.md](./FIRESTORE_COLLECTIONS_ADMIN.md)
**Admin, audit, security, and demo system:**
- `admin_actions` - Basic admin logging
- `admin_audit_logs` - Detailed admin auditing
- `audit_logs` - System-wide auditing
- `schedule_edit_requests` - Schedule change workflow
- `passwordResetTokens` - Password reset tokens
- `demoSessions` - Demo environments

### 3. [FIRESTORE_COLLECTIONS_OTHER.md](./FIRESTORE_COLLECTIONS_OTHER.md)
**Subcollections, content, commerce, and maintenance:**
- `memorials/{id}/slideshows` - Photo slideshows
- `memorials/{id}/followers` - Memorial followers
- `blog` - Blog posts
- `purchases` - Payment transactions (placeholder)
- `live_streams` - Alternative Mux streams (legacy)
- Indexing requirements
- Cleanup & maintenance procedures
- Backup strategies

---

## 🗂️ Quick Reference

### Collection Count
- **14 Top-Level Collections**
- **2 Subcollections**
- **1 Legacy Collection**
- **Total: 17 Collections**

### By Category

**User & Access Management:**
- `users`
- `funeral_directors`
- `passwordResetTokens`

**Core Content:**
- `memorials`
- `memorials/{id}/slideshows`
- `memorials/{id}/followers`
- `streams`

**Administration:**
- `admin_actions`
- `admin_audit_logs`
- `audit_logs`
- `schedule_edit_requests`

**System Features:**
- `demoSessions`
- `blog`

**Commerce:**
- `purchases` (placeholder)

**Legacy:**
- `live_streams`

---

## 🔍 Quick Lookup Table

| Collection | Purpose | Document |
|------------|---------|----------|
| `users` | User accounts | [Core](./FIRESTORE_COLLECTIONS_CORE.md#1-users) |
| `memorials` | Memorial pages | [Core](./FIRESTORE_COLLECTIONS_CORE.md#2-memorials) |
| `streams` | Livestreams | [Core](./FIRESTORE_COLLECTIONS_CORE.md#3-streams) |
| `funeral_directors` | Professional profiles | [Core](./FIRESTORE_COLLECTIONS_CORE.md#4-funeral_directors) |
| `memorials/{id}/slideshows` | Photo slideshows | [Other](./FIRESTORE_COLLECTIONS_OTHER.md#1-memorialsmemorialidslideshows) |
| `memorials/{id}/followers` | Memorial followers | [Other](./FIRESTORE_COLLECTIONS_OTHER.md#2-memorialsmemorialidfollowers) |
| `admin_actions` | Admin logging | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#1-admin_actions) |
| `admin_audit_logs` | Detailed auditing | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#2-admin_audit_logs) |
| `audit_logs` | System auditing | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#3-audit_logs) |
| `schedule_edit_requests` | Schedule changes | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#4-schedule_edit_requests) |
| `passwordResetTokens` | Password reset | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#5-passwordresettokens) |
| `demoSessions` | Demo environments | [Admin](./FIRESTORE_COLLECTIONS_ADMIN.md#6-demosessions) |
| `blog` | Blog posts | [Other](./FIRESTORE_COLLECTIONS_OTHER.md#3-blog) |
| `purchases` | Payments (placeholder) | [Other](./FIRESTORE_COLLECTIONS_OTHER.md#4-purchases) |

---

## 🔗 Key Relationships

```
users ─────────────┬──> memorials ────┬──> streams
                   │                  ├──> slideshows (subcollection)
                   │                  └──> followers (subcollection)
                   │
                   └──> funeral_directors ──> memorials

admin_actions ──> audit_logs

schedule_edit_requests ──> memorials

demoSessions ──> users (demo)
             ├──> memorials (demo)
             ├──> streams (demo)
             └──> slideshows (demo)
```

---

## 📊 Most Frequently Used Collections

### By Query Frequency:

1. **memorials** - Every memorial page load, search, creation
2. **streams** - Every livestream display and management
3. **users** - Every authentication check and profile load
4. **memorials/{id}/slideshows** - Memorial page slideshow display
5. **audit_logs** - All significant operations
6. **funeral_directors** - FD profile loads and memorial creation

### By Write Operations:

1. **audit_logs** - Logged on every significant operation
2. **streams** - Status updates via webhooks
3. **memorials** - Payment updates, service schedule changes
4. **users** - Registration, profile updates, payment status

---

## 🛠️ Common Operations

### User Registration
```
1. Create document in `users` collection
2. Set role and initial fields
3. If funeral_director, create in `funeral_directors`
4. Log to `admin_actions` if auto-approved
```

### Memorial Creation
```
1. Create document in `memorials` collection
2. Link to owner via `ownerUid`
3. Optionally link to `funeralDirectorUid`
4. Index in Algolia for search
5. Log to `audit_logs`
```

### Stream Lifecycle
```
1. Create in `streams` collection (auto from schedule or manual)
2. Cloudflare webhook updates status → 'live'
3. Recording ready webhook → update `recordingReady`
4. Display on memorial page via parent `memorialId`
```

### Payment Processing
```
1. Stripe webhook receives `checkout.session.completed`
2. Update `memorials.isPaid = true`
3. Update `memorials.calculatorConfig.status = 'paid'`
4. Update `users.hasPaidForMemorial = true`
5. Append to `memorials.paymentHistory[]`
6. Log to `audit_logs`
```

### Demo Session
```
1. Create in `demoSessions` with 4 pre-created users
2. Seed demo memorial with `isDemo: true`
3. Create demo streams and slideshows
4. All entities tagged with `demoSessionId`
5. Daily cleanup deletes expired demos
```

---

## 📝 Development Guidelines

### When Creating New Collections:

1. **Document thoroughly** - Add to appropriate documentation file
2. **Define TypeScript interfaces** - in `/src/lib/types/`
3. **Add security rules** - in `firestore.rules`
4. **Create indexes** - in `firestore.indexes.json`
5. **Plan cleanup** - Consider data lifecycle
6. **Tag demo data** - Add `isDemo`, `demoSessionId` fields

### Data Modeling Best Practices:

- **Use subcollections** for one-to-many relationships (slideshows, followers)
- **Denormalize** when needed for performance (followerCount)
- **Index selectively** - Only index queried fields
- **Limit document size** - Max 1MB per document
- **Batch operations** - Use transactions for atomic updates

---

## 🔒 Security Reminders

### Public Collections:
- `memorials` (if `isPublic == true`)
- `blog` (if `status == 'published'`)

### Server-Only Collections:
- `passwordResetTokens`
- `demoSessions` (API only)

### Admin-Only Collections:
- All `admin_*` collections
- `audit_logs` (users can read own records)
- `schedule_edit_requests` (users can read own)

---

## 📈 Monitoring & Maintenance

### Daily:
- Demo session cleanup (`/api/demo/cleanup`)
- Monitor Firestore usage and costs

### Weekly:
- Password reset token cleanup
- Review audit logs for anomalies

### Monthly:
- Archive old audit logs (>90 days)
- Review and optimize indexes
- Check backup integrity

### Quarterly:
- Archive completed edit requests (>6 months)
- Review security rules
- Performance optimization review

---

## 🚀 Quick Start Commands

### Deploy Indexes:
```bash
firebase deploy --only firestore:indexes
```

### Deploy Rules:
```bash
firebase deploy --only firestore:rules
```

### Backup Database:
```bash
gcloud firestore export gs://tributestream-backups/$(date +%Y-%m-%d)/
```

### Run Demo Cleanup:
```bash
curl -X POST https://your-domain.com/api/demo/cleanup
```

---

## 📞 Support & Updates

**Last Updated:** 2025-01-11

**Maintained By:** Tributestream Development Team

**Update Procedure:**
1. Make changes to collections or structure
2. Update appropriate documentation file
3. Update this index if needed
4. Commit changes with descriptive message
5. Deploy Firestore changes (indexes/rules)

---

*This documentation covers Firestore collections for the Tributestream memorial livestreaming platform. For questions or updates, contact the development team.*
