# King Law Firm - Work Breakdown Structure (WBS)

## 1. Project Overview
King Law Firm website with role-based authentication, dashboards, document management, and messaging system.

---

## 2. Technology Stack

### 2.1 Frontend Framework
- **2.1.1** SvelteKit 5 (Full-stack framework)
- **2.1.2** Svelte 5 (Reactive component framework)

### 2.2 Styling & UI
- **2.2.1** Tailwind CSS 4 (Utility-first CSS)
- **2.2.2** Custom color palette (Gold, Black, White, Grey)
- **2.2.3** Font Awesome icons
- **2.2.4** Custom fonts
  - **2.2.4.1** Junction Regular (body text)
  - **2.2.4.2** Goudy Bookletter 1911 (titles)
  - **2.2.4.3** League Script (quotes/special text)

### 2.3 Database & ORM
- **2.3.1** Turso (LibSQL/SQLite for production)
- **2.3.2** Drizzle ORM (Type-safe database client)
- **2.3.3** Drizzle Kit (Schema migrations)

### 2.4 Authentication & Security
- **2.4.1** Custom session-based authentication
- **2.4.2** Argon2 password hashing
- **2.4.3** SHA-256 session token hashing
- **2.4.4** HTTP-only cookies for session storage

### 2.5 Development Tools
- **2.5.1** Vite (Build tool & dev server)
- **2.5.2** TypeScript (Type safety)
- **2.5.3** ESLint (Code linting)
- **2.5.4** Prettier (Code formatting)

---

## 3. Database Schema

### 3.1 User Table
- **3.1.1** `id` (TEXT, Primary Key)
- **3.1.2** `username` (TEXT, Unique, Not Null)
- **3.1.3** `email` (TEXT, Unique, Not Null)
- **3.1.4** `passwordHash` (TEXT, Not Null)
- **3.1.5** `firstName` (TEXT, Not Null)
- **3.1.6** `lastName` (TEXT, Not Null)
- **3.1.7** `phoneNumber` (TEXT, Nullable)
- **3.1.8** `role` (TEXT: 'client' | 'lawyer' | 'admin', Not Null)
- **3.1.9** `createdAt` (INTEGER, Timestamp, Not Null)

### 3.2 Session Table
- **3.2.1** `id` (TEXT, Primary Key, SHA-256 hash)
- **3.2.2** `userId` (TEXT, Foreign Key → user.id)
- **3.2.3** `expiresAt` (INTEGER, Timestamp, Not Null)

### 3.3 Case Table
- **3.3.1** `id` (TEXT, Primary Key)
- **3.3.2** `title` (TEXT, Not Null)
- **3.3.3** `description` (TEXT, Nullable)
- **3.3.4** `status` (TEXT: 'active' | 'pending' | 'closed', Not Null)
- **3.3.5** `clientId` (TEXT, Foreign Key → user.id)
- **3.3.6** `lawyerId` (TEXT, Foreign Key → user.id)
- **3.3.7** `createdAt` (INTEGER, Timestamp, Not Null)
- **3.3.8** `updatedAt` (INTEGER, Timestamp, Not Null)

### 3.4 Document Table
- **3.4.1** `id` (TEXT, Primary Key)
- **3.4.2** `caseId` (TEXT, Foreign Key → case.id)
- **3.4.3** `uploadedBy` (TEXT, Foreign Key → user.id)
- **3.4.4** `fileName` (TEXT, Not Null)
- **3.4.5** `filePath` (TEXT, Not Null)
- **3.4.6** `fileSize` (INTEGER, Not Null)
- **3.4.7** `mimeType` (TEXT, Not Null)
- **3.4.8** `uploadedAt` (INTEGER, Timestamp, Not Null)

### 3.5 Invoice Table
- **3.5.1** `id` (TEXT, Primary Key)
- **3.5.2** `caseId` (TEXT, Foreign Key → case.id)
- **3.5.3** `amount` (REAL, Not Null)
- **3.5.4** `status` (TEXT: 'paid' | 'pending' | 'overdue', Not Null)
- **3.5.5** `dueDate` (INTEGER, Timestamp, Not Null)
- **3.5.6** `paidAt` (INTEGER, Timestamp, Nullable)
- **3.5.7** `createdAt` (INTEGER, Timestamp, Not Null)

### 3.6 Message Table
- **3.6.1** `id` (TEXT, Primary Key)
- **3.6.2** `caseId` (TEXT, Foreign Key → case.id)
- **3.6.3** `senderId` (TEXT, Foreign Key → user.id)
- **3.6.4** `recipientId` (TEXT, Foreign Key → user.id)
- **3.6.5** `content` (TEXT, Not Null)
- **3.6.6** `sentAt` (INTEGER, Timestamp, Not Null)
- **3.6.7** `readAt` (INTEGER, Timestamp, Nullable)

---

## 4. File Structure

### 4.1 Configuration Files (Root)
- **4.1.1** `package.json` (Dependencies & scripts)
- **4.1.2** `tsconfig.json` (TypeScript configuration)
- **4.1.3** `tailwind.config.js` (Tailwind CSS configuration)
- **4.1.4** `vite.config.ts` (Vite build configuration)
- **4.1.5** `drizzle.config.ts` (Database configuration)
- **4.1.6** `.env` (Environment variables)
- **4.1.7** `svelte.config.js` (SvelteKit configuration)

### 4.2 Source Directory (`src/`)

#### 4.2.1 Core Application Files
- **4.2.1.1** `app.html` (HTML template)
- **4.2.1.2** `app.d.ts` (TypeScript definitions)
- **4.2.1.3** `app.css` (Global styles)
- **4.2.1.4** `hooks.server.ts` (Server-side middleware)

#### 4.2.2 Library Directory (`src/lib/`)

##### 4.2.2.1 Components (`src/lib/components/`)
- **4.2.2.1.1** `Navigation.svelte` (Global navigation bar)
- **4.2.2.1.2** `Footer.svelte` (Global footer)
- **4.2.2.1.3** `ThemeToggle.svelte` (Dark/light mode toggle)
- **4.2.2.1.4** `Icon.svelte` (Font Awesome icon wrapper)
- **4.2.2.1.5** `ServicePageTemplate.svelte` (Reusable service page layout)

##### 4.2.2.2 Server Directory (`src/lib/server/`)
- **4.2.2.2.1** `auth.ts` (Authentication utilities)
  - Session token generation
  - Session creation & validation
  - Cookie management
  - Session invalidation
- **4.2.2.2.2** `db/` (Database layer)
  - **4.2.2.2.2.1** `index.ts` (Database client initialization)
  - **4.2.2.2.2.2** `schema.ts` (Database schema definitions)
  - **4.2.2.2.2.3** `seed.ts` (Database seeding script)

##### 4.2.2.3 Utilities (`src/lib/utils/`)
- **4.2.2.3.1** `auth-helpers.ts` (Role-based routing helpers)

#### 4.2.3 Routes Directory (`src/routes/`)

##### 4.2.3.1 Root Layout
- **4.2.3.1.1** `+layout.svelte` (Global layout with nav/footer)

##### 4.2.3.2 Public Pages
- **4.2.3.2.1** Home (`+page.svelte`)
  - Hero section
  - About section
  - Services grid
  - Contact form
- **4.2.3.2.2** About (`/about/+page.svelte`)
  - Firm history
  - Values & mission
- **4.2.3.2.3** Contact (`/contact/+page.svelte`)
  - Contact form
  - Office information
  - Hours of operation

##### 4.2.3.3 Service Pages (`/services/`)
- **4.2.3.3.1** Personal Injury (`/services/personal-injury/+page.svelte`)
- **4.2.3.3.2** Business & IP (`/services/business-intellectual-property/+page.svelte`)
- **4.2.3.3.3** Family & Estate (`/services/family-estate-law/+page.svelte`)
- **4.2.3.3.4** Criminal Defense (`/services/criminal-defense/+page.svelte`)

##### 4.2.3.4 Authentication Routes
- **4.2.3.4.1** Login (`/login/`)
  - **4.2.3.4.1.1** `+page.svelte` (Login form UI)
  - **4.2.3.4.1.2** `+page.server.ts` (Login logic)
    - Form validation
    - Password verification
    - Session creation
    - Role-based redirection
- **4.2.3.4.2** Register (`/register/`)
  - **4.2.3.4.2.1** `+page.svelte` (Registration form UI)
  - **4.2.3.4.2.2** `+page.server.ts` (Registration logic)
    - Form validation
    - Password hashing
    - User creation
    - Session creation
- **4.2.3.4.3** Logout (`/logout/+server.ts`)
  - Session invalidation
  - Cookie deletion
  - Redirect to login

##### 4.2.3.5 Dashboard Routes (`/dashboard/`)
- **4.2.3.5.1** Client Dashboard (`/dashboard/client/`)
  - **4.2.3.5.1.1** `+page.svelte` (Client dashboard UI)
    - Quick stats cards
    - Cases overview
    - Recent documents
    - Invoices list
    - Recent messages
  - **4.2.3.5.1.2** `+page.server.ts` (Client data loading)
    - Load user cases
    - Load user documents
    - Load user invoices
    - Load user messages
- **4.2.3.5.2** Lawyer Dashboard (`/dashboard/lawyer/`)
  - **4.2.3.5.2.1** `+page.svelte` (Lawyer dashboard UI)
    - Quick stats cards (5 metrics)
    - All cases overview
    - Recent documents
    - Invoices management
    - Recent messages
  - **4.2.3.5.2.2** `+page.server.ts` (Lawyer data loading)
    - Load all assigned cases
    - Load all case documents
    - Load all invoices
    - Load all case messages

##### 4.2.3.6 API Routes (`/api/`)
- **4.2.3.6.1** Document Upload (`/api/documents/upload/+server.ts`)
  - Authentication check
  - Case access verification
  - File upload to local filesystem
  - Database record creation
- **4.2.3.6.2** Document Download (`/api/documents/[id]/+server.ts`)
  - Authentication check
  - Document access verification
  - File streaming from local filesystem

### 4.3 Static Assets (`static/`)
- **4.3.1** `fonts/` (Custom font files)
  - Junction Regular (.woff, .woff2)
  - Goudy Bookletter 1911 (.woff, .woff2)
  - League Script (.woff, .woff2)
- **4.3.2** `favicon.png` (Site icon)

### 4.4 Uploads Directory (`uploads/`)
- **4.4.1** Local file storage for uploaded documents
- **4.4.2** Organized by case (future enhancement)

---

## 5. Authentication Flow

### 5.1 Registration Process
- **5.1.1** User submits registration form
- **5.1.2** Server validates input data
- **5.1.3** Password hashed with Argon2
- **5.1.4** User record created in database
- **5.1.5** Session token generated
- **5.1.6** Session record created
- **5.1.7** Session cookie set (HTTP-only)
- **5.1.8** User redirected to role-based dashboard

### 5.2 Login Process
- **5.2.1** User submits credentials
- **5.2.2** Server looks up user by username
- **5.2.3** Password verified with Argon2
- **5.2.4** Session token generated
- **5.2.5** Session record created
- **5.2.6** Session cookie set (HTTP-only)
- **5.2.7** User redirected to role-based dashboard

### 5.3 Session Validation (Server Hook)
- **5.3.1** Extract session token from cookie
- **5.3.2** Hash token with SHA-256
- **5.3.3** Look up session in database
- **5.3.4** Check expiration (30 days)
- **5.3.5** Load user data via foreign key
- **5.3.6** Renew session if < 15 days remaining
- **5.3.7** Populate `event.locals.user` & `event.locals.session`

### 5.4 Logout Process
- **5.4.1** User clicks logout button
- **5.4.2** POST request to `/logout`
- **5.4.3** Session invalidated in database
- **5.4.4** Session cookie deleted
- **5.4.5** User redirected to login page

### 5.5 Protected Routes
- **5.5.1** Load function checks `locals.user`
- **5.5.2** If not authenticated, redirect to login
- **5.5.3** If wrong role, redirect to appropriate dashboard

---

## 6. Key Features

### 6.1 Role-Based Access Control
- **6.1.1** Client role
  - View own cases
  - View own documents
  - View own invoices
  - View own messages
- **6.1.2** Lawyer role
  - View all assigned cases
  - View all case documents
  - Create/manage invoices
  - Message all clients
- **6.1.3** Admin role (future)
  - Full system access
  - User management

### 6.2 Document Management
- **6.2.1** Upload documents to cases
- **6.2.2** Download documents with access control
- **6.2.3** Track upload metadata (size, type, date)
- **6.2.4** Associate documents with cases

### 6.3 Case Management
- **6.3.1** Create cases (lawyer)
- **6.3.2** Track case status (active, pending, closed)
- **6.3.3** Link clients to lawyers
- **6.3.4** View case history

### 6.4 Invoice Management
- **6.4.1** Create invoices (lawyer)
- **6.4.2** Track invoice status (paid, pending, overdue)
- **6.4.3** View payment history
- **6.4.4** Due date tracking

### 6.5 Messaging System
- **6.5.1** Send messages within cases
- **6.5.2** Track read/unread status
- **6.5.3** Display unread message count
- **6.5.4** Associate messages with cases

### 6.6 Theme Support
- **6.6.1** Light mode (default)
- **6.6.2** Dark mode
- **6.6.3** Persistent theme preference (localStorage)
- **6.6.4** CSS variables for colors

### 6.7 Responsive Design
- **6.7.1** Mobile-first approach
- **6.7.2** Breakpoints: sm, md, lg, xl
- **6.7.3** Mobile navigation menu
- **6.7.4** Responsive grid layouts

---

## 7. Data Flow Examples

### 7.1 Client Views Their Documents
```
Client Dashboard → Load Function (server) →
  Query: documents WHERE caseId IN (SELECT id FROM case WHERE clientId = currentUserId) →
    Display documents in UI
```

### 7.2 Lawyer Views All Cases
```
Lawyer Dashboard → Load Function (server) →
  Query: cases WHERE lawyerId = currentUserId →
    Join with client user data →
      Display cases with client names
```

### 7.3 Document Upload
```
Client clicks upload → POST /api/documents/upload →
  Verify authentication →
    Verify case access →
      Save file to uploads/ →
        Create document record in DB →
          Return success response
```

---

## 8. Environment Variables

### 8.1 Required Variables
- **8.1.1** `DATABASE_URL` (Turso database URL)
- **8.1.2** `DATABASE_AUTH_TOKEN` (Turso authentication token)

### 8.2 Optional Variables
- **8.2.1** Local SQLite path for development

---

## 9. NPM Scripts

### 9.1 Development
- **9.1.1** `npm run dev` (Start dev server)
- **9.1.2** `npm run check` (Type checking)
- **9.1.3** `npm run lint` (Code linting)
- **9.1.4** `npm run format` (Code formatting)

### 9.2 Database
- **9.2.1** `npm run db:push` (Push schema changes)
- **9.2.2** `npm run db:generate` (Generate migrations)
- **9.2.3** `npm run db:migrate` (Run migrations)
- **9.2.4** `npm run db:studio` (Open Drizzle Studio)
- **9.2.5** `npm run db:seed` (Seed test data)

### 9.3 Production
- **9.3.1** `npm run build` (Build for production)
- **9.3.2** `npm run preview` (Preview production build)

---

## 10. Future Enhancements (Phase Two)

### 10.1 Payment Integration
- **10.1.1** Stripe integration
- **10.1.2** Online invoice payment
- **10.1.3** Payment tracking

### 10.2 Enhanced Messaging
- **10.2.1** Real-time notifications
- **10.2.2** File attachments in messages
- **10.2.3** Message threading
- **10.2.4** Document sharing via chat
  - **10.2.4.1** Send documents directly in message thread
  - **10.2.4.2** Receive documents from attorney in chat
  - **10.2.4.3** Document status indicators (sent/received/viewed)

### 10.3 Enhanced Document Management
- **10.3.1** Improved Empty State UX
  - **10.3.1.1** Replace "No Documents Yet" with actionable upload button
  - **10.3.1.2** "Upload Documents" CTA when no documents exist
  - **10.3.1.3** Drag-and-drop zone in empty state
- **10.3.2** Document Direction Indicators
  - **10.3.2.1** Mark documents as "Outgoing" (client → attorney)
  - **10.3.2.2** Mark documents as "Incoming" (attorney → client)
  - **10.3.2.3** Visual badges/icons for document direction
  - **10.3.2.4** Filter documents by direction (sent/received)
- **10.3.3** Chat-Integrated Document List
  - **10.3.3.1** Show documents in chronological order as sent in chat
  - **10.3.3.2** Link documents to specific messages
  - **10.3.3.3** Display document metadata with message context
  - **10.3.3.4** Quick preview from document list
- **10.3.4** Document Schema Enhancement
  - **10.3.4.1** Add `direction` field ('incoming' | 'outgoing')
  - **10.3.4.2** Add `messageId` foreign key to link documents to messages
  - **10.3.4.3** Add `viewedAt` timestamp for tracking
  - **10.3.4.4** Add `sharedVia` field ('upload' | 'message')

### 10.4 Advanced Case Management
- **10.4.1** Case timeline/history
- **10.4.2** Task assignments
- **10.4.3** Court date tracking
- **10.4.4** Case notes

### 10.5 Admin Dashboard
- **10.5.1** User management
- **10.5.2** System analytics
- **10.5.3** Audit logs

### 10.6 Email Notifications
- **10.6.1** New message alerts
- **10.6.2** Invoice reminders
- **10.6.3** Case updates

---

## 11. Testing & Quality Assurance

### 11.1 Current Status
- **11.1.1** Manual testing completed for Phase One
- **11.1.2** All routes functional
- **11.1.3** Authentication flow verified
- **11.1.4** Role-based access tested

### 11.2 Future Testing (Phase Two)
- **11.2.1** Unit tests (Vitest)
- **11.2.2** Integration tests
- **11.2.3** E2E tests (Playwright)
- **11.2.4** Load testing

---

## 12. Known Limitations

### 12.1 Current Limitations
- **12.1.1** No email verification
- **12.1.2** No password reset functionality
- **12.1.3** No file upload progress indicator
- **12.1.4** Messages not implemented in UI (data structure ready)
- **12.1.5** Invoice payment not implemented
- **12.1.6** No real-time updates

### 12.2 Browser Compatibility
- **12.2.1** Modern browsers (Chrome, Firefox, Safari, Edge)
- **12.2.2** ES2020+ required
- **12.2.3** No IE11 support

---

## 13. Deployment Considerations

### 13.1 Environment Setup
- **13.1.1** Node.js 18+ required
- **13.1.2** Turso database account
- **13.1.3** Environment variables configured

### 13.2 Build Process
- **13.2.1** `npm run build` creates production build
- **13.2.2** Static files in `build/` directory
- **13.2.3** Adapter-auto selects deployment target

### 13.3 Hosting Options
- **13.3.1** Vercel (recommended for SvelteKit)
- **13.3.2** Netlify
- **13.3.3** Node.js server
- **13.3.4** Docker container

---

*Document Version: 1.0*  
*Last Updated: January 14, 2026*  
*Phase One Complete*
