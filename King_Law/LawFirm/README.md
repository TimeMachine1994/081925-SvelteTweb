# King Law Firm — Case Management System

A web-based case management platform for **King Law, P.L.L.C.** enabling lawyers, staff, and clients to manage cases, documents, invoices, and communications.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 5 (Svelte 5 Runes) |
| Styling | TailwindCSS 4 (king-blue/gold theme) |
| Database | Turso (SQLite) via Drizzle ORM |
| Auth | Lucia Auth v3 (session cookies, Argon2) |
| Adapter | adapter-static (SPA, `200.html` fallback) |
| Icons | Emoji-based |
| UI | Custom components (no external component library) |

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in:
```env
DATABASE_URL=          # Turso database URL (or file:local.db for local dev)
DATABASE_AUTH_TOKEN=   # Turso auth token (blank for local dev)
```

### 3. Set up the database
```bash
npm run db:push
```

### 4. Start the dev server
```bash
npm run dev
```

## User Roles

| Role | Dashboard | Registration |
|------|-----------|-------------|
| Client | `/dashboard/client` | `/register` |
| Lawyer | `/dashboard/lawyer` | `/staff-sign-up` (employee code with `lawyer` role) |
| Staff | `/dashboard/staff` | `/staff-sign-up` (employee code with `staff` role) |
| Admin | `/dashboard/admin` | `/staff-sign-up` (employee code with `admin` role) |

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components (Navigation, Footer, MessageComposer, etc.)
│   ├── stores/         # Svelte 5 runes-based stores (auth, cases, messages, documents, invoices, toast)
│   ├── server/
│   │   ├── db/         # Drizzle schema + DB connection
│   │   ├── auth.ts     # Lucia session management
│   │   └── email.ts    # Email notification utility
│   └── utils/          # API client, auth helpers
├── routes/
│   ├── api/            # REST API endpoints (41 endpoints)
│   ├── dashboard/      # Client, Lawyer, Staff, Admin dashboards
│   ├── services/       # 8 practice area pages
│   └── ...             # Public pages (home, contact, login, register, etc.)
DevDocs/                # Development documentation
├── 1-27-26-master-wbs.md        # ← Authoritative master doc
├── MASTER_AUDIT_02-05-26.md     # Full codebase audit
├── archive/                      # Obsolete/historical docs
```

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build → build/
npm run preview      # Preview production build
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run check        # Type checking
npm run lint         # ESLint
npm run format       # Prettier
```

## Documentation

The authoritative project documentation is **`DevDocs/1-27-26-master-wbs.md`**. It covers:
- Database schema (10 tables)
- All 41 API endpoints
- Client-side stores
- Component library
- Feature status matrix
- Outstanding items & TODOs
- Testing strategy
- Deployment instructions
