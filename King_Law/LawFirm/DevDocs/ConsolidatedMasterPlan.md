# King Law Firm - Consolidated Master Implementation Plan

## Project Overview
Complete law firm web application with client portal, lawyer dashboard, case management, document handling, messaging system, invoicing, and payment processing. Built from scratch with all Phase One and Phase Two features integrated.

**Tech Stack**: SvelteKit 5, shadcn-svelte, Turso DB (SQLite), Drizzle ORM, Stripe, Tailwind CSS 4, Font Awesome

**Design Theme**: Medieval/fantasy with custom fonts, black/gold color scheme, day/night mode

---

## SECTION 1: FOUNDATION & ENVIRONMENT SETUP

### 1.1: Project Initialization
- [ ] Create new SvelteKit project with TypeScript
- [ ] Initialize Git repository
- [ ] Create `.env.example` and `.env` files
- [ ] Set up `.gitignore` (include `/uploads/`, `.env`, `node_modules/`)
- [ ] Install core dependencies (SvelteKit, Vite, TypeScript)

### 1.2: Install shadcn-svelte
- [ ] Install shadcn-svelte CLI: `npx shadcn-svelte@latest init`
- [ ] Configure component directory structure
- [ ] Install core components:
  - Button, Card, Input, Select, Dialog, Textarea
  - Badge, Avatar, Dropdown Menu, Tabs
  - Table, Alert, Toast
- [ ] Verify component imports work correctly
- [ ] Configure theme provider

### 1.3: Configure Custom Fonts
- [ ] Download or link fonts:
  - **Headings**: Gaudy Bookletter 1911 (or similar medieval font)
  - **Body**: Junction Regular
  - **Accents**: League Script
- [ ] Add font files to `static/fonts/` (if self-hosting)
- [ ] Create `@font-face` declarations in `src/app.css`
- [ ] Configure Tailwind to use custom fonts:
  ```javascript
  fontFamily: {
    title: ['Gaudy Bookletter 1911', 'serif'],
    body: ['Junction Regular', 'sans-serif'],
    script: ['League Script', 'cursive']
  }
  ```
- [ ] Test font rendering on sample page

### 1.4: Set Up Color Theme
- [ ] Define color palette in `tailwind.config.js`:
  - **Gold**: `#D5BA7F` (primary)
  - **Black**: `#000000` (secondary)
  - **White**: `#FFFFFF` (background)
  - **Gray scales**: `#E5E5E5`, `#A0A0A0`, `#404040`
- [ ] Configure shadcn-svelte theme colors
- [ ] Create CSS variables for light/dark mode in `src/app.css`
- [ ] Test color combinations for WCAG AA accessibility

### 1.5: Install Font Awesome
- [ ] Install packages:
  ```bash
  npm install @fortawesome/fontawesome-svg-core
  npm install @fortawesome/free-solid-svg-icons
  npm install @fortawesome/free-regular-svg-icons
  ```
- [ ] Create `Icon.svelte` component wrapper
- [ ] Import commonly used icons
- [ ] Document medieval/fantasy themed icons for consistency

### 1.6: Implement Day/Night Mode
- [ ] Create theme store using Svelte 5 `$state` runes
- [ ] Add localStorage persistence
- [ ] Create theme toggle component with sun/moon icons
- [ ] Define dark mode color variants in CSS
- [ ] Add theme class to `<html>` element
- [ ] Test theme switching across all pages

---

## SECTION 2: DATABASE SETUP & SCHEMA

### 2.1: Install Database Dependencies
- [ ] Install Drizzle ORM: `npm install drizzle-orm`
- [ ] Install Drizzle Kit: `npm install -D drizzle-kit`
- [ ] Install Turso client: `npm install @libsql/client`
- [ ] Create Turso database (or local SQLite for dev)
- [ ] Add `DATABASE_URL` and `DATABASE_AUTH_TOKEN` to `.env`

### 2.2: Configure Drizzle
- [ ] Create `src/lib/server/db/index.ts` - database connection
- [ ] Create `src/lib/server/db/schema.ts` - table definitions
- [ ] Create `drizzle.config.ts` - Drizzle Kit configuration
- [ ] Add npm scripts:
  ```json
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
  ```

### 2.3: Define User Table
```sql
user:
- id (text, primary key)
- username (text, unique, not null)
- passwordHash (text, not null)
- role (enum: 'client' | 'lawyer' | 'admin', default 'client')
- email (text, unique, not null)
- firstName (text, not null)
- lastName (text, not null)
- phoneNumber (text, nullable)
- createdAt (timestamp, not null)
- updatedAt (timestamp, not null)
```
- [ ] Define schema in `schema.ts`
- [ ] Add indexes on email and username

### 2.4: Define Cases Table
```sql
cases:
- id (text, primary key)
- clientId (text, foreign key -> user.id, cascade delete)
- lawyerId (text, foreign key -> user.id, restrict delete)
- title (text, not null)
- description (text, nullable)
- status (enum: 'active' | 'pending' | 'closed', default 'pending')
- createdAt (timestamp, not null)
- updatedAt (timestamp, not null)
```
- [ ] Define schema with relations to user table
- [ ] Add indexes on clientId and lawyerId

### 2.5: Define Documents Table
```sql
documents:
- id (text, primary key)
- caseId (text, foreign key -> cases.id, set null on delete, NULLABLE)
- uploadedById (text, foreign key -> user.id, restrict delete)
- fileName (text, not null)
- filePath (text, not null)
- fileSize (integer, not null)
- mimeType (text, not null)
- uploadedAt (timestamp, not null)
```
- [ ] Define schema with nullable caseId (for uncategorized docs)
- [ ] Add relations
- [ ] Add index on caseId and uploadedById

### 2.6: Define Invoices Table
```sql
invoices:
- id (text, primary key)
- caseId (text, foreign key -> cases.id, cascade delete)
- amount (integer, not null) - amount in cents
- description (text, not null)
- status (enum: 'unpaid' | 'partial' | 'paid', default 'unpaid')
- dueDate (timestamp, not null)
- paidAmount (integer, not null, default 0) - amount paid in cents
- stripePaymentIntentId (text, nullable)
- createdAt (timestamp, not null)
- paidAt (timestamp, nullable)
```
- [ ] Define schema with Stripe integration fields
- [ ] Add index on caseId and status

### 2.7: Define Messages Table
```sql
messages:
- id (text, primary key)
- caseId (text, foreign key -> cases.id, set null on delete, NULLABLE)
- senderId (text, foreign key -> user.id, restrict delete)
- recipientId (text, foreign key -> user.id, restrict delete, NULLABLE)
- content (text, not null)
- attachmentDocumentId (text, foreign key -> documents.id, set null, nullable)
- createdAt (timestamp, not null)
- readAt (timestamp, nullable)
```
- [ ] Define schema with nullable caseId (for uncategorized messages)
- [ ] Add recipientId for direct messaging
- [ ] Add attachment support
- [ ] Add indexes on caseId, senderId, recipientId

### 2.8: Define Session Table
```sql
session:
- id (text, primary key)
- userId (text, foreign key -> user.id, cascade delete)
- expiresAt (timestamp, not null)
```
- [ ] Define schema for Lucia auth sessions
- [ ] Add index on userId

### 2.9: Generate and Push Schema
- [ ] Run `npm run db:generate` to create migrations
- [ ] Review generated SQL
- [ ] Run `npm run db:push` to apply to database
- [ ] Verify tables created correctly using Drizzle Studio

---

## SECTION 3: AUTHENTICATION SYSTEM

### 3.1: Install Lucia Auth
- [ ] Install Lucia: `npm install lucia`
- [ ] Install Argon2: `npm install @node-rs/argon2`
- [ ] Install Oslo utilities: `npm install @oslojs/encoding @oslojs/crypto`

### 3.2: Create Auth Utilities
- [ ] Create `src/lib/server/auth.ts`:
  - `lucia` instance configuration
  - `generateId()` function
  - `validateSession()` function
  - `createSession()` function
  - `invalidateSession()` function
  - Session cookie configuration
- [ ] Export session cookie name constant

### 3.3: Set Up Hooks
- [ ] Create `src/hooks.server.ts`:
  - Session validation on every request
  - Set `locals.user` and `locals.session`
  - Handle session refresh
  - Clean up expired sessions
- [ ] Add TypeScript types for `locals`

### 3.4: Create Type Definitions
- [ ] Create `src/app.d.ts`:
  - Extend `Locals` interface with `user` and `session`
  - Add custom user type with role
- [ ] Ensure type safety across app

### 3.5: Build Registration Page
- [ ] Create `/routes/register/+page.svelte`:
  - Form fields: username, email, password, confirmPassword, firstName, lastName, phoneNumber (optional)
  - Role selector (client by default)
  - Lawyer registration requires access code
  - Form validation (client-side)
  - Error display
- [ ] Create `/routes/register/+page.server.ts`:
  - Form action handler
  - Password validation (min 8 chars)
  - Email uniqueness check
  - Username uniqueness check
  - Hash password with Argon2
  - Create user in database
  - Create session
  - Redirect based on role
  - **Lawyer access code**: hardcoded `k1ngl4w`

### 3.6: Build Login Page
- [ ] Create `/routes/login/+page.svelte`:
  - Form fields: username, password
  - "Forgot Password" link (placeholder)
  - Error display
  - Link to registration
- [ ] Create `/routes/login/+page.server.ts`:
  - Form action handler
  - Verify username exists
  - Verify password with Argon2
  - Create session on success
  - Redirect based on role:
    - Client → `/dashboard/client`
    - Lawyer → `/dashboard/lawyer`
    - Admin → `/dashboard/admin`

### 3.7: Build Logout Handler
- [ ] Create `/routes/logout/+server.ts`:
  - Invalidate session
  - Clear session cookie
  - Redirect to home page

### 3.8: Create Auth Helper Utilities
- [ ] Create `src/lib/utils/auth-helpers.ts`:
  - `getDashboardRoute(user)` - returns correct dashboard URL
  - `requireAuth(locals)` - throws error if not authenticated
  - `requireRole(locals, role)` - throws error if wrong role

---

## SECTION 4: PUBLIC WEBSITE

### 4.1: Create Root Layout
- [ ] Create `/routes/+layout.svelte`:
  - Navigation bar component
  - Footer component
  - Theme toggle button
  - Slot for page content
  - Apply global styles
- [ ] Make navigation sticky/fixed on scroll
- [ ] Style with black/gold theme

### 4.2: Build Navigation Component
- [ ] Create `src/lib/components/Navigation.svelte`:
  - Logo/firm name (left side)
  - Navigation links:
    - Home
    - Services (dropdown menu)
    - About
    - Contact
    - Login/Dashboard (conditional)
  - Services dropdown with 4 practice areas:
    - Personal Injury & Civil Suits
    - Business & Intellectual Property
    - Family & Estate Law
    - Criminal Defense
  - Contact CTA button (gold styling)
  - Mobile hamburger menu
  - Responsive breakpoints

### 4.3: Build Home Page (/)
- [ ] Create `/routes/+page.svelte`

**Hero Section**:
- [ ] Large headline with Gaudy Bookletter font
- [ ] Compelling subheadline with Junction Regular
- [ ] Two CTA buttons: "Schedule Consultation" and "Learn More"
- [ ] Background image or gradient (medieval theme)
- [ ] Scroll down indicator

**About Section**:
- [ ] Firm introduction paragraph
- [ ] Mission statement
- [ ] Team photo or placeholder
- [ ] Pull quote with League Script font
- [ ] "Learn More" button

**Services Section**:
- [ ] 4 service cards in grid:
  - Personal Injury icon + title + description
  - Business/IP icon + title + description
  - Family/Estate icon + title + description
  - Criminal Defense icon + title + description
- [ ] Medieval-themed icons from Font Awesome
- [ ] "Learn More" links to service pages

**Testimonials/Trust Section** (optional):
- [ ] Client testimonials
- [ ] Awards or certifications
- [ ] Years of experience badge

**Contact Section**:
- [ ] Contact form (name, email, phone, message)
- [ ] Office address display
- [ ] Map placeholder or embedded map
- [ ] Phone number with click-to-call
- [ ] Email with mailto link
- [ ] Form submission handler (save to DB or email)

### 4.4: Build Service Pages
- [ ] Create `/routes/services/[slug]/+page.svelte` (dynamic route)
- [ ] Create `/routes/services/[slug]/+page.server.ts`:
  - Load service data based on slug
  - 404 if slug doesn't match

**Create 4 service pages**:
- [ ] `/services/personal-injury`:
  - Hero with practice area name
  - Detailed description
  - "What We Handle" list (car accidents, slip & fall, etc.)
  - "Why Choose Us" section
  - Contact CTA
- [ ] `/services/business-intellectual-property`:
  - Contracts, trademarks, patents, business formation
- [ ] `/services/family-estate-law`:
  - Divorce, custody, wills, trusts, probate
- [ ] `/services/criminal-defense`:
  - DUI, misdemeanors, felonies, expungement

### 4.5: Build About Page (optional)
- [ ] Create `/routes/about/+page.svelte`:
  - Firm history
  - Attorney bios with photos
  - Values and approach
  - Credentials and bar admissions

### 4.6: Build Contact Page
- [ ] Create `/routes/contact/+page.svelte`:
  - Full contact form
  - Map integration (Google Maps embed or Mapbox)
  - Office hours
  - Directions
  - Alternative contact methods

### 4.7: Build Footer Component
- [ ] Create `src/lib/components/Footer.svelte`:
  - Firm name and copyright
  - Quick links (Services, About, Contact, Privacy)
  - Social media icons (optional)
  - Office address and phone
  - Legal disclaimer

---

## SECTION 5: CLIENT DASHBOARD

### 5.1: Create Client Dashboard Layout
- [ ] Create `/routes/dashboard/client/+layout.svelte`:
  - Top navigation bar:
    - Firm logo/name
    - User name display
    - Logout button
    - Theme toggle
  - Main content area
  - ChatSlider component (right side)
- [ ] Create `/routes/dashboard/client/+layout.server.ts`:
  - Require authentication
  - Require client role
  - Load user data

### 5.2: Build Dashboard Home
- [ ] Create `/routes/dashboard/client/+page.svelte`
- [ ] Create `/routes/dashboard/client/+page.server.ts`:
  - Load user cases
  - Load invoices
  - Load documents
  - Load messages
  - Load default lawyer (if no cases)

**Overview Section**:
- [ ] Stats cards:
  - Active cases count
  - Total unpaid invoices
  - Unread messages count
  - Documents uploaded count
- [ ] Quick action buttons:
  - "Message Us" (opens chat)
  - "Upload Document"
  - "View Invoices"

**Your Cases Section**:
- [ ] Display cases as clickable cards:
  - Case title and status badge
  - Assigned lawyer name
  - Last updated date
  - Unread message indicator
  - Click to open case detail
- [ ] Empty state: "No active cases. Contact us to get started."
- [ ] "Message Us" button for clients with no cases

**Recent Documents Section**:
- [ ] List recent uploads (5 most recent)
- [ ] Show: filename, case, upload date
- [ ] Download buttons
- [ ] "View All" link

**Invoices Section**:
- [ ] Display invoices table:
  - Description
  - Amount
  - Due date
  - Status (Paid/Unpaid/Partial)
  - Action buttons
- [ ] Filter by status
- [ ] Pay button for unpaid invoices
- [ ] "View All" link

### 5.3: Build Case Detail Page (Client)
- [ ] Create `/routes/dashboard/client/case/[id]/+page.svelte`
- [ ] Create `/routes/dashboard/client/case/[id]/+page.server.ts`:
  - Load case by ID
  - Verify client owns this case
  - Load case documents
  - Load case invoices
  - Load case messages
  - Load assigned lawyer info

**Page Layout**:
- [ ] Case header:
  - Title and status badge
  - Assigned lawyer info
  - Created/updated dates
- [ ] Tabs or sections:
  - **Overview**: Case description
  - **Documents**: List with upload/download
  - **Invoices**: List with payment options
  - **Messages**: Thread view with reply
- [ ] Back button to dashboard

**Documents Section**:
- [ ] List all case documents
- [ ] Download buttons
- [ ] Upload new document button
- [ ] File size and upload date

**Invoices Section**:
- [ ] List case invoices
- [ ] Payment button (if unpaid)
- [ ] Payment history

**Messages Section**:
- [ ] Display message thread
- [ ] Message input at bottom
- [ ] Auto-set caseId to current case
- [ ] Show attachments inline
- [ ] Real-time updates via polling

### 5.4: Build Document Upload Feature
- [ ] Create document upload modal/section:
  - Drag-and-drop area
  - File type validation (PDF, DOC, DOCX, JPG, PNG, TXT)
  - File size limit (10MB)
  - Progress indicator
  - Link to case (if multiple cases, show selector)
- [ ] Upload to `/api/documents/upload`
- [ ] Display success/error messages

### 5.5: Build Payment Flow
- [ ] Create payment modal:
  - Display invoice details
  - Amount selector (full or partial payment)
  - Stripe card element
  - Payment button
  - Processing state
- [ ] Integrate with Stripe (Section 8)
- [ ] Show payment confirmation
- [ ] Update invoice status

---

## SECTION 6: LAWYER DASHBOARD

### 6.1: Create Lawyer Dashboard Layout
- [ ] Create `/routes/dashboard/lawyer/+layout.svelte`:
  - Top navigation bar
  - Logout button
  - Theme toggle
  - ChatSlider component
- [ ] Create `/routes/dashboard/lawyer/+layout.server.ts`:
  - Require authentication
  - Require lawyer or admin role
  - Load lawyer data

### 6.2: Build Dashboard Home
- [ ] Create `/routes/dashboard/lawyer/+page.svelte`
- [ ] Create `/routes/dashboard/lawyer/+page.server.ts`:
  - Load all lawyer's cases (with client info)
  - Load all documents
  - Load all invoices
  - Load all messages
  - Load unique clients list
  - Load uncategorized messages (grouped by client)

**Stats Overview**:
- [ ] Cards displaying:
  - Total cases
  - Active cases
  - Total documents
  - Total revenue (paid invoices)
  - Unread messages count

**Cases Section**:
- [ ] Display cases as cards/rows:
  - Case title and status
  - Client name and email
  - Created/updated dates
  - Click to open case detail
- [ ] "New Case" button (opens modal)
- [ ] Filter by status (All/Active/Pending/Closed)
- [ ] Search by client name or case title

**Uncategorized Messages Section**:
- [ ] Display threads from clients without cases:
  - Client name and email
  - Message count and preview
  - Unread badge
  - "View & Reply" button
  - "Create Case" button
- [ ] Highlighted/pulsing indicator if new
- [ ] Only show if uncategorized messages exist

**Clients Section**:
- [ ] Display client cards:
  - Client name
  - Email
  - Number of cases
  - Click to view client profile
- [ ] Search/filter clients

**Recent Documents Section**:
- [ ] List recent uploads (5 most recent)
- [ ] Show: filename, case, client, date
- [ ] Download buttons
- [ ] "Upload" button

**Invoices Section**:
- [ ] Display invoices table:
  - Description, case, client
  - Amount and status
  - Due date
  - Actions
- [ ] "Create Invoice" button
- [ ] Filter by status

**Recent Messages Section**:
- [ ] Display recent messages (10 most recent)
- [ ] Show: sender, case, preview, date
- [ ] Unread highlighting
- [ ] Click to open in chat

### 6.3: Build Client Profile Page
- [ ] Create `/routes/dashboard/lawyer/client/[id]/+page.svelte`
- [ ] Create `/routes/dashboard/lawyer/client/[id]/+page.server.ts`:
  - Load client info by ID
  - Load all client's cases
  - Load client's documents
  - Load client's invoices
  - Verify lawyer has access to this client

**Page Layout**:
- [ ] Client info header:
  - Name, email, phone
  - Join date
- [ ] Sections:
  - **Cases**: All cases for this client (clickable)
  - **Documents**: All documents across cases
  - **Invoices**: All invoices
  - **Messages**: Message history
- [ ] "Create New Case" button
- [ ] "Send Message" button (opens chat)

### 6.4: Build Case Detail Page (Lawyer)
- [ ] Create `/routes/dashboard/lawyer/case/[id]/+page.svelte`
- [ ] Create `/routes/dashboard/lawyer/case/[id]/+page.server.ts`:
  - Load case by ID
  - Verify lawyer owns this case
  - Load client info
  - Load case documents
  - Load case invoices
  - Load case messages

**Page Layout** (similar to client view with additional controls):
- [ ] Case header with edit controls:
  - Title (editable)
  - Status selector (Active/Pending/Closed)
  - Client info display
  - Delete case button (with confirmation)
- [ ] Tabs or sections:
  - **Overview**: Case description (editable)
  - **Documents**: List with upload/download/delete
  - **Invoices**: List with create/edit
  - **Messages**: Thread view with reply
- [ ] Action buttons:
  - "Create Invoice"
  - "Upload Document"
  - "Update Case Status"

### 6.5: Build Case Creation Modal
- [ ] Create case creation modal component:
  - Client selector (dropdown of all clients)
  - Case title input
  - Description textarea
  - Status selector (Active/Pending)
  - Submit button
- [ ] POST to `/api/cases`
- [ ] Redirect to new case detail page
- [ ] Option to create from uncategorized thread

### 6.6: Build Invoice Creation Modal
- [ ] Create invoice modal component:
  - Case selector (dropdown)
  - Amount input (in dollars)
  - Description textarea
  - Due date picker
  - Submit button
- [ ] POST to `/api/invoices`
- [ ] Refresh data on success

### 6.7: Build Uncategorized Thread Modal
- [ ] Create thread view modal:
  - Display all messages in thread
  - Client info at top
  - Reply input at bottom
  - "Create Case from Thread" section:
    - Case title input
    - Case description textarea
    - Submit button
- [ ] POST to `/api/cases/from-uncategorized`
- [ ] Moves all thread messages to new case

---

## SECTION 7: MESSAGING SYSTEM

### 7.1: Create Message API Endpoints
- [ ] Create `/routes/api/messages/+server.ts`:

**GET Handler**:
- [ ] Accept query params: `caseId` OR `uncategorized=true&clientId={id}`
- [ ] Verify user has access to case or is lawyer for client
- [ ] Join with user table to get sender info
- [ ] Join with documents table to get attachment info
- [ ] Return messages array with sender and attachment data
- [ ] Order by createdAt ascending

**POST Handler**:
- [ ] Accept body: `{ caseId?, recipientId?, content, attachmentDocumentId? }`
- [ ] Validate content not empty
- [ ] For case messages: verify sender has access to case
- [ ] For uncategorized: require recipientId for clients, allow null for lawyers
- [ ] Auto-assign recipientId for case messages (client→lawyer or lawyer→client)
- [ ] Create message record
- [ ] Return created message with sender info

### 7.2: Create Message Mark-as-Read Endpoint
- [ ] Create `/routes/api/messages/mark-read/+server.ts`:
  - Accept body: `{ caseId }` or `{ messageId }`
  - Update readAt timestamp for unread messages
  - Verify user has access

### 7.3: Create Message Reassign Endpoint
- [ ] Create `/routes/api/messages/reassign/+server.ts`:
  - Accept body: `{ messageIds[], newCaseId }`
  - Verify lawyer owns target case
  - Bulk update messages to new caseId
  - Return count of updated messages

### 7.4: Build ChatSlider Component
- [ ] Create `src/lib/components/ChatSlider.svelte`:

**Component Props**:
- [ ] `cases` - array of user's cases
- [ ] `currentUserId` - logged in user ID
- [ ] `userRole` - 'client' or 'lawyer'
- [ ] `defaultRecipientId` - lawyer ID for uncategorized messages (optional)
- [ ] `externalOpen` - bindable state for parent control

**Component State**:
- [ ] `isOpen` - chat panel visibility
- [ ] `selectedCaseId` - currently selected case (or null for uncategorized)
- [ ] `messages` - current message list
- [ ] `newMessage` - input field value
- [ ] `isSending` - loading state
- [ ] `isLoading` - fetching messages state
- [ ] `unreadCounts` - per-case unread counts
- [ ] `totalUnread` - total across all cases
- [ ] `attachmentFile` - selected file for upload

**UI Elements**:
- [ ] Toggle button (fixed right side, below navbar)
  - Chat icon when closed
  - X icon when open
  - Unread badge if messages exist
- [ ] Sliding panel (slides in from right)
  - Header with title and close button
  - Case selector dropdown (if multiple cases)
  - Message list (scrollable)
  - Message input area with send button
  - Attachment button
- [ ] Backdrop overlay (mobile only)

**Message Display**:
- [ ] Sender/recipient bubbles (different colors)
- [ ] Timestamp formatting
- [ ] Attachment display with download link
- [ ] Auto-scroll to bottom on new messages
- [ ] Unread indicator

**Functionality**:
- [ ] Load messages on open
- [ ] Poll for new messages every 5 seconds
- [ ] Mark messages as read when viewed
- [ ] Send message on Enter key (Shift+Enter for newline)
- [ ] Support file attachments
- [ ] Handle uncategorized messages (no case selected)

### 7.5: Implement Message Polling
- [ ] Create polling utility:
  - `setInterval` to fetch unread count every 5 seconds
  - Update unread badge
  - Fetch new messages if chat is open
  - Clear interval on component destroy
- [ ] Show notification indicator on new messages
- [ ] Update message list reactively

### 7.6: Create Message Attachment Component
- [ ] Create `src/lib/components/MessageAttachment.svelte`:
  - Display file icon (based on mime type)
  - Show filename
  - Download button
  - File size display
  - Style to fit in message bubble

---

## SECTION 8: FILE SYSTEM & DOCUMENT MANAGEMENT

### 8.1: Create Upload Directory Structure
- [ ] Create `/uploads/` directory in project root
- [ ] Add to `.gitignore`
- [ ] Create subdirectories: `/uploads/cases/{caseId}/`
- [ ] Create directory creation utility function

### 8.2: Build File Upload API
- [ ] Create `/routes/api/documents/upload/+server.ts`:

**POST Handler**:
- [ ] Accept multipart form data (file + caseId)
- [ ] Verify user is authenticated
- [ ] Validate file type (PDF, DOC, DOCX, JPG, PNG, TXT)
- [ ] Validate file size (max 10MB)
- [ ] Sanitize filename (remove special chars, prevent path traversal)
- [ ] Generate unique filename: `{timestamp}-{sanitized-name}`
- [ ] Create case directory if doesn't exist
- [ ] Save file to `/uploads/cases/{caseId}/`
- [ ] Create document record in database
- [ ] Return document ID and metadata

**Security**:
- [ ] Path traversal protection
- [ ] File type whitelist (mime type check)
- [ ] File size limits
- [ ] Access control (only case participants)

### 8.3: Build File Download/View API
- [ ] Create `/routes/api/documents/[id]/+server.ts`:

**GET Handler**:
- [ ] Load document by ID
- [ ] Verify user has access (owns case or is assigned lawyer)
- [ ] Check if file exists on filesystem
- [ ] Stream file with proper headers
- [ ] Set Content-Type based on mime type
- [ ] Set Content-Disposition (attachment for download)
- [ ] Return 404 if file missing

### 8.4: Build Document Delete Endpoint
- [ ] Create `/routes/api/documents/[id]/delete/+server.ts`:
  - Verify lawyer owns document's case
  - Delete file from filesystem
  - Delete database record (or soft delete)
  - Return success/error

### 8.5: Build Document Reassign Endpoint
- [ ] Create `/routes/api/documents/reassign/+server.ts`:
  - Accept body: `{ documentIds[], newCaseId }`
  - Verify lawyer owns both cases
  - Move files to new case directory
  - Update database records
  - Return count of updated documents

---

## SECTION 9: INVOICING & PAYMENT SYSTEM

### 9.1: Set Up Stripe Account
- [ ] Create Stripe account (use test mode)
- [ ] Get API keys (publishable and secret)
- [ ] Add to `.env`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### 9.2: Install Stripe SDK
- [ ] Install server SDK: `npm install stripe`
- [ ] Install client SDK: `npm install @stripe/stripe-js`
- [ ] Create Stripe client wrapper in `src/lib/server/stripe.ts`

### 9.3: Create Invoice API Endpoints
- [ ] Create `/routes/api/invoices/+server.ts`:

**POST Handler (Create Invoice)**:
- [ ] Accept: `{ caseId, amount, description, dueDate }`
- [ ] Verify lawyer owns case
- [ ] Convert amount from dollars to cents
- [ ] Create invoice record
- [ ] Return invoice object

**GET Handler (List Invoices)**:
- [ ] Query based on user role:
  - Client: invoices for their cases
  - Lawyer: invoices for their cases
- [ ] Return invoices array

### 9.4: Create Payment Intent Endpoint
- [ ] Create `/routes/api/invoices/[id]/payment/+server.ts`:

**POST Handler**:
- [ ] Load invoice by ID
- [ ] Verify user owns invoice (client of case)
- [ ] Accept optional `amount` for partial payment
- [ ] Create Stripe PaymentIntent:
  ```typescript
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: { invoiceId, userId }
  });
  ```
- [ ] Return client secret for frontend

### 9.5: Build Payment Form Component
- [ ] Create `src/lib/components/PaymentForm.svelte`:
  - Display invoice details
  - Full payment or partial payment toggle
  - Custom amount input (for partial)
  - Stripe Card Element
  - Submit button with loading state
  - Error display
  - Success confirmation

**Implementation**:
- [ ] Load Stripe.js
- [ ] Create Payment Element
- [ ] Handle form submission:
  - Create PaymentIntent (get client secret)
  - Confirm payment with Stripe
  - Update invoice on success
  - Show confirmation message

### 9.6: Set Up Stripe Webhooks
- [ ] Create `/routes/api/webhooks/stripe/+server.ts`:

**POST Handler**:
- [ ] Verify webhook signature
- [ ] Handle events:
  - `payment_intent.succeeded`:
    - Extract metadata (invoiceId)
    - Update invoice paidAmount
    - Update status (paid/partial)
    - Set paidAt timestamp
  - `payment_intent.failed`:
    - Log failure
    - Optionally notify user
- [ ] Return 200 status

**Setup**:
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`

### 9.7: Update Invoice After Payment
- [ ] Create `/routes/api/invoices/[id]/update-payment/+server.ts`:
  - Called by webhook
  - Update paidAmount
  - Recalculate status
  - Set paidAt if fully paid

### 9.8: Build Payment History Display
- [ ] Show payment history on invoice:
  - Payment date
  - Amount paid
  - Remaining balance
- [ ] Generate receipt (simple page or PDF)
- [ ] Email receipt to client (optional with SendGrid)

---

## SECTION 10: API ENDPOINTS SUMMARY

### 10.1: Case Management APIs
- [ ] `POST /api/cases` - Create new case
- [ ] `GET /api/cases` - List cases (filtered by user role)
- [ ] `GET /api/cases/[id]` - Get case details
- [ ] `PATCH /api/cases/[id]` - Update case (title, description, status)
- [ ] `DELETE /api/cases/[id]` - Delete case (lawyer only)
- [ ] `POST /api/cases/from-uncategorized` - Create case from thread

### 10.2: Message APIs
- [ ] `POST /api/messages` - Send message
- [ ] `GET /api/messages` - Get messages (by case or uncategorized)
- [ ] `POST /api/messages/mark-read` - Mark as read
- [ ] `POST /api/messages/reassign` - Move to different case

### 10.3: Document APIs
- [ ] `POST /api/documents/upload` - Upload document
- [ ] `GET /api/documents/[id]` - Download document
- [ ] `DELETE /api/documents/[id]` - Delete document
- [ ] `POST /api/documents/reassign` - Move to different case

### 10.4: Invoice APIs
- [ ] `POST /api/invoices` - Create invoice
- [ ] `GET /api/invoices` - List invoices
- [ ] `GET /api/invoices/[id]` - Get invoice details
- [ ] `POST /api/invoices/[id]/payment` - Create payment intent
- [ ] `POST /api/invoices/[id]/update-payment` - Update after payment

### 10.5: Webhook Endpoints
- [ ] `POST /api/webhooks/stripe` - Stripe payment events

---

## SECTION 11: TESTING & QUALITY ASSURANCE

### 11.1: Create Seed Data Script
- [ ] Create `scripts/seed-database.js`:
  - Create test lawyer: Ben King (benking / kinglaw123)
  - Create 3 test clients
  - Create sample cases
  - Upload sample documents
  - Create sample invoices
  - Send sample messages
- [ ] Run script: `node scripts/seed-database.js`

### 11.2: Manual Testing Checklist

**Authentication**:
- [ ] Register new client
- [ ] Register new lawyer (with access code)
- [ ] Login as client
- [ ] Login as lawyer
- [ ] Logout
- [ ] Session persistence across page refresh

**Client Dashboard**:
- [ ] View cases
- [ ] Open case detail
- [ ] Upload document to case
- [ ] View and download documents
- [ ] Send message to lawyer
- [ ] View invoices
- [ ] Pay invoice (test mode)
- [ ] View payment confirmation

**Lawyer Dashboard**:
- [ ] View all cases
- [ ] Create new case
- [ ] View client profile
- [ ] Create invoice for case
- [ ] Upload document to case
- [ ] View uncategorized messages
- [ ] Reply to uncategorized thread
- [ ] Create case from uncategorized thread

**Messaging**:
- [ ] Send message as client
- [ ] Receive message as lawyer
- [ ] Reply as lawyer
- [ ] Attach document to message
- [ ] Unread badge updates
- [ ] Mark messages as read
- [ ] Polling for new messages

### 11.3: Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

### 11.4: Responsive Design Testing
- [ ] Mobile (320px - 480px)
  - Navigation menu
  - Forms
  - Chat slider
  - Dashboard layouts
- [ ] Tablet (768px - 1024px)
  - Dashboard layouts
  - Case details
- [ ] Desktop (1280px+)
  - All features

### 11.5: Accessibility Testing
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader compatibility
- [ ] Color contrast (WCAG AA standards)
- [ ] Focus indicators visible
- [ ] ARIA labels on interactive elements
- [ ] Alt text on images
- [ ] Form labels and error messages

### 11.6: Performance Optimization
- [ ] Lazy load heavy components
- [ ] Optimize images (compress, WebP)
- [ ] Minimize bundle size (analyze with Vite)
- [ ] Database query optimization (indexes, joins)
- [ ] Cache static assets
- [ ] Implement pagination for large lists

### 11.7: Security Audit
- [ ] SQL injection protection (Drizzle ORM handles)
- [ ] XSS protection (Svelte escapes by default)
- [ ] CSRF protection (SvelteKit handles)
- [ ] Rate limiting on auth endpoints
- [ ] File upload validation (type, size)
- [ ] Authentication checks on all protected routes
- [ ] Role-based access control enforcement
- [ ] Secure session management
- [ ] Environment variables not exposed to client

---

## SECTION 12: DEPLOYMENT

### 12.1: Environment Variables Documentation
- [ ] Create comprehensive `.env.example`:
  ```
  DATABASE_URL=
  DATABASE_AUTH_TOKEN=
  STRIPE_SECRET_KEY=
  PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_WEBHOOK_SECRET=
  SESSION_SECRET=
  ```
- [ ] Document each variable in README

### 12.2: Production Build
- [ ] Run `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Fix any build errors or warnings
- [ ] Verify all features work in production mode

### 12.3: Database Migration
- [ ] Create production Turso database
- [ ] Add production DATABASE_URL and TOKEN to hosting env
- [ ] Run migrations: `npm run db:push` (or use Drizzle migrations)
- [ ] Verify tables created correctly

### 12.4: Choose Hosting Provider
Options:
- [ ] **Vercel** (recommended for SvelteKit)
- [ ] Netlify
- [ ] Cloudflare Pages
- [ ] VPS (DigitalOcean, Linode)

**Vercel Deployment**:
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Link project: `vercel link`
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy: `vercel --prod`
- [ ] Configure custom domain (optional)

### 12.5: File Upload Storage
- [ ] For production, consider:
  - S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2)
  - Update file upload/download to use cloud storage
- [ ] OR: Ensure `/uploads/` directory persists on server

### 12.6: Stripe Production Setup
- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure webhook in Stripe dashboard
- [ ] Test live payments (small amounts)

### 12.7: Monitoring & Logging
- [ ] Error tracking: Sentry (optional)
- [ ] Analytics: Google Analytics, Plausible (optional)
- [ ] Server logs configuration
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Database backups (automated daily)

### 12.8: SSL Certificate
- [ ] Ensure HTTPS enabled (Vercel/Netlify auto-provision)
- [ ] Force HTTPS redirects
- [ ] Verify SSL certificate valid

### 12.9: Email Notifications (Optional)
- [ ] Set up SendGrid or similar
- [ ] Email templates:
  - New case notification (to client)
  - Invoice created (to client)
  - Payment confirmation (to client and lawyer)
  - New message notification
- [ ] Configure SMTP settings

---

## SUCCESS CRITERIA

### Application Complete When:
- [x] **Public Website**:
  - Home, Services, About, Contact pages live
  - Navigation and footer functional
  - Responsive on all devices
  - Day/night mode working

- [x] **Authentication**:
  - Registration for clients and lawyers
  - Login with role-based routing
  - Session management
  - Logout functionality

- [x] **Client Portal**:
  - Dashboard with stats and overview
  - Case list and detail pages
  - Document upload and download
  - Invoice viewing and payment
  - Messaging with lawyer
  - Chat slider functional

- [x] **Lawyer Portal**:
  - Dashboard with stats and overview
  - Case management (create, edit, view)
  - Client profiles
  - Uncategorized message handling
  - Create case from uncategorized thread
  - Invoice creation
  - Document management
  - Messaging with clients

- [x] **Messaging System**:
  - Real-time polling for new messages
  - Case-based and uncategorized messaging
  - Message attachments
  - Unread indicators
  - Mark as read functionality

- [x] **Document Management**:
  - Upload to cases or uncategorized
  - Download with access control
  - File type and size validation
  - Secure storage
  - Reassign to different cases

- [x] **Invoicing & Payments**:
  - Lawyers create invoices
  - Clients view invoices
  - Stripe integration for payments
  - Partial payment support
  - Payment confirmations
  - Webhook handling

- [x] **Security & Performance**:
  - All routes protected with auth
  - Role-based access control
  - File upload security
  - HTTPS enabled
  - Performance optimized

---

## TIMELINE ESTIMATE

**Foundation** (Sections 1-3): 3-4 days
- Setup, theming, database, authentication

**Public Website** (Section 4): 2-3 days
- Home, services, about, contact pages

**Client Dashboard** (Section 5): 4-5 days
- Dashboard, case details, documents, invoices, messaging

**Lawyer Dashboard** (Section 6): 5-6 days
- Dashboard, case management, client profiles, uncategorized handling

**Messaging System** (Section 7): 3-4 days
- Chat slider, polling, message APIs

**File System** (Section 8): 2-3 days
- Upload, download, storage

**Payment System** (Section 9): 3-4 days
- Stripe integration, webhooks, payment flow

**APIs & Integration** (Section 10): 2 days
- Finalize all endpoints, testing

**Testing & QA** (Section 11): 3-4 days
- Manual testing, cross-browser, accessibility

**Deployment** (Section 12): 2-3 days
- Production setup, monitoring

**Total Estimate**: 29-39 days (6-8 weeks)

---

## NOTES & BEST PRACTICES

### Development Workflow
1. Work through sections sequentially
2. Test each feature before moving to next
3. Commit frequently with descriptive messages
4. Keep components small and focused
5. Use TypeScript for type safety
6. Follow SvelteKit conventions (file-based routing)

### Code Organization
- `/routes` - Pages and API endpoints
- `/lib/components` - Reusable UI components
- `/lib/server` - Server-only code (auth, db, utils)
- `/lib/utils` - Shared utilities
- `static/` - Static assets (fonts, images)

### Database Best Practices
- Use transactions for multi-step operations
- Add indexes on frequently queried columns
- Validate data before insertion
- Use Drizzle's type-safe queries
- Regular backups in production

### Security Checklist
- ✅ Never expose secrets to client
- ✅ Validate all user inputs
- ✅ Sanitize filenames and paths
- ✅ Use parameterized queries
- ✅ Implement rate limiting
- ✅ Secure session cookies
- ✅ Hash passwords with Argon2
- ✅ Verify user permissions on every action

### UI/UX Guidelines
- Consistent spacing and sizing
- Clear error messages
- Loading states for async operations
- Confirmation dialogs for destructive actions
- Keyboard shortcuts where appropriate
- Mobile-first responsive design
- Accessible to screen readers

---

## FUTURE ENHANCEMENTS (Post-Launch)

### Phase Three Ideas
- [ ] WebSocket real-time messaging (replace polling)
- [ ] Email notifications (SendGrid integration)
- [ ] Calendar integration for court dates and appointments
- [ ] Advanced case management (tasks, deadlines, reminders)
- [ ] Document version control
- [ ] Electronic signature support (DocuSign integration)
- [ ] Mobile app (React Native or Flutter)
- [ ] Admin dashboard for user management
- [ ] Audit logs for compliance
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Client satisfaction surveys
- [ ] Appointment scheduling system
- [ ] Video conferencing integration (Zoom, Meet)
- [ ] Knowledge base / FAQs for clients
- [ ] Automated invoice reminders
- [ ] Bulk operations for lawyers
- [ ] Export data (PDF reports, CSV)

---

**This consolidated master plan provides a complete, production-ready roadmap for building the King Law Firm application from scratch with all features from Phase One and Phase Two integrated.**
