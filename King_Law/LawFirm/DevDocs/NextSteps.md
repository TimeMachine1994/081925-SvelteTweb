# King Law Firm - Next Steps Implementation Guide

## Document Overview
**Version**: 1.0  
**Date**: January 15, 2026  
**Status**: Phase Two In Progress  
**References**: 
- `MasterPlan.md` - Phase One Master Implementation Plan
- `PhaseTwo-Plan.md` - Phase Two Implementation Plan
- `PhaseTwo-Complete.md` - Phase Two Completion Status
- `ProjectStructure-WBS.md` - Work Breakdown Structure

---

## Current Implementation Status

### ✅ Phase One - COMPLETE
All Phase One objectives have been achieved:
- Public pages functional (home, services, about, contact)
- Authentication system with role-based routing
- Client dashboard with document upload and invoices
- Lawyer dashboard with client management
- File upload/download with local storage
- Medieval/fantasy theme with custom fonts
- Day/night mode toggle
- Responsive design

### 🔄 Phase Two - IN PROGRESS (Partial)

#### Completed Components
- ✅ **MessagePanel.svelte** - Messaging UI component
- ✅ **DocumentEmptyState.svelte** - Empty state component
- ✅ **DocumentList.svelte** - Document filtering and display
- ✅ **UploadProgress.svelte** - Upload progress tracking
- ✅ **ChatSlider.svelte** - Additional messaging component (15KB)

#### Completed Backend
- ✅ Message API endpoints (POST/GET/PATCH)
- ✅ Document upload API enhancements
- ✅ Upload utilities (progress tracking, chunked uploads)

#### Dashboard Integration
- ✅ MessagePanel integrated into client dashboard
- ✅ MessagePanel integrated into lawyer dashboard
- ✅ Document filtering and sorting functionality

---

## Critical Gaps Requiring Immediate Action

### 🚨 Priority 1: Infrastructure Issues

#### 1.1 WebSocket Server Implementation
**Status**: ❌ NOT IMPLEMENTED  
**Impact**: Real-time messaging non-functional  
**Required By**: Phase Two Sprint 4 (Week 6-7)

**Action Items**:
- [ ] Choose WebSocket library (`ws` or `socket.io`)
- [ ] Create WebSocket server endpoint
- [ ] Add WebSocket handler to `hooks.server.ts`
- [ ] Implement authentication for WebSocket connections
- [ ] Set up connection pool management
- [ ] Add heartbeat/ping-pong mechanism

**Reference**: `PhaseTwo-Plan.md` Section 4.1

**Files to Create**:
```
src/lib/server/websocket.ts  (WebSocket server)
src/lib/stores/websocket.ts  (Client-side store - verify if exists)
```

#### 1.2 Database Migration Application
**Status**: ⚠️ PENDING  
**Impact**: Phase Two features may not persist data correctly  
**Required By**: Before production deployment

**Action Items**:
- [ ] Review migration file: `drizzle/0001_big_doomsday.sql`
- [ ] Test migration in development database
- [ ] Apply migration to production Turso database
- [ ] Verify all Phase Two fields exist:
  - `document.direction` (TEXT: 'incoming' | 'outgoing')
  - `document.messageId` (TEXT, nullable, FK)
  - `document.viewedAt` (INTEGER, nullable)
  - `document.sharedVia` (TEXT: 'upload' | 'message')

**Commands**:
```bash
npm run db:generate  # Already done
npm run db:migrate   # NEEDS TO BE RUN
```

**Reference**: `PhaseTwo-Complete.md` Section 8, `PhaseTwo-Plan.md` Section 1.1

---

### 🔧 Priority 2: Missing Features

#### 2.1 Message Attachments UI
**Status**: ❌ NOT IMPLEMENTED  
**Impact**: Cannot send documents via messages  
**Required By**: Phase Two Sprint 2 completion

**Action Items**:
- [ ] Add "Attach Document" button to MessagePanel
- [ ] Create file picker integration in message composition
- [ ] Display attachment preview in message bubbles
- [ ] Add download button for message attachments
- [ ] Update message sending logic to include files
- [ ] Create `POST /api/messages/with-document` endpoint

**Reference**: `PhaseTwo-Plan.md` Sections 1.2.2 & 1.3.3

**Files to Update**:
```
src/lib/components/MessagePanel.svelte
src/routes/api/messages/with-document/+server.ts (NEW)
```

#### 2.2 Drag-and-Drop File Upload
**Status**: ⚠️ UI READY, HANDLERS INCOMPLETE  
**Impact**: User experience incomplete  
**Required By**: Phase Two Sprint 2 & 3

**Action Items**:
- [ ] Wire up drag-and-drop handlers in DocumentEmptyState
- [ ] Add visual feedback on drag-over
- [ ] Support multiple file drops
- [ ] Show upload progress for dropped files
- [ ] Test drag-and-drop in both dashboards

**Reference**: `PhaseTwo-Plan.md` Section 2.2.3

**Files to Update**:
```
src/lib/components/DocumentEmptyState.svelte
src/routes/dashboard/client/+page.svelte
src/routes/dashboard/lawyer/+page.svelte
```

#### 2.3 File Upload Modal
**Status**: ❌ NOT IMPLEMENTED  
**Impact**: Using native file picker instead  
**Required By**: Phase Two Sprint 3 completion

**Action Items**:
- [ ] Create UploadModal.svelte component
- [ ] Add drag-and-drop zone in modal
- [ ] Show file preview before upload
- [ ] Add batch upload confirmation
- [ ] Integrate modal trigger in dashboards

**Reference**: `PhaseTwo-Plan.md` Section 3.4.1

**Files to Create**:
```
src/lib/components/UploadModal.svelte
```

---

### 📝 Priority 3: Documentation Updates

#### 3.1 Document Recent Changes
**Status**: ❌ MISSING  
**Impact**: Team confusion, maintenance issues

**Action Items**:
- [ ] Document auth cookie refactor (commit `8461dbdb`)
  - What changed: Cookie handling now passes cookies directly
  - Why: Improved security/architecture
  - Impact: Authentication flow modified
- [ ] Document ChatSlider.svelte component
  - Purpose and use cases
  - Difference from MessagePanel
  - Integration points
- [ ] Update PhaseTwo-Complete.md status
  - Change "Ready for Production" to "In Progress"
  - Update known limitations section
  - Add WebSocket status clarification

**Files to Create/Update**:
```
DevDocs/AuthCookieRefactor.md (NEW)
DevDocs/ChatSliderGuide.md (NEW)
DevDocs/PhaseTwo-Complete.md (UPDATE)
```

#### 3.2 Improve Commit Messages
**Status**: ⚠️ ONGOING ISSUE  
**Impact**: Git history unclear

**Best Practices**:
- Use conventional commits format: `type(scope): description`
- Types: feat, fix, docs, refactor, test, chore
- Example: `feat(auth): refactor cookie handling to pass cookies directly`
- Example: `docs(phase-two): update completion status with WebSocket clarification`

---

## Phase Two Completion Roadmap

### Sprint 4 - Real-Time Infrastructure (CURRENT PRIORITY)

**Timeline**: 2 weeks  
**Goal**: Enable real-time updates for messaging and documents

#### Week 1: WebSocket Foundation
- [ ] **Day 1-2**: WebSocket server setup
  - Choose library and install dependencies
  - Create server endpoint
  - Add to hooks.server.ts
  - Test basic connection
  
- [ ] **Day 3-4**: WebSocket client store
  - Create/verify websocket.ts store
  - Implement connection management
  - Add auto-reconnect logic
  - Test connection status

- [ ] **Day 5**: Authentication & security
  - Add WebSocket authentication
  - Implement token validation
  - Test authorized connections

#### Week 2: Real-Time Features
- [ ] **Day 6-7**: Real-time messages
  - Broadcast message events
  - Update MessagePanel in real-time
  - Add delivery/read receipts
  - Test message flow

- [ ] **Day 8-9**: Real-time documents
  - Broadcast document upload events
  - Update DocumentList in real-time
  - Add "New Document" indicators
  - Test document notifications

- [ ] **Day 10**: Testing & polish
  - End-to-end testing
  - Handle edge cases
  - Performance optimization
  - Documentation

**Reference**: `PhaseTwo-Plan.md` Section 4 (entire section)

### Sprint 5 - Feature Completion

**Timeline**: 1 week  
**Goal**: Complete remaining Phase Two features

- [ ] Message attachments UI (Days 11-12)
- [ ] Drag-and-drop file upload (Day 13)
- [ ] File upload modal (Day 14)
- [ ] Database migration application (Day 15)
- [ ] Documentation updates (Days 16-17)

**Reference**: `PhaseTwo-Plan.md` Section 5.5

### Sprint 6 - Testing & Production Readiness

**Timeline**: 1 week  
**Goal**: Ensure production-ready quality

#### Testing Checklist
- [ ] **Unit Tests**
  - Upload utilities (progress, chunking)
  - WebSocket store
  - Message API endpoints
  
- [ ] **Integration Tests**
  - Message sending/receiving flow
  - Document upload with progress
  - WebSocket connection lifecycle
  
- [ ] **E2E Tests** (Playwright)
  - Client sends message to lawyer
  - Lawyer responds with document
  - Real-time updates appear
  - Upload progress displays correctly

- [ ] **Performance Tests**
  - Message delivery < 500ms
  - Large file upload (up to 50MB)
  - WebSocket reconnection time
  - Page load times

- [ ] **Security Audit**
  - WebSocket message validation
  - Content sanitization (XSS prevention)
  - File type validation
  - Rate limiting

**Reference**: `PhaseTwo-Plan.md` Sections 6 & 7

---

## Technical Debt & Improvements

### Code Quality Issues

#### 1. Commit Message Standards
**Current**: Vague messages like "changes", "```", "d", "hmm"  
**Required**: Conventional commits format  
**Action**: Implement pre-commit hooks with commitlint

#### 2. Type Safety Review
**Current**: Need to verify TypeScript coverage  
**Action**: 
- [ ] Review all Phase Two components for proper typing
- [ ] Add JSDoc comments for complex functions
- [ ] Ensure WebSocket messages are type-safe

#### 3. Error Handling
**Current**: Basic error handling in place  
**Action**:
- [ ] Add comprehensive error boundaries
- [ ] Implement user-friendly error messages
- [ ] Add error logging/tracking (consider Sentry)

---

## Environment & Configuration

### Required Environment Variables

#### Development
```bash
DATABASE_URL=file:./local.db  # Local SQLite for dev
DATABASE_AUTH_TOKEN=          # Empty for local
```

#### Production (Needs Verification)
```bash
DATABASE_URL=libsql://[your-turso-db].turso.io
DATABASE_AUTH_TOKEN=[your-auth-token]
WEBSOCKET_PORT=3001          # If separate WebSocket server
```

### Configuration Files to Review
- [ ] `svelte.config.js` - Verify adapter configuration
- [ ] `vite.config.ts` - Check build settings
- [ ] `drizzle.config.ts` - Confirm database connection
- [ ] `.env.example` - Update with new variables

---

## Dependencies to Add

### WebSocket Implementation
```bash
npm install ws @types/ws
# OR
npm install socket.io socket.io-client
```

### Testing (if not already installed)
```bash
npm install -D @playwright/test
npm install -D vitest @testing-library/svelte
```

### Optional but Recommended
```bash
npm install -D commitlint @commitlint/cli @commitlint/config-conventional
npm install -D husky  # For git hooks
npm install zod       # For runtime validation
```

---

## Success Criteria for Phase Two Completion

### Functional Requirements
- [x] Messages send/receive successfully
- [x] Document upload with progress indicators
- [ ] Real-time updates work within 1 second
- [x] Document filtering and organization
- [ ] Message attachments functional
- [ ] WebSocket connection stable with auto-reconnect

### Performance Requirements
- [ ] Message delivery < 500ms
- [x] Document upload supports up to 50MB
- [ ] WebSocket reconnects within 3 seconds
- [ ] Page load time < 2 seconds
- [x] UI remains responsive during uploads

### Quality Requirements
- [ ] All features covered by tests
- [ ] Documentation complete and accurate
- [ ] No critical bugs in issue tracker
- [ ] Code review completed
- [ ] Security audit passed

---

## Next Immediate Actions (This Week)

### Day 1-2: Critical Setup
1. **Verify WebSocket Store Existence**
   ```bash
   # Check if file exists
   ls src/lib/stores/websocket.ts
   ```
   - If exists: Review implementation
   - If missing: Create from Phase Two spec

2. **Database Migration**
   ```bash
   npm run db:migrate
   # Verify in Drizzle Studio
   npm run db:studio
   ```

3. **Document Recent Changes**
   - Create `AuthCookieRefactor.md`
   - Create `ChatSliderGuide.md`

### Day 3-5: WebSocket Implementation
1. Choose WebSocket library (recommend `socket.io` for ease)
2. Create server endpoint
3. Implement basic connection/authentication
4. Create client store (if missing)
5. Test connection lifecycle

### End of Week: Status Review
- [ ] WebSocket basic connection working
- [ ] Database migration applied
- [ ] Documentation updated
- [ ] Next sprint planned

---

## Risk Assessment

### High Risk Items
1. **WebSocket Scaling** - May need Redis for multiple server instances
   - Mitigation: Start with single instance, plan for scaling
   
2. **Database Migration** - Could break existing data
   - Mitigation: Test in dev, backup production before applying

3. **Real-Time Performance** - WebSocket load under high traffic
   - Mitigation: Implement connection limits, load testing

### Medium Risk Items
1. **Browser Compatibility** - WebSocket support varies
   - Mitigation: Implement polling fallback (as per Phase Two plan)

2. **File Upload Failures** - Network interruptions during large uploads
   - Mitigation: Chunked uploads with resume capability (implemented)

3. **Security Vulnerabilities** - WebSocket message injection
   - Mitigation: Validate all messages, sanitize content

---

## Support Resources

### Documentation References
- **Phase One Master Plan**: Complete checklist and timeline
- **Phase Two Plan**: Detailed implementation specs
- **Phase Two Complete**: Current status (needs update)
- **Project Structure WBS**: Full file structure and data flow

### External Resources
- [SvelteKit WebSocket Guide](https://kit.svelte.dev/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Turso Database Docs](https://docs.turso.tech/)

### Team Contacts
*(Add as needed)*
- Lead Developer: [Name]
- Database Admin: [Name]
- DevOps: [Name]

---

## Appendix A: File Checklist

### Files That Should Exist (Phase Two Complete)
- [x] `src/lib/components/MessagePanel.svelte`
- [x] `src/lib/components/DocumentEmptyState.svelte`
- [x] `src/lib/components/DocumentList.svelte`
- [x] `src/lib/components/UploadProgress.svelte`
- [x] `src/lib/components/ChatSlider.svelte`
- [x] `src/lib/utils/upload.ts`
- [x] `src/routes/api/messages/+server.ts`
- [x] `src/routes/api/messages/[caseId]/+server.ts`
- [x] `src/routes/api/messages/[id]/read/+server.ts`
- [x] `src/routes/api/documents/upload/+server.ts`
- [x] `src/routes/api/documents/chunk/+server.ts`

### Files That Should Be Created (Phase Two Incomplete)
- [ ] `src/lib/stores/websocket.ts` (verify existence)
- [ ] `src/lib/server/websocket.ts`
- [ ] `src/routes/api/messages/with-document/+server.ts`
- [ ] `src/lib/components/UploadModal.svelte`
- [ ] `DevDocs/AuthCookieRefactor.md`
- [ ] `DevDocs/ChatSliderGuide.md`
- [ ] `DevDocs/WebSocketImplementation.md`

---

## Appendix B: Command Quick Reference

### Development
```bash
npm run dev              # Start dev server
npm run check            # Type checking
npm run lint             # Code linting
npm run format           # Code formatting
```

### Database
```bash
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations (NEEDED)
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed test data
```

### Testing (when implemented)
```bash
npm run test             # Run unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report
```

### Production
```bash
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## Change Log

### Version 1.0 - January 15, 2026
- Initial document creation
- Status review of Phase One (complete) and Phase Two (in progress)
- Identified critical gaps (WebSocket, database migration)
- Created prioritized action plan
- Documented immediate next steps
- Added 3-sprint completion roadmap

---

**Document Status**: Living Document - Update as implementation progresses  
**Next Review**: After Sprint 4 completion (WebSocket implementation)  
**Owner**: Development Team Lead
