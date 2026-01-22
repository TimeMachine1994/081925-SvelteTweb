# Frontend File Structure WBS - January 22, 2026

**Document Purpose:** Work Breakdown Structure (WBS) cataloging all files and directories in the `frontend/` project.

---

## 1. Root Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template |
| `.firebaserc` | Firebase project configuration |
| `.gitignore` | Git ignore rules |
| `.npmrc` | NPM configuration |
| `.prettierignore` | Prettier ignore patterns |
| `.prettierrc` | Prettier formatting rules |
| `apphosting.emulator.yaml` | Firebase App Hosting emulator config |
| `eslint.config.js` | ESLint configuration |
| `package.json` | NPM dependencies and scripts |
| `package-lock.json` | Locked dependency versions |
| `postcss.config.js` | PostCSS configuration |
| `svelte.config.js` | SvelteKit configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `vercel.json` | Vercel deployment settings |
| `vite.config.ts` | Vite bundler configuration |
| `vitest.config.ts` | Vitest test runner configuration |
| `playwright.config.ts` | Playwright E2E test config |
| `playwright.production.config.ts` | Production E2E test config |
| `storage.rules` | Firebase Storage security rules |
| `tribute-theme.css` | Custom theme CSS |

---

## 2. Documentation (`/Documentation/`)

| File | Description |
|------|-------------|
| `ADMIN_INTERFACE_JOURNEYS.md` | Admin user journey documentation |
| `DEV_MODE_BAR_REMOVAL.md` | Dev mode UI removal guide |
| `ENCODER_IMPLEMENTATION_PLAN.md` | Encoder feature planning |
| `ENCODER_SYSTEM_DESIGN.md` | Encoder architecture design |
| `ENCODER_SYSTEM_REUSABLE_CODE.md` | Encoder reusable components |
| `FD_LIVESTREAM_JOURNEY.md` | Funeral director livestream flow |
| `ProjectOverview.md` | High-level project overview |

---

## 3. DevDocs (`/DevDocs/`)

| File | Description |
|------|-------------|
| `WBS_1-21-26_SIMPLIFIED_STREAM_SCHEDULING.md` | Stream scheduling WBS |
| `WBS_1-22-26_MUX_STREAMING_PLATFORM.md` | Mux platform integration WBS |
| `WBS_ADMIN_MEMORIAL_DETAILS_SVELTE5_AUDIT.md` | Svelte 5 audit for admin |

---

## 4. Source Code (`/src/`)

### 4.1 Root Files
| File | Purpose |
|------|---------|
| `app.css` | Global application styles |
| `app.d.ts` | App-level TypeScript declarations |
| `app.html` | HTML shell template |
| `hooks.server.ts` | SvelteKit server hooks (auth, etc.) |
| `test-setup.ts` | Test environment setup |

---

### 4.2 Library (`/src/lib/`)

#### 4.2.1 Admin (`/src/lib/admin/`)
| File | Purpose |
|------|---------|
| `navigation.ts` | Admin navigation configuration |
| `permissions.ts` | Role-based permission system |

#### 4.2.2 Config (`/src/lib/config/`)
| File | Purpose |
|------|---------|
| `pricing.ts` | Pricing tiers and calculations |
| `stripe.ts` | Stripe configuration |

#### 4.2.3 Stores (`/src/lib/stores/`)
| File | Purpose |
|------|---------|
| `adminUser.ts` | Admin user state store |
| `webmap.ts` | Webmap visualization state |

#### 4.2.4 Firebase Integration
| File | Purpose |
|------|---------|
| `auth.ts` | Client auth helpers |
| `firebase.ts` | Client Firebase initialization |
| `firebase-admin.ts` | Admin SDK initialization |

#### 4.2.5 Composables (`/src/lib/composables/`)
| File | Purpose |
|------|---------|
| `useAutoSave.ts` | Auto-save functionality |
| `useAutoSave.test.ts` | Auto-save tests |
| `useFormAutoSave.ts` | Form-specific auto-save |
| `useOptimizedData.ts` | Data optimization hooks |
| `usePreloader.ts` | Data preloading utilities |

#### 4.2.6 Types (`/src/lib/types/`)
| File | Purpose |
|------|---------|
| `index.ts` | Type exports |
| `admin.ts` | Admin-related types |
| `chat.ts` | Chat feature types |
| `encoder.ts` | Encoder types |
| `follower.ts` | Follower types |
| `funeral-director.ts` | Funeral director types |
| `invitation.ts` | Invitation types |
| `livestream.ts` | Livestream types |
| `memorial.ts` | Memorial data types |
| `schedule-edit-request.ts` | Schedule request types |
| `slideshow.ts` | Slideshow types |
| `stream.ts` | Stream types |
| `webmap.ts` | Webmap types |
| `wiki.ts` | Wiki content types |

---

### 4.3 Components (`/src/lib/components/`)

#### 4.3.1 Root Components
| Component | Purpose |
|-----------|---------|
| `BookingReminderBanner.svelte` | Booking reminder UI |
| `BrowserStreamer.svelte` | Browser-based streaming |
| `CountdownVideoPlayer.svelte` | Countdown video display |
| `ErrorBoundary.svelte` | Error handling wrapper |
| `Footer.svelte` | Site footer |
| `GoogleReviewsCarousel.svelte` | Google reviews display |
| `LiveUrlPreview.svelte` | Live URL preview |
| `LoadingSpinner.svelte` | Loading indicator |
| `Login.svelte` | Login form |
| `MemorialFollowButton.svelte` | Follow memorial button |
| `MemorialSlideshow.svelte` | Memorial slideshow player |
| `MemorialStreamDisplay.svelte` | Stream display component |
| `Navbar.svelte` | Navigation bar |
| `OptimizedImage.svelte` | Optimized image loading |
| `Profile.svelte` | User profile component |
| `RecaptchaProvider.svelte` | reCAPTCHA integration |
| `Register.svelte` | Registration form |
| `RegisterMinimalModern.svelte` | Modern registration UI |
| `RolePreviewer.svelte` | Role preview component |
| `SlideshowPlayer.svelte` | Slideshow playback |
| `SlideshowSection.svelte` | Slideshow section UI |

#### 4.3.2 Admin Components (`/src/lib/components/admin/`)
| Component | Purpose |
|-----------|---------|
| `AdminLayout.svelte` | Admin page layout |
| `BulkActionBar.svelte` | Bulk operations UI |
| `CustomPricingEditor.svelte` | Custom pricing management |
| `DataGrid.svelte` | Data table component |
| `FilterBuilder.svelte` | Filter construction UI |
| `index.ts` | Component exports |

#### 4.3.3 Calculator Components (`/src/lib/components/calculator/`)
| Component | Purpose |
|-----------|---------|
| `BookingForm.svelte` | Booking form |
| `Calculator.svelte` | Price calculator |
| `Calculator.test.ts` | Calculator tests |
| `Calculator.simple.test.ts` | Simple calculator tests |
| `StripeCheckout.svelte` | Stripe payment UI |
| `Summary.svelte` | Booking summary |
| `TierSelector.svelte` | Service tier selection |

#### 4.3.4 Chat Components (`/src/lib/components/chat/`)
| Component | Purpose |
|-----------|---------|
| `ChatMessage.svelte` | Chat message display |
| `ChatPanel.svelte` | Chat panel UI |
| `ChatToggleButton.svelte` | Chat toggle button |
| `index.ts` | Component exports |

#### 4.3.5 Streaming Components (`/src/lib/components/streaming/`)
| Component | Purpose |
|-----------|---------|
| `ChatModerationPanel.svelte` | Chat moderation UI |
| `CreateStreamModal.svelte` | Stream creation modal |
| `EncoderArmControl.svelte` | Encoder arm controls |
| `EncoderSelector.svelte` | Encoder selection UI |
| `LiveChatWidget.svelte` | Live chat widget |
| `MuxVideoPlayer.svelte` | Mux video player |
| `StreamAnalyticsDashboard.svelte` | Stream analytics |
| `StreamCard.svelte` | Stream card display |

#### 4.3.6 Slideshow Components (`/src/lib/components/slideshow/`)
| Component | Purpose |
|-----------|---------|
| `AudioUploader.svelte` | Audio upload UI |
| `PhotoSlideshowCreator.svelte` | Slideshow creation (93KB) |
| `PhotoSlideshowCreator.test.ts` | Creator tests |
| `PhotoSlideshowGenerator.svelte` | Slideshow generation |
| `debug-slideshow.js` | Debug utilities |

#### 4.3.7 Minimal Modern Components (`/src/lib/components/minimal-modern/`)
| Component | Purpose |
|-----------|---------|
| `Badge.svelte` | Badge component |
| `Breadcrumbs.svelte` | Breadcrumb navigation |
| `Button.svelte` | Button component |
| `Card.svelte` | Card component |
| `Comparison.svelte` | Comparison UI |
| `CondolenceForm.svelte` | Condolence submission |
| `FAQ.svelte` | FAQ display |
| `Gallery.svelte` | Image gallery |
| `Input.svelte` | Input component |
| `MemorialCard.svelte` | Memorial card display |
| `ServiceSchedule.svelte` | Service schedule display |
| `Stats.svelte` | Statistics display |
| `Steps.svelte` | Step indicator |
| `StreamStatus.svelte` | Stream status display |
| `TagCloud.svelte` | Tag cloud |
| `Timeline.svelte` | Timeline display |
| `Toast.svelte` | Toast notifications |
| `VideoPlayer.svelte` | Video player |
| `index.ts` | Component exports |

#### 4.3.8 Webmap Components (`/src/lib/components/webmap/`)
| Component | Purpose |
|-----------|---------|
| `FileCard.svelte` | File card display |
| `FileTreeSidebar.svelte` | File tree navigation |
| `FileViewer.svelte` | File content viewer |
| `SearchBar.svelte` | Search functionality |
| `StatsPanel.svelte` | Stats display |
| `VisualCanvas.svelte` | Visual canvas |

#### 4.3.9 Wiki Components (`/src/lib/components/wiki/`)
| Component | Purpose |
|-----------|---------|
| `WikiCategoryFilter.svelte` | Category filtering |
| `WikiEditor.svelte` | Wiki content editor |
| `WikiPageCard.svelte` | Wiki page card |
| `WikiSearch.svelte` | Wiki search |
| `WikiTableOfContents.svelte` | Table of contents |

---

### 4.4 Server Library (`/src/lib/server/`)
| File | Purpose |
|------|---------|
| `admin.ts` | Admin server utilities |
| `admin.api.test.ts` | Admin API tests |
| `algolia.ts` | Algolia search client |
| `algolia-indexing.ts` | Algolia indexing |
| `auditLogger.ts` | Audit logging system |
| `auditLogger.test.ts` | Audit logger tests |
| `auditMiddleware.ts` | Audit middleware |
| `cloudflare-stream.ts` | Cloudflare Stream API |
| `daily.ts` | Daily.co integration |
| `email.ts` | Email sending (25KB) |
| `emailConfirmation.ts` | Email confirmation |
| `firebase.ts` | Server Firebase init |
| `geo-filter.ts` | Geographic filtering |
| `memorialMiddleware.ts` | Memorial access middleware |
| `memorialMiddleware.test.ts` | Middleware tests |
| `mux.ts` | Mux video API |
| `rate-limiter.ts` | Rate limiting |
| `stripe.ts` | Stripe server integration |

---

### 4.5 Utilities (`/src/lib/utils/`)
| File | Purpose |
|------|---------|
| `SimpleSlideshowGenerator.ts` | Simple slideshow generation |
| `SlideshowGenerator.ts` | Full slideshow generation |
| `admin.test.ts` | Admin utility tests |
| `bookingBanner.ts` | Booking banner logic |
| `clientFirebaseStorage.ts` | Client storage utilities |
| `createPlaceholderImages.js` | Placeholder image creation |
| `email-validation.ts` | Email validation |
| `email-validation.test.ts` | Email validation tests |
| `errorHandler.ts` | Error handling utilities |
| `imageOptimization.ts` | Image optimization |
| `integration.test.ts` | Integration tests |
| `memorial-slug.ts` | Memorial slug generation |
| `memorial-slug.test.ts` | Slug tests |
| `memorialAccess.ts` | Memorial access control |
| `memorialAccess.test.ts` | Access control tests |
| `memorialAccess.admin.test.ts` | Admin access tests |
| `optimizedPosters.ts` | Poster optimization |
| `payment.ts` | Payment utilities |
| `paymentStatus.ts` | Payment status tracking |
| `recaptcha.ts` | reCAPTCHA utilities |
| `simple.test.ts` | Simple tests |
| `streamMapper.ts` | Stream data mapping (21KB) |
| `stripeLoader.ts` | Stripe.js loader |
| `user-profile.ts` | User profile utilities |
| `user-profile.test.ts` | Profile tests |
| `whip-client.ts` | WHIP protocol client |

---

### 4.6 UI Library (`/src/lib/ui/`)
| Path | Purpose |
|------|---------|
| `index.ts` | UI exports |
| `navigation/` | Navigation components |
| `primitives/` | Base UI primitives |
| `tokens/` | Design tokens |

---

### 4.7 TPG System (`/src/lib/tpg/`)
| Path | Purpose |
|------|---------|
| `index.ts` | TPG exports |
| `workflows.ts` | TPG workflows |
| `bridge/` | Bridge utilities |
| `clipReport/` | Clip reporting |
| `matching/` | Matching algorithms |
| `output/` | Output generation |
| `parsers/` | Data parsers |
| `utils/` | TPG utilities |

---

## 5. Routes (`/src/routes/`)

### 5.1 Root Routes
| File | Purpose |
|------|---------|
| `+layout.server.ts` | Root layout server |
| `+layout.svelte` | Root layout component |
| `+page.svelte` | Homepage (36KB) |

### 5.2 Admin Routes (`/src/routes/admin/`)
| Path | Purpose |
|------|---------|
| `+page.server.ts` | Admin dashboard server |
| `+page.svelte` | Admin dashboard |
| `admin.server.test.ts` | Admin server tests |
| `content/` | Content management (8 items) |
| `mvp-dashboard/` | MVP dashboard |
| `services/encoders/` | Encoder management |
| `services/memorials/` | Memorial management |
| `services/schedule-requests/` | Schedule requests |
| `services/slideshows/` | Slideshow management |
| `services/streams/` | Stream management |
| `system/` | System settings (6 items) |
| `users/admin-users/` | Admin user management |
| `users/funeral-directors/` | FD management |
| `users/memorial-owners/` | Owner management |
| `wiki/` | Wiki management (8 items) |

### 5.3 API Routes (`/src/routes/api/`)

#### Admin APIs (`/api/admin/`)
| Endpoint | Purpose |
|----------|---------|
| `audit-logs/` | Audit log access |
| `blog/` | Blog management |
| `bulk-actions/` | Bulk operations |
| `cleanup-expired/` | Expired data cleanup |
| `create-memorial/` | Memorial creation |
| `delete-funeral-director/` | FD deletion |
| `delete-memorial/` | Memorial deletion |
| `delete-user/` | User deletion |
| `encoders/` | Encoder management |
| `memorials/` | Memorial operations |
| `mvp/` | MVP endpoints |
| `permanent-delete/` | Hard delete |
| `restore-deleted/` | Restore soft-deleted |
| `schedule-edit-requests/` | Schedule edits |
| `stats/` | Statistics |
| `switcher/` | Account switching |
| `toggle-memorial-status/` | Status toggle |
| `toggle-payment-status/` | Payment toggle |
| `update-funeral-director/` | FD update |
| `users/` | User management |

#### Memorial APIs (`/api/memorials/`)
| Endpoint | Purpose |
|----------|---------|
| `[id]/` | Memorial by ID |
| `[memorialId]/` | Memorial operations (17 endpoints) |
| `search/` | Memorial search |

#### Stream APIs (`/api/streams/`)
| Endpoint | Purpose |
|----------|---------|
| `[streamId]/` | Stream operations (11 endpoints) |

#### Other APIs
| Endpoint | Purpose |
|----------|---------|
| `book-demo/` | Demo booking |
| `check-payment-status/` | Payment status check |
| `confirm-email-change/` | Email confirmation |
| `contact/` | Contact form |
| `create-payment-intent/` | Stripe payment intent |
| `debug/` | Debug endpoints |
| `encoders/` | Encoder operations |
| `funeral-director/` | FD operations |
| `google-reviews/` | Google reviews |
| `lock-schedule/` | Schedule locking |
| `memorial/` | Memorial operations |
| `password-reset/` | Password reset |
| `proxy/` | Proxy requests |
| `session/` | Session management |
| `set-admin-claim/` | Admin claims |
| `set-role-claim/` | Role claims |
| `slideshow/` | Slideshow operations (6 endpoints) |
| `upload-image/` | Image upload |
| `user/` | User operations |
| `webhooks/` | Webhook handlers (4 endpoints) |

### 5.4 Public Routes
| Route | Purpose |
|-------|---------|
| `[fullSlug]/` | Memorial pages |
| `auth/` | Authentication flows |
| `blog/` | Blog pages |
| `book-demo/` | Demo booking page |
| `camera/` | Camera access |
| `contact/` | Contact page |
| `debug/` | Debug pages |
| `email-confirmed/` | Email confirmation |
| `emergency/` | Emergency page |
| `for-families/` | Family landing page |
| `for-funeral-directors/` | FD landing page |
| `funeral-director/` | FD portal |
| `hls/` | HLS streaming |
| `login/` | Login page |
| `logout/` | Logout handler |
| `memorial-example/` | Memorial example |
| `memorials/` | Memorial listing |
| `my-portal/` | User portal |
| `partnership/` | Partnership page |
| `payment/` | Payment flow |
| `pricing-breakdown/` | Pricing display |
| `profile/` | Profile management |
| `register/` | Registration flows |
| `reset-password/` | Password reset |
| `schedule/` | Schedule management |
| `search/` | Search page |
| `slideshow-generator/` | Slideshow generator |
| `stream/` | Stream pages |
| `theme-showroom/` | Theme preview |
| `tpg/` | TPG interface (14 items) |
| `webmap/` | Webmap feature |
| `whep/` | WHEP streaming |

---

## 6. Tests

### 6.1 E2E Tests (`/e2e/`)
| File | Purpose |
|------|---------|
| `auth.setup.ts` | Auth setup for tests |
| `full-user-journey.spec.ts` | Full journey tests |
| `production-api-tests.spec.ts` | Production API tests |
| `production-integration.spec.ts` | Production integration |
| `production-smoke.spec.ts` | Production smoke tests |
| `admin/admin-portal.spec.ts` | Admin portal tests |
| `auth/` | Auth E2E tests |
| `memorial/` | Memorial E2E tests |
| `streaming/` | Streaming E2E tests |

### 6.2 Unit/Integration Tests (`/tests/`)
| File | Purpose |
|------|---------|
| `emulator-ready.test.ts` | Emulator readiness |
| `firebase-integration.test.ts` | Firebase tests |
| `hls-integration.spec.ts` | HLS tests |
| `memorial-creation.test.ts` | Memorial creation |
| `memorial-fullslug.test.ts` | Fullslug tests |
| `owner-registration.test.ts` | Owner registration |
| `slideshow-refactor.test.ts` | Slideshow tests |
| `slideshow-refactor-integration.test.ts` | Slideshow integration |
| `demo/` | Demo mode tests |
| `fixtures/` | Test fixtures |
| `integration/` | Integration tests |

### 6.3 Test Utilities (`/test-utils/`)
| File | Purpose |
|------|---------|
| `factories.ts` | Test data factories |
| `test-helpers.ts` | Test helper functions |

---

## 7. Scripts

### 7.1 Root Scripts
| Script | Purpose |
|--------|---------|
| `check-cloudflare-config.sh` | Cloudflare config check |
| `check-real-streams.js` | Stream verification |
| `check-webhook-config.sh` | Webhook config check |
| `cleanup-routes.ps1` | Route cleanup |
| `copy-memorial.js` | Memorial copy utility |
| `create-test-memorial.js` | Test memorial creation |
| `debug-cloudflare-response.js` | Cloudflare debugging |
| `debug-stream-data.js` | Stream data debugging |
| `find-janet.js` | Find memorial utility |
| `fix-routes.ps1` | Route fixing |
| `fix-stream-status.js` | Stream status fix |
| `force-polling.js` | Force polling utility |
| `setup-admin-user.js` | Admin user setup |
| `setup-dev-accounts.js` | Dev account setup |
| `setup-production-webhook.sh` | Production webhook |
| `setup-webhook.sh` | Webhook setup |
| `simple-api-test.sh` | Simple API testing |
| `test-api-endpoints.sh` | API endpoint tests |
| `test-cloudflare-integration.js` | Cloudflare tests |
| `test-cloudflare-webhook.sh` | Webhook tests |
| `test-db-update.js` | DB update tests |
| `test-slideshow-api.js` | Slideshow API tests |
| `test-webhook.sh` | Webhook testing |

### 7.2 Scripts Directory (`/scripts/`)
| Script | Purpose |
|--------|---------|
| `clean-test-data.js` | Test data cleanup |
| `diagnose-pages.js` | Page diagnostics |
| `setup-test-data.js` | Test data setup |
| `test-instructions.js` | Test instructions |

### 7.3 Src Scripts (`/src/scripts/`)
| Script | Purpose |
|--------|---------|
| `clear-firebase-auth.js` | Auth cleanup |
| `create-test-accounts.js` | Test account creation |
| `create-test-data.js` | Test data creation |

---

## 8. Static Assets (`/static/`)
| File | Purpose |
|------|---------|
| `android-chrome-192x192.png` | Android icon (192px) |
| `android-chrome-512x512.png` | Android icon (512px) |
| `apple-touch-icon.png` | Apple touch icon |
| `blog-og-image.jpg` | Blog social image |
| `favicon-16x16.png` | Favicon (16px) |
| `favicon-32x32.png` | Favicon (32px) |
| `favicon.ico` | Main favicon |
| `logo.png` | Site logo |
| `robots.txt` | SEO robots file |
| `site.webmanifest` | PWA manifest |

---

## 9. Summary Statistics

| Category | Count |
|----------|-------|
| **Total src/ items** | ~466 |
| **Components** | ~90 |
| **API endpoints** | ~99 |
| **Route directories** | ~45 |
| **TypeScript types** | 14 |
| **Server utilities** | 18 |
| **Client utilities** | ~30 |
| **Test files** | ~35 |
| **Documentation files** | 10 |

---

## 10. Key File Sizes (Notable)

| File | Size | Notes |
|------|------|-------|
| `PhotoSlideshowCreator.svelte` | 93KB | Largest component |
| `+page.svelte` (homepage) | 36KB | Main landing page |
| `Profile.svelte` | 32KB | Profile management |
| `schedule/+page.svelte` | 32KB | Schedule page |
| `PhotoSlideshowGenerator.svelte` | 32KB | Slideshow generation |
| `StreamCard.svelte` | 25KB | Stream display |
| `email.ts` | 25KB | Email templates |
| `CustomPricingEditor.svelte` | 22KB | Pricing editor |
| `MemorialStreamDisplay.svelte` | 21KB | Stream display |
| `streamMapper.ts` | 21KB | Stream data mapping |

---

*Generated: January 22, 2026*
