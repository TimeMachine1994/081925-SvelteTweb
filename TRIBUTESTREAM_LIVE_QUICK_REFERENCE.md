# Tributestream Live - Quick Reference Guide

**Date**: November 4, 2025  
**Version**: 1.0

## 🎯 Project Overview

**Transform Tributestream from memorial-only platform to universal life events livestreaming platform with integrated fundraising.**

---

## 📚 Documentation Index

### Core Documents
1. **[REFACTOR_OVERVIEW.md](TRIBUTESTREAM_LIVE_REFACTOR_OVERVIEW.md)** - Executive summary and vision
2. **[DATA_MODEL.md](TRIBUTESTREAM_LIVE_DATA_MODEL.md)** - Database schema changes
3. **[UI_UX_CHANGES.md](TRIBUTESTREAM_LIVE_UI_UX_CHANGES.md)** - Interface transformation
4. **[FUNDRAISING_SYSTEM.md](TRIBUTESTREAM_LIVE_FUNDRAISING_SYSTEM.md)** - Donation platform
5. **[IMPLEMENTATION_PHASES.md](TRIBUTESTREAM_LIVE_IMPLEMENTATION_PHASES.md)** - Development roadmap
6. **[MIGRATION_STRATEGY.md](TRIBUTESTREAM_LIVE_MIGRATION_STRATEGY.md)** - Data migration plan

---

## 🔑 Key Changes at a Glance

### Platform Shift
| Aspect | Before | After |
|--------|--------|-------|
| **Focus** | Memorial services only | All life events |
| **Users** | Funeral homes & families | Everyone celebrating moments |
| **Revenue** | Streaming service fees | Streaming + fundraising fees |
| **Branding** | Somber, memorial-focused | Celebratory, versatile |

### Event Types Supported
- ✅ Memorials (keep existing)
- 🆕 Weddings
- 🆕 Birthdays
- 🆕 Graduations
- 🆕 Fundraisers
- 🆕 Community Events
- 🆕 Family Celebrations
- 🆕 Professional Events

### Major New Features
1. **Donation/Fundraising System** - Stripe-powered donations on any event
2. **Professional Services Marketplace** - Hire streamers for events
3. **Personal Event Library** - User's collection of all livestreamed moments
4. **Multi-Event Types** - Categorized events with type-specific features

---

## 📊 Data Model Changes

### Collections
```
memorials/  →  Keep as legacy (read-only after migration)
events/     →  New unified collection for all event types
donations/  →  New collection for fundraising
bookings/   →  New collection for professional services
```

### Key Type Changes
```typescript
// OLD
interface Memorial {
  lovedOneName: string;
  // memorial-specific
}

// NEW
interface Event {
  eventName: string;
  eventType: EventType; // wedding | birthday | memorial | etc.
  fundraising?: FundraisingDetails;
  // flexible for any event type
}
```

---

## 💰 Fundraising System

### Fee Structure
```
Donation: $100.00
- Stripe Fee: $3.20 (2.9% + $0.30)
- Platform Fee: $5.30 (5% + $0.30)
- Net to Owner: $91.50
```

### Tech Stack
- **Payment Processing**: Stripe Checkout
- **Payouts**: Stripe Connect (Express accounts)
- **Webhooks**: Real-time payment updates
- **Tax Compliance**: Automatic 1099-K reporting

### Flow
```
Viewer → Donate → Stripe → Webhook → Firestore → Event Owner Payout
```

---

## 🎨 UI/UX Transformation

### Navigation Changes
```
OLD: For Families | For Funeral Directors | Blog | Contact

NEW: Events | Browse | For Professionals | Pricing | Blog
```

### Homepage Structure
```
Hero: "Stream Life's Important Moments"
  ↓
Event Types Showcase (visual cards)
  ↓
How It Works (DIY vs Professional)
  ↓
Recent Public Events
  ↓
Success Stories
  ↓
Fundraising Impact
  ↓
Pricing
```

### Terminology Updates
| Old | New | Context |
|-----|-----|---------|
| Memorial | Event | Generic platform term |
| Loved One | Event Subject/Honoree | Form fields |
| Funeral Director | Professional Streamer | User role |
| Service | Event/Occasion | Generic term |

**Exception**: Keep "Memorial" when event type IS specifically a memorial.

---

## ⚡ Implementation Timeline

### 16-Week Rollout

**Weeks 1-3: Foundation**
- Create new data models
- Build API endpoints
- Set up dual-collection system

**Weeks 4-6: Fundraising**
- Stripe integration
- Donation widgets
- Payout system

**Weeks 7-9: UI/UX**
- Homepage redesign
- Event creation flow
- Personal event library

**Weeks 10-12: Professional Services**
- Professional profiles
- Booking system
- Discovery/matching

**Weeks 13-14: Migration & Launch**
- Bulk data migration
- User communication
- Public launch

**Weeks 15-16: Polish**
- Bug fixes
- Performance optimization
- Feature refinements

---

## 🔄 Migration Approach

### Strategy: Dual Collection
```typescript
// Write to both during transition
await eventsCollection.add(eventData);
await memorialsCollection.add(memorialData); // backwards compat

// Read from both with fallback
let event = await eventsCollection.get(id);
if (!event) {
  event = await memorialsCollection.get(id); // fallback
}
```

### Migration Steps
1. **Run in parallel** (Weeks 1-12)
2. **Bulk migrate** existing memorials → events (Week 13)
3. **Verify** 100% data integrity
4. **Switch** primary reads to events collection
5. **Archive** memorials as read-only backup

### Backwards Compatibility
- All memorial URLs continue working (301 redirects)
- Memorial-specific features preserved
- No user action required
- Gradual feature adoption

---

## 🎯 Success Metrics

### Launch Goals (Month 1)
- ✅ User retention > 95%
- ✅ New event types created: 100+
- ✅ Professional signups: 50+
- ✅ Fundraising transactions: 100+
- ✅ Support ticket increase < 10%

### Technical KPIs
- ✅ Zero data loss during migration
- ✅ Page load time < 2 seconds
- ✅ API response < 200ms
- ✅ Uptime > 99.9%

### Business KPIs
- ✅ Monthly recurring revenue (MRR) growth
- ✅ Donation transaction volume
- ✅ Professional services bookings
- ✅ Platform NPS > 50

---

## 🚨 Risk Management

### Critical Risks
1. **Data loss during migration** → Backup & test rollback
2. **User confusion** → Clear communication & tutorials
3. **Payment processing issues** → Extensive Stripe testing
4. **Performance degradation** → Load testing & monitoring

### Mitigation
- Feature flags for gradual rollout
- Staging environment for testing
- Rollback plans at each phase
- 24/7 monitoring during launch

---

## 👥 Team & Resources

### Development Team (4.5 FTE)
- 1 Senior Full-Stack Engineer
- 1 Frontend Engineer
- 1 DevOps Engineer
- 1 QA Engineer
- 0.5 Designer

### Timeline: 16 weeks

### Budget Increase: ~$500-1000/month
- Stripe Connect setup
- Additional Firestore capacity
- Monitoring tools
- Email service upgrade

---

## 📋 Quick Start Checklist

### Before Starting
- [ ] Review all 6 core documents
- [ ] Get stakeholder sign-off
- [ ] Assemble development team
- [ ] Set up project management tools
- [ ] Create technical specifications

### Week 1 Tasks
- [ ] Create events collection in Firestore
- [ ] Update TypeScript interfaces
- [ ] Build first API endpoints
- [ ] Set up feature flags
- [ ] Create staging environment

### Essential Tools
- **Payment**: Stripe Connect account
- **Database**: Firestore (existing)
- **Email**: SendGrid (existing)
- **Monitoring**: Sentry + Firebase Performance
- **Analytics**: Google Analytics + custom dashboards

---

## 🔗 Important Links

### Development
- Figma Designs: [TBD]
- Staging Environment: [TBD]
- Project Board: [TBD]
- Technical Specs: [TBD]

### External Services
- Stripe Dashboard: stripe.com/dashboard
- Firebase Console: console.firebase.google.com
- SendGrid: sendgrid.com

### Documentation
- Stripe Connect Guide: stripe.com/docs/connect
- SvelteKit Docs: kit.svelte.dev
- Firestore Docs: firebase.google.com/docs/firestore

---

## 💡 Key Decisions Made

### Technology Choices
- ✅ **Stripe Connect Express** for payouts (not Standard)
- ✅ **Dual collection approach** for migration (not big bang)
- ✅ **Gradual rollout** with feature flags (not all-at-once)
- ✅ **5% + $0.30 platform fee** (not percentage-only)
- ✅ **Keep ABeeZee typography** (maintain brand continuity)

### Architecture Decisions
- ✅ **SvelteKit** remains the framework
- ✅ **Firebase/Firestore** for database (no change)
- ✅ **Cloudflare Stream** for video hosting (existing)
- ✅ **Client-side feature flags** for A/B testing

---

## 🎓 Learning Resources

### For Developers
- [Stripe Connect Platform Guide](https://stripe.com/docs/connect/platform-guide)
- [SvelteKit Migration Guide](https://kit.svelte.dev/docs/migrating)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)

### For Team
- **Product Demo Videos**: Create after UI mockups
- **User Testing Protocols**: Define during Phase 3
- **Marketing Materials**: Develop during Weeks 12-13

---

## 📞 Support & Questions

### Technical Questions
- Review relevant markdown doc first
- Check existing codebase patterns
- Ask in team Slack channel

### Business Questions
- Product Manager
- Stakeholder meetings (bi-weekly)

### User Feedback
- Support ticket system
- In-app feedback widget
- User testing sessions

---

## 🚀 Next Actions

1. ✅ **Read this quick reference**
2. **Deep dive** into relevant detailed documents
3. **Schedule kickoff meeting** with full team
4. **Create technical specifications** for Phase 1
5. **Begin Week 1 development tasks**

---

## 📈 Long-Term Vision (Post-Launch)

### Year 1 Goals
- 10,000+ total events created
- 1,000+ professional streamers
- $1M+ in fundraising facilitated
- Mobile apps (iOS/Android)

### Future Features
- Recurring events / subscriptions
- Advanced analytics dashboard
- API for third-party integrations
- White-label solutions
- AI-powered highlights
- Multistream to multiple platforms
- Interactive features (polls, Q&A, reactions)

---

**Quick Reference Version**: 1.0  
**Last Updated**: November 4, 2025  
**Document Owner**: Project Lead

---

## 📝 Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| Nov 4, 2025 | 1.0 | Initial quick reference created |

---

**Ready to start? Begin with [IMPLEMENTATION_PHASES.md](TRIBUTESTREAM_LIVE_IMPLEMENTATION_PHASES.md) for the detailed week-by-week plan.**
