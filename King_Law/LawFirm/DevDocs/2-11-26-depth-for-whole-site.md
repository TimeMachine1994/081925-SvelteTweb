# WBS: Sitewide Depth & Layering

**Date:** 2-11-26  
**Objective:** Apply the depth/layering UI principles (compound shadows, color-layered backgrounds, hover elevation) from the Fortress page to every public-facing page and shared component on the King Law website.

---

## Phase 1 — Foundation

### 1.1 Promote depth CSS utilities to global `app.css`
- Move `.depth-dark-3`, `.depth-gold`, `.depth-card`, `.depth-card-dark`, `.depth-ghost`, `.depth-inset` (including `:hover` variants) from Fortress `<style>` → `app.css`
- **Files:** `src/app.css`

### 1.2 Clean up Fortress scoped styles
- Remove the depth classes from Fortress `<style>` block (keep only `.fortress-pattern` and `select option`)
- Verify Fortress page still renders correctly with global classes
- **Files:** `src/routes/Fortress/+page.svelte`

---

## Phase 2 — Shared Components

### 2.1 Navigation (`src/lib/components/Navigation.svelte`)
- Add subtle depth shadow to the sticky nav bar
- Apply `depth-card-dark` to the Practice Areas dropdown (replacing `shadow-xl`)
- Apply `depth-gold` to gold CTA buttons (Pay Bill, Dashboard)

### 2.2 Footer (`src/lib/components/Footer.svelte`)
- Add subtle top inset shadow for "recessed below page" effect (optional/minimal)

---

## Phase 3 — Core Public Pages

### 3.1 Homepage (`src/routes/+page.svelte`)
- Hero value-prop cards → `depth-card-dark`
- Gold CTA buttons → `depth-gold`
- Ghost/outline CTA buttons → `depth-ghost`
- Practice area cards → `depth-card-dark` (dark bg cards)
- Consultation form card → `depth-card`
- Form submit button → `depth-gold`

### 3.2 Contact Page (`src/routes/contact/+page.svelte`)
- Contact info sidebar card (`bg-king-blue rounded-2xl`) → `depth-card-dark`
- Form submit button → `depth-gold`
- Client Portal CTA → `depth-gold`

### 3.3 Meet Ben King (`src/routes/meet-ben-king/+page.svelte`)
- Profile photo card (`shadow-2xl`) → `depth-card`
- Hero CTA gold button → `depth-gold`
- Hero ghost CTA → `depth-ghost`
- Philosophy cards (3×, `shadow-sm`) → `depth-card`
- Bottom CTA button → `depth-gold`

### 3.4 Our Team (`src/routes/our-team/+page.svelte`)
- Team photo cards (`shadow-xl`) → `depth-card`
- Bottom CTA button → `depth-gold`

### 3.5 Schedule Page (`src/routes/schedule/+page.svelte`)
- Date picker card → `depth-card-dark`
- Booking form card → `depth-card-dark`
- Success card → `depth-card-dark`
- Confirm Booking button → `depth-gold`
- Download .ics button → `depth-gold`

### 3.6 Request Consultation (`src/routes/request-consultation/+page.svelte`)
- Success card → `depth-card-dark`
- Submit button → `depth-gold`
- Submit Another Request button → `depth-gold`

### 3.7 Login Page (`src/routes/login/+page.svelte`)
- Sign In button → `depth-gold` (or depth equivalent for king-blue bg)
- Left branding panel — no change needed (flat is intentional)

---

## Phase 4 — Service Pages (8 pages, identical template)

All use the same card pattern: `bg-background border border-border rounded-lg p-6`

### 4.1 Personal Injury (`src/routes/services/personal-injury/+page.svelte`)
### 4.2 Criminal Defense (`src/routes/services/criminal-defense/+page.svelte`)
### 4.3 Employment Law (`src/routes/services/employment-law/+page.svelte`)
### 4.4 Real Estate & Business (`src/routes/services/real-estate-business/+page.svelte`)
### 4.5 Civil Rights (`src/routes/services/civil-rights/+page.svelte`)
### 4.6 Cannabis Law (`src/routes/services/cannabis-law/+page.svelte`)
### 4.7 Appeals (`src/routes/services/appeals/+page.svelte`)
### 4.8 Property Damage (`src/routes/services/property-damage/+page.svelte`)

**Per page:**
- Practice area grid cards → `depth-card`
- Info/strategy boxes → `depth-card`
- Gold CTA buttons → `depth-gold`
- Outline/ghost CTA buttons → `depth-ghost`

---

## Phase 5 — Verification

### 5.1 Visual review
- Check every modified page in browser for correct shadow rendering
- Verify hover transitions work smoothly
- Confirm no regressions on Fortress page

### 5.2 Lint & build check
- Run `npm run check` / `npm run build` to ensure no errors

---

## Scope Exclusions
- **Dashboard pages** — internal app, separate design context
- **API routes** — no UI
- **Sample/demo pages** — not user-facing
