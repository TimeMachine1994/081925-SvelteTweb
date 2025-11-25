# Tributestream Component Library Audit

*Generated: October 11, 2024*

## 🎯 Purpose

This document serves as a master inventory of all Tributestream components, documenting their current design patterns and identifying opportunities for standardization and redesign.

## 📊 Component Overview

**Total Components:** 43+  
**Categories:** 8 main categories  
**Framework:** Svelte 5 with TypeScript  
**Styling:** Tailwind CSS + Custom CSS  
**Icons:** Lucide Svelte  

---

## 🏗️ Component Categories

### 1. **Core Layout Components**

#### Navbar.svelte
**Location:** `/lib/components/Navbar.svelte`  
**Current Design:**
- Black background with white text
- Sticky positioning
- Role-based navigation logic
- Yellow gradient CTA buttons

**Props:**
```typescript
// Implicit props via $user store
user: User | null
```

**Design Issues:**
- ❌ Hard-coded colors (black, yellow)
- ❌ No responsive mobile menu
- ❌ Inconsistent button styling

**Redesign Opportunities:**
- ✅ Create reusable Button component
- ✅ Add theme-based color system
- ✅ Implement responsive navigation
- ✅ Extract navigation items to configuration

---

#### Footer.svelte
**Location:** `/lib/components/Footer.svelte`  
**Current Design:** *[To be documented]*

---

### 2. **UI Components**

#### LoadingSpinner.svelte
**Location:** `/lib/components/LoadingSpinner.svelte`  
**Current Design:**
- Well-structured with TypeScript interfaces
- Multiple size variants (sm, md, lg, xl)
- Color variants (primary, secondary, white)
- Full-screen overlay option

**Props:**
```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}
```

**Design Strengths:**
- ✅ Excellent TypeScript interfaces
- ✅ Consistent sizing system
- ✅ Flexible variant system
- ✅ Good accessibility with text options

**Minor Improvements:**
- 🔄 Could use design tokens for colors
- 🔄 Animation timing could be configurable

---

#### StreamCard.svelte
**Location:** `/lib/components/StreamCard.svelte`  
**Current Design:**
- Complex component (368 lines)
- Multiple states and interactions
- Embedded sub-components
- Good TypeScript prop definitions

**Props:**
```typescript
type Props = {
  stream: Stream;
  onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
  onDelete: (streamId: string) => Promise<void>;
  onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
  copiedStreamKey: string | null;
  copiedRtmpUrl: string | null;
};
```

**Design Issues:**
- ❌ Very large component (368 lines)
- ❌ Multiple responsibilities (display, actions, streaming)
- ❌ Hard-coded styling values
- ❌ Complex state management

**Redesign Opportunities:**
- ✅ Break into smaller components (StreamHeader, StreamCredentials, StreamActions)
- ✅ Extract reusable Card component
- ✅ Create standardized Input component
- ✅ Implement consistent button patterns
- ✅ Add design tokens for spacing and colors

---

### 3. **Authentication Components**

#### Login.svelte
**Location:** `/lib/components/Login.svelte`  
**Current Design:** *[To be documented]*

#### Register.svelte
**Location:** `/lib/components/Register.svelte`  
**Current Design:** *[To be documented]*

#### Profile.svelte
**Location:** `/lib/components/Profile.svelte`  
**Current Design:** *[To be documented]*

---

### 4. **Portal Components**

#### AdminPortal.svelte
**Location:** `/lib/components/portals/AdminPortal.svelte`  
**Current Design:** *[To be documented]*

#### FuneralDirectorPortal.svelte
**Location:** `/lib/components/portals/FuneralDirectorPortal.svelte`  
**Current Design:** *[To be documented]*

#### OwnerPortal.svelte
**Location:** `/lib/components/portals/OwnerPortal.svelte`  
**Current Design:** *[To be documented]*

#### ViewerPortal.svelte
**Location:** `/lib/components/portals/ViewerPortal.svelte`  
**Current Design:** *[To be documented]*

#### FamilyMemberPortal.svelte
**Location:** `/lib/components/portals/FamilyMemberPortal.svelte`  
**Current Design:** *[To be documented]*

---

### 5. **Streaming Components**

#### BrowserStreamer.svelte
**Location:** `/lib/components/BrowserStreamer.svelte`  
**Current Design:** *[To be documented]*

#### StreamPlayer.svelte
**Location:** `/lib/components/StreamPlayer.svelte`  
**Current Design:** *[To be documented]*

#### WHEPViewer.svelte
**Location:** `/lib/components/WHEPViewer.svelte`  
**Current Design:** *[To be documented]*

#### CompletedStreamCard.svelte
**Location:** `/lib/components/CompletedStreamCard.svelte`  
**Current Design:** *[To be documented]*

---

### 6. **Calculator Components**

#### Calculator.svelte
**Location:** `/lib/components/calculator/Calculator.svelte`  
**Current Design:** *[To be documented]*

#### BookingForm.svelte
**Location:** `/lib/components/calculator/BookingForm.svelte`  
**Current Design:** *[To be documented]*

#### StripeCheckout.svelte
**Location:** `/lib/components/calculator/StripeCheckout.svelte`  
**Current Design:** *[To be documented]*

#### Summary.svelte
**Location:** `/lib/components/calculator/Summary.svelte`  
**Current Design:** *[To be documented]*

#### TierSelector.svelte
**Location:** `/lib/components/calculator/TierSelector.svelte`  
**Current Design:** *[To be documented]*

---

### 7. **Utility Components**

#### ErrorBoundary.svelte
**Location:** `/lib/components/ErrorBoundary.svelte`  
**Current Design:** *[To be documented]*

#### DevRoleSwitcher.svelte
**Location:** `/lib/components/DevRoleSwitcher.svelte`  
**Current Design:** *[To be documented]*

#### RolePreviewer.svelte
**Location:** `/lib/components/RolePreviewer.svelte`  
**Current Design:** *[To be documented]*

#### LiveUrlPreview.svelte
**Location:** `/lib/components/LiveUrlPreview.svelte`  
**Current Design:** *[To be documented]*

#### MemorialFollowButton.svelte
**Location:** `/lib/components/MemorialFollowButton.svelte`  
**Current Design:** *[To be documented]*

---

### 8. **Page Components**

*Note: These are route-level components that could benefit from component extraction*

#### Layout Components
- `routes/+layout.svelte`
- `routes/hls/+layout.svelte`

#### Page Components
- `routes/+page.svelte` (Homepage)
- `routes/[fullSlug]/+page.svelte` (Event pages)
- `routes/admin/+page.svelte`
- `routes/app/calculator/+page.svelte`
- `routes/contact/+page.svelte`
- `routes/login/+page.svelte`
- *[And 15+ more page components]*

---

## 🎨 Current Design Patterns Analysis

### **Strengths**
- ✅ Consistent use of TypeScript interfaces
- ✅ Good component prop definitions
- ✅ Svelte 5 runes implementation
- ✅ Lucide icons throughout
- ✅ Tailwind CSS for styling

### **Issues to Address**
- ❌ **Inconsistent styling patterns** (hard-coded colors, spacing)
- ❌ **Large, complex components** (StreamCard: 368 lines)
- ❌ **No design token system**
- ❌ **Inconsistent button styles** across components
- ❌ **No standardized card/container patterns**
- ❌ **Mixed color schemes** (black navbar, various button colors)
- ❌ **No responsive design system**

---

## 🚀 Recommended Component Library Structure

### **Phase 1: Foundation Components**
```
src/lib/ui/
├── tokens/
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── animations.ts
├── primitives/
│   ├── Button.svelte
│   ├── Input.svelte
│   ├── Card.svelte
│   ├── Badge.svelte
│   └── Icon.svelte
├── layout/
│   ├── Container.svelte
│   ├── Grid.svelte
│   ├── Stack.svelte
│   └── Flex.svelte
└── feedback/
    ├── LoadingSpinner.svelte (existing)
    ├── Alert.svelte
    ├── Toast.svelte
    └── Modal.svelte
```

### **Phase 2: Composite Components**
```
src/lib/ui/
├── forms/
│   ├── FormField.svelte
│   ├── FormGroup.svelte
│   └── FormActions.svelte
├── navigation/
│   ├── Navbar.svelte (refactored)
│   ├── Breadcrumbs.svelte
│   └── Pagination.svelte
└── data-display/
    ├── Table.svelte
    ├── List.svelte
    └── Stats.svelte
```

### **Phase 3: Domain Components**
```
src/lib/components/
├── stream/
│   ├── StreamCard.svelte (refactored)
│   ├── StreamHeader.svelte (extracted)
│   ├── StreamCredentials.svelte (extracted)
│   └── StreamActions.svelte (extracted)
├── event/
│   ├── MemorialCard.svelte
│   └── MemorialHeader.svelte
└── auth/
    ├── LoginForm.svelte
    └── RegisterForm.svelte
```

---

## 📋 Next Steps

### **Immediate Actions**
1. **Create design token system** (colors, spacing, typography)
2. **Build foundation components** (Button, Input, Card)
3. **Refactor StreamCard** as example of new patterns
4. **Update Navbar** with new component system
5. **Create component documentation** (Storybook or similar)

### **Success Metrics**
- ✅ Reduce component complexity (target: <200 lines per component)
- ✅ Achieve consistent styling across all components
- ✅ Implement responsive design system
- ✅ Create reusable component library
- ✅ Improve developer experience with better tooling

---

## 🔧 Tools & Setup

### **Recommended Tools**
- **Storybook** for component development and documentation
- **Chromatic** for visual regression testing
- **Design tokens** with CSS custom properties
- **Component testing** with Vitest + Testing Library

### **File Structure**
```
frontend/
├── src/lib/ui/           # New component library
├── src/lib/components/   # Existing domain components (to refactor)
├── stories/              # Storybook stories
└── tests/components/     # Component tests
```

---

## 📝 Component Inventory Checklist

### **Documented Components** ✅
- [x] LoadingSpinner.svelte
- [x] StreamCard.svelte  
- [x] Navbar.svelte

### **To Document** 📝
- [ ] Footer.svelte
- [ ] Login.svelte
- [ ] Register.svelte
- [ ] Profile.svelte
- [ ] All Portal components (5)
- [ ] All Streaming components (4)
- [ ] All Calculator components (5)
- [ ] All Utility components (5)
- [ ] All Page components (20+)

### **Priority for Refactoring** 🔥
1. **StreamCard.svelte** (368 lines - break into smaller components)
2. **Navbar.svelte** (add responsive design, extract Button component)
3. **Calculator components** (likely complex, need standardization)
4. **Portal components** (probably have repeated patterns)

---

*This audit will be continuously updated as we refactor and redesign components.*
