# Tributestream Technical Documentation

Welcome to the Tributestream internal wiki! This documentation covers the technical architecture, implementation details, and operational procedures for the Tributestream platform.

## 📚 Documentation Index

### Core Systems

#### [01 - Authentication Flow](./01-authentication-flow.md)
Complete guide to Firebase Authentication, session management, user roles, and security.

**Topics Covered**:
- Session cookie authentication
- User roles (admin, funeral_director, owner)
- Protected routes
- Magic link authentication
- Security best practices

#### [02 - Memorial Creation Flow](./02-memorial-creation-flow.md)
Step-by-step guide through the memorial creation process from initial setup to going live.

**Topics Covered**:
- Memorial data model
- Service configuration
- Livestream setup
- Photo slideshows
- Payment integration
- Slug generation

#### [03 - Firestore Data Models](./03-firestore-data-models.md)
Complete schema documentation for all Firestore collections.

**Collections Documented**:
- `memorials` - Core memorial data
- `users` - User profiles
- `funeral_directors` - FD information
- `invitations` - Memorial invites
- `blog` - Content management
- `schedule_edit_requests` - Change requests
- `wiki_pages` - This wiki!
- `wiki_page_versions` - Version history
- `demo_sessions` - Demo tracking

#### [04 - Livestream Integration](./04-livestream-integration.md)
Deep dive into Mux video streaming infrastructure.

**Topics Covered**:
- Mux API integration
- Live stream creation
- RTMP configuration
- HLS playback
- Recording management
- Webhook handling
- Error troubleshooting

#### [05 - Admin Dashboard](./05-admin-dashboard.md)
Guide to admin dashboard features and operations.

**Topics Covered**:
- Dashboard architecture
- Memorial management
- User management
- Funeral director oversight
- Wiki system
- Common admin tasks
- Troubleshooting

---

## 🚀 Quick Start

### For New Developers

1. **Read This First**:
   - [[Authentication Flow]]
   - [[Firestore Data Models]]

2. **Understand Key Flows**:
   - [[Memorial Creation Flow]]
   - [[Livestream Integration]]

3. **Admin Access**:
   - [[Admin Dashboard]]

### For Administrators

1. **Daily Operations**:
   - [[Admin Dashboard]] - Main control panel
   - [[Authentication Flow]] - Managing users

2. **Troubleshooting**:
   - [[Livestream Integration]] - Stream issues
   - [[Memorial Creation Flow]] - Setup problems

---

## 🏗️ System Architecture

### Technology Stack

**Frontend**:
- SvelteKit 2.0
- TypeScript
- TailwindCSS
- Lucide Icons

**Backend**:
- Firebase (Auth, Firestore, Storage)
- Vercel (Hosting & Serverless)
- Node.js

**Video**:
- Mux (Livestreaming & VOD)
- hls.js (Playback)

**Payments**:
- Stripe (Checkout & Billing)

**Email**:
- SendGrid (Transactional emails)

### Key Concepts

#### URL Structure
```
tributestream.com/memorial/[fullSlug]
tributestream.com/memorial/[fullSlug]/edit
tributestream.com/memorial/[fullSlug]/livestream
tributestream.com/admin
tributestream.com/admin/wiki
```

#### Authentication Flow
```
Client → Firebase Auth → ID Token → /api/auth/session → Session Cookie
→ hooks.server.ts → locals.user → Protected Route
```

#### Memorial Lifecycle
```
Create → Configure → Schedule Stream → Payment → Go Live → Archive
```

#### Data Flow
```
User Action → SvelteKit Route → Firebase Admin SDK → Firestore
→ Webhook → External Service (Mux/Stripe) → Update Firestore
```

---

## 🔧 Development Guide

### Environment Setup

**Required Environment Variables**:
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# SendGrid
SENDGRID_API_KEY=
```

### Running Locally

```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev

# Run with emulators (optional)
firebase emulators:start
```

### Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration
```

### Deployment

```bash
# Build
npm run build

# Deploy to Vercel (automatic via Git)
git push origin main

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## 📖 Common Tasks

### Creating an Admin User

```javascript
// Use Firebase Admin SDK
const admin = require('firebase-admin');
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

### Troubleshooting a Memorial

1. Check Firestore data
2. Verify `isPublic` and `isComplete` flags
3. Check livestream status
4. Review payment status
5. Check admin dashboard

### Adding a Wiki Page

1. Go to `/admin/wiki`
2. Click "Create New Page"
3. Write in Markdown
4. Add category and tags
5. Save

### Monitoring Streams

1. Check `/admin` dashboard
2. Review Mux dashboard
3. Check webhook logs
4. Test playback URL

---

## 🐛 Troubleshooting

### Authentication Issues
- Clear browser cookies
- Check Firebase Auth console
- Verify custom claims
- Review `hooks.server.ts` logs

### Livestream Problems
- Verify RTMP credentials
- Check Mux stream status
- Test with OBS
- Review webhook logs

### Database Issues
- Check Firestore rules
- Verify indexes
- Review query patterns
- Check for missing data

### Payment Failures
- Check Stripe dashboard
- Verify webhook endpoint
- Review calculator config
- Test in test mode

---

## 📝 Contributing to Wiki

### Creating New Pages

**Guidelines**:
1. Use descriptive titles
2. Include code examples
3. Add cross-references with `[[Page Title]]`
4. Categorize appropriately
5. Add relevant tags

**Markdown Features**:
- Headers: `#`, `##`, `###`
- Links: `[text](url)` or `[[Wiki Page]]`
- Code: Triple backticks with language
- Lists: `-` or `1.`
- Tables: Standard Markdown tables

### Page Organization

**Categories**:
- Technical Documentation
- User Guides
- API Reference
- Troubleshooting
- Best Practices
- System Design

**Naming Convention**:
- Use descriptive names
- Use kebab-case in filenames
- Include numbers for ordering (optional)
- Example: `01-authentication-flow.md`

---

## 🔗 External Resources

### Firebase
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Auth](https://firebase.google.com/docs/auth)

### Mux
- [Mux Documentation](https://docs.mux.com)
- [Live Streaming Guide](https://docs.mux.com/guides/video/stream-live-video)
- [Video.js Player](https://docs.mux.com/guides/video/play-your-videos)

### SvelteKit
- [SvelteKit Docs](https://kit.svelte.dev)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [SvelteKit Routing](https://kit.svelte.dev/docs/routing)

### Stripe
- [Stripe Docs](https://stripe.com/docs)
- [Checkout Integration](https://stripe.com/docs/payments/checkout)
- [Webhook Guide](https://stripe.com/docs/webhooks)

---

## 📊 System Status

### Health Checks
- Firebase: [status.firebase.google.com](https://status.firebase.google.com)
- Mux: [status.mux.com](https://status.mux.com)
- Vercel: [www.vercel-status.com](https://www.vercel-status.com)
- Stripe: [status.stripe.com](https://status.stripe.com)

### Monitoring
- Vercel Analytics: Production metrics
- Firebase Console: Database monitoring
- Mux Dashboard: Stream analytics
- Stripe Dashboard: Payment tracking

---

## 🆘 Getting Help

### Internal Resources
1. Check this wiki first
2. Review related documentation pages
3. Search for similar issues in codebase
4. Ask in team chat

### External Support
- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)
- Mux Support: [help.mux.com](https://help.mux.com)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

## 📅 Last Updated

This wiki was initialized on: **November 11, 2024**

**Maintainer**: Admin Team

**How to Update**: Edit pages via `/admin/wiki/[slug]/edit`

---

## 🎯 Next Documentation Needed

Suggested pages for future documentation:
- Email System & Templates
- Error Handling & Logging
- Performance Optimization
- SEO & Meta Tags
- Testing Strategies
- Deployment Pipeline
- Backup & Recovery
- API Rate Limiting
- Analytics & Tracking
- Mobile Responsiveness

Feel free to create these pages as needed!
