# CSS Refactor Plan: Purple/Blue to Gold/Black Theme Migration

## Overview
This document outlines the systematic refactoring plan to remove purple, green, and blue colors from user role pages and unify the application under a consistent gold and black/orange theme.

## Phase 1: Role-Based Color System Updates

### 1.1 Update `tribute-theme.css` Role Colors

**File**: `/frontend/src/lib/styles/tribute-theme.css`

**Current Role Colors (Lines 10-26):**
```css
/* Role-Specific Colors */
--owner-primary: #f59e0b;           /* Keep - already gold/orange */
--owner-secondary: #d97706;         /* Keep - already gold/orange */
--owner-accent: #fbbf24;            /* Keep - already gold/orange */

--funeral-director-primary: #8b5cf6;   /* CHANGE to gold variant */
--funeral-director-secondary: #7c3aed; /* CHANGE to gold variant */
--funeral-director-accent: #a78bfa;    /* CHANGE to gold variant */

--family-member-primary: #10b981;      /* CHANGE to gold variant */
--family-member-secondary: #059669;    /* CHANGE to gold variant */
--family-member-accent: #34d399;       /* CHANGE to gold variant */

--viewer-primary: #3b82f6;             /* CHANGE to gold variant */
--viewer-secondary: #2563eb;           /* CHANGE to gold variant */
--viewer-accent: #60a5fa;              /* CHANGE to gold variant */
```

**Proposed New Role Colors:**
```css
/* Role-Specific Colors - Unified Gold Theme */
--owner-primary: #f59e0b;           /* Keep - Base gold */
--owner-secondary: #d97706;         /* Keep - Darker gold */
--owner-accent: #fbbf24;            /* Keep - Light gold */

--funeral-director-primary: #D5BA7F;   /* Main gold */
--funeral-director-secondary: #C5AA6F; /* Darker gold */
--funeral-director-accent: #E5CA8F;    /* Lighter gold */

--family-member-primary: #B8A06B;      /* Muted gold */
--family-member-secondary: #A8905B;    /* Darker muted gold */
--family-member-accent: #C8B07B;       /* Lighter muted gold */

--viewer-primary: #E6D199;             /* Light gold */
--viewer-secondary: #D6C189;           /* Medium light gold */
--viewer-accent: #F6E1A9;             /* Very light gold */
```

### 1.2 Update Base Theme Colors

**Current Base Colors (Lines 4-8):**
```css
--fa-gold: #D5BA7F;    /* Keep */
--fa-indigo: #2a3b8e;  /* CHANGE to complementary dark */
--fa-black: #1a1a1a;   /* Keep */
--fa-white: #ffffff;   /* Keep */
```

**Proposed Update:**
```css
--fa-gold: #D5BA7F;        /* Keep - Primary gold */
--fa-dark-gold: #8B7A4F;   /* Replace indigo with dark gold */
--fa-black: #1a1a1a;       /* Keep */
--fa-white: #ffffff;       /* Keep */
```

## Phase 2: Individual Component Updates

### 2.1 High Priority Components (Heavy Purple/Blue Usage)

#### **Invitation Pages** - `/routes/invite/[invitationId]/+page.svelte`
- **Lines to Update**: 18, 21-22, 27, 38, 46-47, 50-54, 59-62, 75-85, 140, 146, 150, 165-166
- **Changes Needed**:
  - Replace `from-purple-50 via-blue-50 to-indigo-50` with gold gradient
  - Replace `from-purple-200/30` and `from-blue-200/20` with gold variants
  - Replace `from-purple-600 to-blue-600` with gold gradient
  - Update all purple/blue text colors to gold variants
  - Replace `from-blue-500 to-purple-600` buttons with gold gradients

#### **Profile Component** - `/lib/components/Profile.svelte`
- **Lines to Update**: Multiple blue gradient and accent references
- **Changes Needed**:
  - Replace blue gradients with gold equivalents
  - Update blue form elements and buttons
  - Change blue accent colors to gold

#### **Funeral Director Portal** - `/lib/components/portals/FuneralDirectorPortal.svelte`
- **Changes Needed**:
  - Remove purple theme implementation
  - Replace with gold theme using new role colors
  - Update gradient backgrounds and accents

### 2.2 Medium Priority Components

#### **Admin Components** - `/routes/admin/+page.svelte`
- Replace blue accent colors with gold
- Update blue button styling

#### **Payment Receipt Pages** - `/routes/payment/receipt/+page.svelte`
- Replace blue styling with gold
- Update blue status indicators

#### **Registration Pages**
- `/routes/register/funeral-home/+page.svelte`
- `/routes/register/loved-one/+page.svelte`
- Replace blue form elements and buttons with gold

### 2.3 Low Priority Components

#### **Livestream Components**
- Replace blue control elements with gold
- Update blue status indicators

## Phase 3: Semantic Variable Updates

### 3.1 Theme Showcase Page - `/routes/theme/+page.svelte`

**Current Issues:**
- Uses semantic color variables that default to blue
- Alert components use blue for informational states (line 180-183)

**Updates Needed:**
- Ensure primary color variables resolve to gold
- Update informational alert styling to use gold instead of blue
- Verify all semantic colors align with gold theme

### 3.2 Global CSS Variables

**File**: `/frontend/src/app.css`

**Current Variables (Lines 15-16):**
```css
--color-theme-1: #ff3e00;  /* Update to gold */
--color-theme-2: #4075a6;  /* Update to dark gold */
```

**Proposed Updates:**
```css
--color-theme-1: #D5BA7F;  /* Primary gold */
--color-theme-2: #8B7A4F;  /* Dark gold */
```

## Implementation Strategy

### Phase 1: Foundation (Day 1)
1. Update `tribute-theme.css` role colors
2. Update base theme colors in `app.css`
3. Test role-based theming system

### Phase 2: High Impact (Days 2-3)
1. Refactor invitation pages
2. Update profile component
3. Fix funeral director portal
4. Update admin components

### Phase 3: Completion (Days 4-5)
1. Update remaining registration pages
2. Fix payment and livestream components
3. Update theme showcase page
4. Final testing and cleanup

## Testing Checklist

- [ ] All user role pages display consistent gold theme
- [ ] No purple, blue, or green colors remain in role-based components
- [ ] Gradient backgrounds use gold variations
- [ ] Form elements use gold focus states
- [ ] Buttons use gold hover states
- [ ] Status indicators use gold variants
- [ ] Theme showcase displays correct colors
- [ ] Cross-browser compatibility maintained
- [ ] Accessibility contrast ratios preserved

## Color Reference Guide

### Gold Palette for Implementation
```css
/* Primary Gold Shades */
#D5BA7F  /* Main gold - primary actions */
#E5CA8F  /* Light gold - hover states */
#C5AA6F  /* Dark gold - active states */
#F6E1A9  /* Very light gold - backgrounds */
#B8A06B  /* Muted gold - secondary elements */
#8B7A4F  /* Deep gold - borders/accents */

/* Supporting Colors */
#1a1a1a  /* Black - text/backgrounds */
#ffffff  /* White - text/backgrounds */
#f9fafb  /* Light gray - subtle backgrounds */
#374151  /* Dark gray - secondary text */
```

## Notes
- Maintain existing accessibility standards
- Preserve hover and focus states functionality
- Keep consistent spacing and typography
- Test on all user role types
- Verify theme switching still works properly
