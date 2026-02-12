# Mobile Responsive Refactor — Work Breakdown Structure

**Date:** 2-11-26  
**Scope:** All public-facing marketing pages + dashboard shell  
**Stack:** SvelteKit, Tailwind CSS v4, custom fonts  
**Approach:** Flexbox-first, structured grids where needed, media queries for complex behavior

---

## 1. Global CSS & Layout Shell

### 1.1 `src/app.css`
- [ ] Add `scroll-padding-top: 5rem` to `html` (prevents fixed nav from hiding content on anchor scroll)
- [ ] Verify all depth utilities don't cause overflow on mobile

### 1.2 `src/app.html`
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1" />` — already present ✅

### 1.3 `src/lib/components/Navigation.svelte`
- [ ] Add `ml-auto` to mobile hamburger button so it pushes to far right on all widths
- [ ] Verify logo group doesn't overflow on 320px screens
- [ ] Confirm mobile menu has adequate touch targets (min 44×44px)
- [ ] Ensure mobile Practice Areas accordion is usable on small screens

### 1.4 `src/lib/components/Footer.svelte`
- [x] Already uses `grid-cols-1 lg:grid-cols-12` ✅
- [ ] Verify text doesn't overflow on 320px

### 1.5 `src/routes/+layout.svelte`
- [x] Flex column layout with sticky nav — working ✅

---

## 2. Homepage (`src/routes/+page.svelte`)

### 2.1 Hero Section
- [ ] Value props grid: change `sm:grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (too tight at 320–400px)
- [ ] CTA button text "Schedule Free In-Person Consultation" — add `text-base md:text-lg` to prevent overflow on <375px
- [ ] Verify `min-h-[85vh]` doesn't cause issues on short mobile screens with toolbar

### 2.2 "How We Work" Section
- [ ] Reduce `gap-8` → `gap-4 md:gap-8` in 12-col grid rows
- [ ] Reduce `gap-16` after header → `gap-8 md:gap-16`
- [ ] Verify `border-l-4` accent doesn't get lost on narrow screens

### 2.3 Practice Areas Cards
- [ ] Reduce card padding: `p-8` → `p-5 md:p-8`
- [ ] Reduce header area `gap-16` → `gap-8 md:gap-16`

### 2.4 Schedule Widget Section
- [ ] Verify embedded `ScheduleWidget` renders correctly in mobile (see Step 7)

### 2.5 Quote + CTA Section
- [ ] CTA button: same text-size fix as hero
- [ ] Verify `text-6xl` quote mark doesn't cause layout shift

---

## 3. Meet Ben King (`src/routes/meet-ben-king/+page.svelte`)

### 3.1 Hero Grid
- [ ] Reduce `gap-16` → `gap-8 lg:gap-16`
- [ ] Decorative gold square (`absolute -bottom-4 -right-4`): add `overflow-hidden` to parent or hide on mobile with `hidden sm:block`

### 3.2 "Built for Complexity" Section
- [ ] Reduce `gap-16` → `gap-8 md:gap-16` in 12-col grid

### 3.3 "How I Work" Philosophy Cards
- [ ] Change `md:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` for better tablet layout
- [ ] Verify icon circles don't overflow card boundaries

### 3.4 Quote & CTA Sections
- [ ] Verify quote text wraps cleanly on mobile

---

## 4. Our Team (`src/routes/our-team/+page.svelte`)

### 4.1 Team Member Grid
- [ ] Reduce `gap-12` → `gap-6 lg:gap-12`
- [ ] Reduce `py-16` → `py-8 lg:py-16`
- [ ] Decorative gold square: same overflow fix — `hidden sm:block`

### 4.2 Team Photos
- [ ] Verify `aspect-[4/5]` doesn't make images excessively tall on mobile
- [ ] Consider `max-h-[400px] sm:max-h-none` if needed

---

## 5. Contact Page (`src/routes/contact/+page.svelte`)

### 5.1 Layout Grid
- [ ] Reduce `gap-16` → `gap-8 lg:gap-16`
- [ ] Info card: change `sticky top-28` → `lg:sticky lg:top-28` (disable sticky on mobile)

### 5.2 Form
- [ ] Verify all inputs have `min-h-[44px]` touch targets
- [ ] Verify `grid md:grid-cols-2` name/phone row stacks properly

---

## 6. Service Pages (8 pages, batch edit)

**Files:**
- `src/routes/services/personal-injury/+page.svelte`
- `src/routes/services/criminal-defense/+page.svelte`
- `src/routes/services/executive-counsel/+page.svelte`
- `src/routes/services/business-investment/+page.svelte`
- `src/routes/services/civil-rights/+page.svelte`
- `src/routes/services/cannabis-law/+page.svelte`
- `src/routes/services/appellate-strategy/+page.svelte`
- `src/routes/services/property-claims/+page.svelte`

### 6.1 Per-Page Fixes
- [ ] Case cards: tighten `p-6` → `p-4 md:p-6`
- [ ] Case card grids: tighten `gap-6` → `gap-4 md:gap-6`
- [ ] CTA sections: verify buttons don't overflow on small screens
- [ ] Verify `max-w-4xl` container + `px-4 sm:px-6` padding works at 320px

---

## 7. Fortress Page (`src/routes/Fortress/+page.svelte`)

### 7.1 Full Page Audit (766 lines)
- [ ] Hero card: verify padding works on mobile (already has `px-8 py-14 md:px-14 md:py-16`)
- [ ] Pricing/features grids: audit for mobile stacking
- [ ] FAQ accordion: verify touch targets and text wrapping
- [ ] Application form: verify mobile form UX
- [ ] Any horizontal scroll issues from absolute/fixed positioning

---

## 8. Schedule Widget & Forms

### 8.1 `src/lib/components/ScheduleWidget.svelte`
- [ ] Day picker `grid-cols-5`: verify text doesn't truncate on <360px
- [ ] Consider reducing day label font size on very small screens
- [ ] Time slots `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`: verify adequate tap targets (min 44px height)
- [ ] Form step: verify all inputs stack and are usable on mobile

### 8.2 `src/routes/request-consultation/+page.svelte`
- [ ] Audit full 339-line form for mobile layout
- [ ] Verify select dropdowns are usable on mobile
- [ ] Touch target audit for all form controls

### 8.3 `src/routes/schedule/+page.svelte`
- [ ] Trust indicators `sm:grid-cols-3`: verify stacking on mobile
- [ ] Verify hero text sizes are readable on 320px

---

## 9. Dashboard Shell (light touch)

### 9.1 `src/lib/components/dashboard/AppShell.svelte`
- [x] Already has mobile sidebar overlay with backdrop ✅
- [x] Already has `p-4 lg:p-6` responsive main padding ✅
- [ ] Verify sidebar width doesn't exceed screen on 320px devices

---

## Smoke Test Checklist

Test each page at these viewport widths:

| Width | Device Class |
|-------|-------------|
| 320px | iPhone SE / small Android |
| 375px | iPhone 12/13/14 |
| 414px | iPhone Plus / large Android |
| 768px | iPad portrait |
| 1024px | iPad landscape / small laptop |

### Per-Page Checks
- [ ] No horizontal scrollbar appears
- [ ] All text is readable without zooming
- [ ] All tap targets are ≥44×44px
- [ ] No content hidden under fixed nav
- [ ] Images don't overflow container
- [ ] Forms are usable (inputs visible, keyboard doesn't obscure)
- [ ] CTAs are reachable and tappable
- [ ] Decorative elements don't cause overflow

---

## Files Changed (Expected)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app.css` | scroll-padding-top |
| 2 | `src/lib/components/Navigation.svelte` | hamburger alignment |
| 3 | `src/routes/+page.svelte` | grid, gaps, padding, CTA sizing |
| 4 | `src/routes/meet-ben-king/+page.svelte` | gaps, overflow, breakpoints |
| 5 | `src/routes/our-team/+page.svelte` | gaps, overflow, photo sizing |
| 6 | `src/routes/contact/+page.svelte` | gap, sticky fix |
| 7–14 | `src/routes/services/*/+page.svelte` | padding, gap tightening |
| 15 | `src/routes/Fortress/+page.svelte` | mobile audit fixes |
| 16 | `src/lib/components/ScheduleWidget.svelte` | day picker, touch targets |
| 17 | `src/routes/request-consultation/+page.svelte` | form mobile fixes |
