# King Law Firm - Phase One Master Implementation Plan

## Project Overview
Building a professional law firm website with client portal, lawyer dashboard, document management, messaging system, and payment processing.

**Tech Stack**: SvelteKit 5, shadcn-svelte, Turso DB, Drizzle ORM, Stripe, Tailwind CSS 4

---

## SECTION 1: FOUNDATION & SETUP

### Step 1.1: Install shadcn-svelte
- [ ] Install shadcn-svelte CLI and dependencies
- [ ] Initialize shadcn-svelte configuration
- [ ] Set up component directory structure
- [ ] Install core components (Button, Card, Input, Select, Dialog, etc.)
- [ ] Verify component imports work correctly

### Step 1.2: Configure Custom Fonts
- [ ] Download Junction Regular font files (or use Google Fonts)
- [ ] Download Gaudy Bookletter 1911 font files
- [ ] Download League Script font files
- [ ] Add font files to `static/fonts/` directory
- [ ] Create `@font-face` declarations in global CSS
- [ ] Configure Tailwind to use custom fonts
- [ ] Test font rendering on sample page

### Step 1.3: Set Up Color Theme
- [ ] Define color palette in Tailwind config:
  - Primary: Gold (#D5BA7F or custom shade)
  - Secondary: Black (#000000)
  - Background: White (#FFFFFF)
  - Neutral: Grey shades (#E5E5E5, #A0A0A0, etc.)
- [ ] Configure shadcn-svelte theme colors
- [ ] Create CSS variables for light/dark mode
- [ ] Test color combinations for accessibility (WCAG AA)

### Step 1.4: Install Font Awesome
- [ ] Install Font Awesome SVG core and icon packs
- [ ] Configure Font Awesome in SvelteKit
- [ ] Create icon component wrapper for consistency
- [ ] Document available medieval/fantasy icons for use

### Step 1.5: Set Up Day/Night Mode
- [ ] Install theme toggle library or build custom
- [ ] Create theme store (Svelte store for persistence)
- [ ] Add localStorage persistence
- [ ] Create toggle component with moon/sun icon
- [ ] Add theme classes to app.html
- [ ] Define dark mode color variants

---

## SECTION 2: DATABASE SCHEMA & AUTHENTICATION

### Step 2.1: Extend User Table
- [ ] Add `role` enum field ('client' | 'lawyer' | 'admin')
- [ ] Add `email` field (unique, not null)
- [ ] Add `firstName` field
- [ ] Add `lastName` field
- [ ] Add `phoneNumber` field (optional)
- [ ] Add `createdAt` timestamp
- [ ] Add `updatedAt` timestamp
- [ ] Remove `age` field (not needed)
- [ ] Generate migration with Drizzle Kit

### Step 2.2: Create Cases Table
```sql
cases:
- id (primary key)
- clientId (foreign key -> user.id)
- lawyerId (foreign key -> user.id)
- title (string)
- description (text)
- status ('active' | 'pending' | 'closed')
- createdAt (timestamp)
- updatedAt (timestamp)
```
- [ ] Define schema in schema.ts
- [ ] Add relations between users and cases
- [ ] Generate migration

### Step 2.3: Create Documents Table
```sql
documents:
- id (primary key)
- caseId (foreign key -> cases.id)
- uploadedById (foreign key -> user.id)
- fileName (string)
- filePath (string)
- fileSize (integer, bytes)
- mimeType (string)
- uploadedAt (timestamp)
```
- [ ] Define schema
- [ ] Add relations
- [ ] Generate migration

### Step 2.4: Create Invoices Table
```sql
invoices:
- id (primary key)
- caseId (foreign key -> cases.id)
- amount (integer, cents)
- description (text)
- status ('unpaid' | 'partial' | 'paid')
- dueDate (timestamp)
- paidAmount (integer, cents)
- stripePaymentIntentId (string, nullable)
- createdAt (timestamp)
- paidAt (timestamp, nullable)
```
- [ ] Define schema
- [ ] Add relations
- [ ] Generate migration

### Step 2.5: Create Messages Table
```sql
messages:
- id (primary key)
- caseId (foreign key -> cases.id)
- senderId (foreign key -> user.id)
- content (text)
- attachmentDocumentId (foreign key -> documents.id, nullable)
- createdAt (timestamp)
- readAt (timestamp, nullable)
```
- [ ] Define schema
- [ ] Add relations
- [ ] Generate migration

### Step 2.6: Run Migrations
- [ ] Test all migrations locally
- [ ] Push schema to Turso database
- [ ] Verify tables created correctly
- [ ] Create seed data for testing (1 lawyer, 2 clients, sample cases)

### Step 2.7: Enhance Authentication
- [ ] Update registration to capture role, email, firstName, lastName
- [ ] Create separate registration flows for clients vs lawyers
- [ ] Add email validation
- [ ] Update auth.ts to return full user object with role
- [ ] Create role-based route guards (middleware)

---

## SECTION 3: PUBLIC PAGES

### Step 3.1: Create Layout Component
- [ ] Build main `+layout.svelte` with:
  - Navigation bar (logo, links, login button)
  - Footer
  - Theme toggle
- [ ] Make navigation sticky/fixed on scroll
- [ ] Add mobile hamburger menu
- [ ] Style with black/gold theme

### Step 3.2: Build Navigation Component
- [ ] Logo placeholder (left side)
- [ ] Navigation links: Services (dropdown), About, Contact, Login
- [ ] Services dropdown with 4 practice areas:
  - Personal Injury & Civil Suits
  - Business & Intellectual Property
  - Family & Estate Law
  - Criminal Defense
- [ ] Contact button (CTA style with gold)
- [ ] Responsive mobile menu

### Step 3.3: Build Home Page (/)
- [ ] **Hero Section**:
  - Large headline with Gaudy Bookletter 1911 font
  - Subheadline with Junction Regular
  - CTA buttons (Schedule Consultation, Learn More)
  - Background image or gradient
  
- [ ] **About Section**:
  - Law firm introduction
  - Mission statement
  - Team photo/placeholder
  - League Script for pull quote
  
- [ ] **Services Section**:
  - 4 service cards (one for each practice area)
  - Icons (medieval theme from Font Awesome)
  - Brief descriptions
  - "Learn More" links
  
- [ ] **Contact Section**:
  - Contact form (name, email, phone, message)
  - Office address/map placeholder
  - Phone and email display
  - Form submission handler

### Step 3.4: Build Services Template Page
- [ ] Create `/routes/services/[slug]/+page.svelte`
- [ ] Template structure:
  - Hero section with practice area name
  - Detailed description
  - "What We Handle" list
  - "Why Choose Us" section
  - Contact CTA
- [ ] Create 4 service pages:
  - `/services/personal-injury`
  - `/services/business-intellectual-property`
  - `/services/family-estate-law`
  - `/services/criminal-defense`
- [ ] Write unique content for each page

### Step 3.5: Build About Page (Optional)
- [ ] Team bios
- [ ] Firm history
- [ ] Values and approach

### Step 3.6: Build Contact Page
- [ ] Full contact form
- [ ] Map integration (optional)
- [ ] Office hours

---

## SECTION 4: AUTHENTICATION PAGES

### Step 4.1: Build Login Page (/login)
- [ ] Login form (username/email + password)
- [ ] "Forgot Password" link (placeholder for now)
- [ ] Error handling and validation
- [ ] Redirect based on role:
  - Client -> `/dashboard/client`
  - Lawyer -> `/dashboard/lawyer`
  - Admin -> `/dashboard/admin` (future)
- [ ] Form submission with session creation

### Step 4.2: Build Registration Pages
- [ ] `/register/client` - Client registration form
- [ ] `/register/lawyer` - Lawyer registration (admin-only or invite-only?)
- [ ] Form validation
- [ ] Email uniqueness check
- [ ] Password strength requirements
- [ ] Auto-login after registration

### Step 4.3: Add Password Reset Flow (Optional for Phase 1)
- [ ] Forgot password page
- [ ] Email sending (use service like SendGrid)
- [ ] Reset token generation and validation

---

## SECTION 5: CLIENT DASHBOARD

### Step 5.1: Create Client Dashboard Layout
- [ ] Route: `/dashboard/client/+layout.svelte`
- [ ] Protected route (require authentication + client role)
- [ ] Sidebar navigation or top navigation
- [ ] Logout button (top right)
- [ ] Display user name

### Step 5.2: Dashboard Home (/dashboard/client)
- [ ] Overview section:
  - Active cases count
  - Unpaid invoices total
  - Unread messages count
- [ ] Quick actions:
  - Upload new document
  - View invoices
  - Send message

### Step 5.3: Document Upload Section
- [ ] Drag-and-drop file upload area
- [ ] File type validation (PDF, DOC, DOCX, JPG, PNG)
- [ ] File size limit (10MB)
- [ ] Upload progress indicator
- [ ] Link document to case
- [ ] Save to local file system (`/uploads/case-{caseId}/{filename}`)
- [ ] Save metadata to documents table
- [ ] Display uploaded documents list
- [ ] Download/view functionality

### Step 5.4: Invoices Section
- [ ] Display invoices in table/chart format:
  - Invoice ID
  - Description
  - Amount
  - Due Date
  - Status (Paid, Unpaid, Partial)
  - Action buttons
- [ ] Filter by status (All, Paid, Unpaid)
- [ ] Sort by date/amount
- [ ] Payment button for unpaid invoices
- [ ] Partial payment option (custom amount input)
- [ ] Payment history

### Step 5.5: Private Messaging System (Right Sidebar)
- [ ] Collapsible message panel (right side)
- [ ] Message list (grouped by case or all messages)
- [ ] New message indicator badge
- [ ] Message thread display:
  - Sender name and timestamp
  - Message content
  - Attachment indicator/link
- [ ] Send message form
- [ ] Polling for new messages (every 5-10 seconds)
- [ ] Mark messages as read
- [ ] Notification system (browser notification API optional)

---

## SECTION 6: LAWYER DASHBOARD

### Step 6.1: Create Lawyer Dashboard Layout
- [ ] Route: `/dashboard/lawyer/+layout.svelte`
- [ ] Protected route (require authentication + lawyer role)
- [ ] Navigation: Clients, Messages, Documents, Cases
- [ ] Logout button (top right)

### Step 6.2: Clients Overview Page
- [ ] List all clients assigned to this lawyer
- [ ] Client cards with:
  - Name
  - Active cases count
  - Unread messages count
  - Last contact date
- [ ] Search/filter clients
- [ ] Click to view client details

### Step 6.3: Client Detail Page
- [ ] Display client information
- [ ] List all cases for this client
- [ ] View all documents uploaded by client
- [ ] Create new invoice for client
- [ ] Send message to client

### Step 6.4: Messages View (All Clients)
- [ ] Master inbox showing all messages from all clients
- [ ] Group by client or by case
- [ ] Unread messages highlighted
- [ ] Click to open message thread
- [ ] Reply to messages
- [ ] Attach documents from documents table
- [ ] Upload new document and attach to message
- [ ] Polling for new messages (every 5-10 seconds)

### Step 6.5: Documents View (All Cases)
- [ ] View all documents across all cases
- [ ] Filter by case or client
- [ ] Download documents
- [ ] Upload new documents to cases
- [ ] Delete documents (soft delete recommended)

### Step 6.6: Cases Management
- [ ] Create new case (assign to client)
- [ ] View all cases
- [ ] Update case status
- [ ] Close case
- [ ] Case details page with timeline

---

## SECTION 7: FILE SYSTEM STORAGE

### Step 7.1: Create Upload Directory Structure
- [ ] Create `/uploads/` directory in project root (add to .gitignore)
- [ ] Subdirectories: `/uploads/cases/{caseId}/`
- [ ] Create directory creation utility function

### Step 7.2: Build File Upload API
- [ ] Route: `/api/upload/+server.ts`
- [ ] Accept multipart form data
- [ ] Validate file type and size
- [ ] Sanitize filename (remove special characters)
- [ ] Generate unique filename (timestamp + original name)
- [ ] Save file to local file system
- [ ] Save metadata to documents table
- [ ] Return document ID and file info

### Step 7.3: Build File Download API
- [ ] Route: `/api/documents/[id]/download/+server.ts`
- [ ] Verify user has access to document (owns case or is lawyer)
- [ ] Stream file from local storage
- [ ] Set proper content-type headers
- [ ] Force download vs inline display option

### Step 7.4: Security & Validation
- [ ] Path traversal protection
- [ ] File type whitelist (PDF, DOC, DOCX, JPG, PNG, TXT)
- [ ] Virus scanning (optional, use ClamAV)
- [ ] Access control (only case participants can access)

---

## SECTION 8: STRIPE PAYMENT INTEGRATION

### Step 8.1: Set Up Stripe Account
- [ ] Create Stripe account (use test mode)
- [ ] Get API keys (publishable and secret)
- [ ] Add to .env file

### Step 8.2: Install Stripe SDK
- [ ] Install @stripe/stripe-js (client)
- [ ] Install stripe (server)
- [ ] Create Stripe client wrapper

### Step 8.3: Create Payment Intent API
- [ ] Route: `/api/invoices/[id]/payment/+server.ts`
- [ ] Verify user owns invoice
- [ ] Create Stripe PaymentIntent with invoice amount
- [ ] Return client secret

### Step 8.4: Build Payment Form Component
- [ ] Use Stripe Elements for card input
- [ ] Display invoice amount
- [ ] Handle full payment
- [ ] Handle partial payment (custom amount)
- [ ] Show payment processing state
- [ ] Confirm payment with Stripe
- [ ] Update invoice status on success

### Step 8.5: Set Up Stripe Webhooks
- [ ] Create webhook endpoint: `/api/webhooks/stripe/+server.ts`
- [ ] Verify webhook signature
- [ ] Handle events:
  - `payment_intent.succeeded`
  - `payment_intent.failed`
- [ ] Update invoice status in database
- [ ] Send confirmation email (optional)

### Step 8.6: Payment History & Receipts
- [ ] Display payment history on invoice
- [ ] Generate receipt (simple page or PDF)
- [ ] Email receipt to client (optional)

---

## SECTION 9: MESSAGING SYSTEM (POLLING)

### Step 9.1: Create Message API Endpoints
- [ ] POST `/api/messages/+server.ts` - Send new message
- [ ] GET `/api/messages?caseId={id}` - Get messages for case
- [ ] GET `/api/messages/unread` - Get unread count
- [ ] PATCH `/api/messages/[id]/read` - Mark as read

### Step 9.2: Build Message Components
- [ ] MessageList component (scrollable thread)
- [ ] MessageBubble component (sender styling)
- [ ] MessageInput component (textarea + send button)
- [ ] AttachmentPreview component

### Step 9.3: Implement Polling
- [ ] Create polling utility (setInterval)
- [ ] Poll every 5-10 seconds for new messages
- [ ] Update message list on new messages
- [ ] Update unread badge count
- [ ] Clear interval on component destroy

### Step 9.4: Notifications
- [ ] Show browser notification on new message (optional)
- [ ] Request notification permission
- [ ] Play sound on new message (optional)

---

## SECTION 10: TESTING & POLISH

### Step 10.1: Create Seed Data
- [ ] Script to create test users (1 lawyer, 3 clients)
- [ ] Create test cases
- [ ] Upload sample documents
- [ ] Create sample invoices
- [ ] Send sample messages

### Step 10.2: Cross-browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

### Step 10.3: Responsive Design Testing
- [ ] Mobile (320px - 480px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1280px+)
- [ ] Test navigation menu on mobile
- [ ] Test dashboards on tablet

### Step 10.4: Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators
- [ ] ARIA labels

### Step 10.5: Performance Optimization
- [ ] Optimize images
- [ ] Lazy load components
- [ ] Minimize bundle size
- [ ] Cache static assets
- [ ] Database query optimization

### Step 10.6: Security Audit
- [ ] SQL injection protection (Drizzle handles this)
- [ ] XSS protection
- [ ] CSRF protection (SvelteKit handles this)
- [ ] Rate limiting on APIs
- [ ] File upload validation
- [ ] Authentication checks on all protected routes

---

## SECTION 11: DEPLOYMENT PREPARATION

### Step 11.1: Environment Variables
- [ ] Document all required env vars
- [ ] Update .env.example
- [ ] Secure sensitive keys

### Step 11.2: Build & Test Production
- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Fix any build errors

### Step 11.3: Choose Hosting Provider
- [ ] Options: Vercel, Netlify, Cloudflare Pages, VPS
- [ ] Set up deployment pipeline
- [ ] Configure custom domain (if available)

### Step 11.4: Database Setup (Production)
- [ ] Create production Turso database
- [ ] Run migrations on production DB
- [ ] Back up database regularly

### Step 11.5: Monitoring & Logging
- [ ] Error tracking (Sentry optional)
- [ ] Analytics (Google Analytics optional)
- [ ] Server logs

---

## SUCCESS CRITERIA

### Phase One Complete When:
- [x] All public pages functional (home, services, about, contact)
- [x] Login/registration working with role-based routing
- [x] Client dashboard with document upload, invoices, messaging
- [x] Lawyer dashboard with client management, messages, documents
- [x] File upload/download working with local storage
- [x] Stripe payment processing functional
- [x] Messaging system with polling operational
- [x] Day/night mode toggle working
- [x] Responsive design on all devices
- [x] Medieval/fantasy themed with custom fonts and black/gold colors

---

## TIMELINE ESTIMATE

- **Section 1-2** (Foundation & Database): 2-3 days
- **Section 3-4** (Public Pages & Auth): 2-3 days
- **Section 5** (Client Dashboard): 3-4 days
- **Section 6** (Lawyer Dashboard): 3-4 days
- **Section 7** (File System): 1-2 days
- **Section 8** (Stripe): 2-3 days
- **Section 9** (Messaging): 2-3 days
- **Section 10-11** (Testing & Deploy): 2-3 days

**Total Estimate**: 17-25 days (3-5 weeks)

---

## NOTES & CONSIDERATIONS

### Security Best Practices
- Always validate user roles before showing sensitive data
- Sanitize all user inputs
- Use parameterized queries (Drizzle ORM handles this)
- Implement rate limiting on auth endpoints
- Store passwords with Argon2 (already configured)

### Future Enhancements (Phase Two)
- WebSocket real-time messaging
- Email notifications
- Advanced case management
- Document version control
- Calendar integration for court dates
- Mobile app
- Admin dashboard for user management
- Audit logs

### Design Consistency
- Use shadcn-svelte components throughout
- Stick to defined color palette
- Maintain font hierarchy (titles, body, quotes)
- Consistent spacing and sizing
- Medieval/fantasy icon theme

---

**This master plan provides a complete roadmap for Phase One implementation. Each section can be tackled sequentially, with checkboxes to track progress.**
