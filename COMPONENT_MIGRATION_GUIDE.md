# TributeStream Component Library Migration Guide

*Updated: October 11, 2024*

## 🎯 Overview

This guide provides step-by-step instructions for migrating your existing TributeStream components to use the new design system and component library.

## 📁 New File Structure

```
frontend/src/lib/
├── ui/                          # 🆕 New component library
│   ├── tokens/                  # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── primitives/              # Foundation components
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   └── Input.svelte
│   ├── navigation/              # Navigation components
│   │   └── Navbar.svelte        # 🆕 Refactored navbar
│   └── index.ts                 # Central exports
└── components/                  # 📝 Existing components (to migrate)
    ├── StreamCard.svelte        # ⚠️ Needs refactoring
    ├── LoadingSpinner.svelte    # ✅ Already compatible
    └── ...
```

---

## 🚀 Quick Start

### 1. **Import the New Design System**

```typescript
// Instead of hard-coded values
import { colors, spacing, Button, Card, Input } from '$lib/ui';

// Use design tokens
const primaryColor = colors.primary[600];
const cardPadding = spacing.semanticSpacing.card.padding.md;
```

### 2. **Replace Existing Components**

```svelte
<!-- ❌ Old way -->
<button class="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-full">
  Login
</button>

<!-- ✅ New way -->
<Button variant="role" role="owner" size="md" rounded="full">
  Login
</Button>
```

---

## 🔄 Component Migration Examples

### **Button Migration**

#### Before (Hard-coded styles):
```svelte
<!-- Current Navbar.svelte -->
<a
  href="/login"
  class="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-2 font-semibold text-black shadow-lg transition-all duration-200 hover:from-yellow-500 hover:to-yellow-700"
>
  Login
</a>
```

#### After (Design system):
```svelte
<!-- New approach -->
<Button 
  variant="role" 
  role={$user?.role || 'viewer'} 
  size="md" 
  rounded="full"
  href="/login"
>
  Login
</Button>
```

**Benefits:**
- ✅ Consistent styling across all buttons
- ✅ Role-based theming automatically applied
- ✅ Accessibility built-in
- ✅ Loading states supported
- ✅ TypeScript interfaces

---

### **Card Migration**

#### Before (StreamCard.svelte - 368 lines):
```svelte
<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
  <!-- Complex content -->
</div>
```

#### After (Refactored approach):
```svelte
<Card variant="default" padding="md" rounded="xl" hoverable>
  <StreamHeader {stream} />
  <StreamCredentials {stream} />
  <StreamActions {stream} />
</Card>
```

**Benefits:**
- ✅ Reduced complexity (break 368 lines into smaller components)
- ✅ Consistent card styling
- ✅ Reusable across different contexts
- ✅ Better maintainability

---

### **Input Migration**

#### Before (Various input styles):
```svelte
<input
  type="text"
  class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-700"
  readonly
/>
```

#### After (Standardized):
```svelte
<Input
  type="text"
  size="md"
  variant="default"
  readonly
  helperText="Stream key for OBS"
/>
```

---

## 📋 Migration Priority List

### **Phase 1: High Impact Components** 🔥
1. **Navbar.svelte** → Use new `ui/navigation/Navbar.svelte`
2. **StreamCard.svelte** → Break into smaller components using `Card`
3. **All buttons** → Replace with `Button` component
4. **Form inputs** → Replace with `Input` component

### **Phase 2: Portal Components** 📊
5. **AdminPortal.svelte** → Use design tokens and new components
6. **FuneralDirectorPortal.svelte** → Apply role-based theming
7. **OwnerPortal.svelte** → Standardize with new patterns
8. **ViewerPortal.svelte** → Consistent styling

### **Phase 3: Calculator Components** 💰
9. **Calculator.svelte** → Use new form components
10. **TierSelector.svelte** → Standardize card patterns
11. **BookingForm.svelte** → Apply new input components

---

## 🎨 Design Token Usage

### **Colors**
```typescript
import { colors, roleColors } from '$lib/ui';

// Instead of: class="bg-blue-600"
const primaryBg = colors.primary[600];

// Role-based colors
const ownerTheme = roleColors.owner.primary; // Amber
const funeralDirectorTheme = roleColors.funeral_director.primary; // Purple
```

### **Spacing**
```typescript
import { getSemanticSpacing } from '$lib/ui';

// Instead of: class="p-6"
const cardPadding = getSemanticSpacing('card', 'padding').md;

// Instead of: class="gap-4"
const componentGap = getSemanticSpacing('component', 'md');
```

### **Typography**
```typescript
import { getTextStyle } from '$lib/ui';

// Instead of: class="text-lg font-semibold"
const headingStyle = getTextStyle('heading', 'h3');
```

---

## 🔧 Step-by-Step Migration Process

### **Step 1: Update Imports**
```typescript
// Add to your component
import { Button, Card, Input, colors, spacing } from '$lib/ui';
```

### **Step 2: Replace Hard-coded Styles**
```svelte
<!-- Before -->
<div class="bg-white border border-gray-200 rounded-lg p-6">

<!-- After -->
<Card variant="default" padding="md" rounded="lg">
```

### **Step 3: Use Design Tokens**
```svelte
<script>
  import { colors } from '$lib/ui';
  
  const customStyles = `
    background: ${colors.background.primary};
    border: 1px solid ${colors.border.primary};
  `;
</script>

<div style={customStyles}>
```

### **Step 4: Test and Validate**
- ✅ Visual consistency maintained
- ✅ Functionality preserved
- ✅ Accessibility improved
- ✅ TypeScript errors resolved

---

## 📊 Migration Checklist

### **For Each Component:**
- [ ] **Identify hard-coded styles** (colors, spacing, typography)
- [ ] **Replace with design tokens** where possible
- [ ] **Use new primitive components** (Button, Card, Input)
- [ ] **Break down large components** (>200 lines)
- [ ] **Add TypeScript interfaces** if missing
- [ ] **Test responsive behavior**
- [ ] **Verify accessibility**
- [ ] **Update component documentation**

### **Quality Gates:**
- [ ] **No hard-coded colors** (use design tokens)
- [ ] **Consistent spacing** (use semantic spacing)
- [ ] **TypeScript compliance** (proper interfaces)
- [ ] **Accessibility standards** (ARIA labels, keyboard nav)
- [ ] **Responsive design** (mobile-first approach)
- [ ] **Performance** (component size <200 lines)

---

## 🎯 Expected Outcomes

### **Before Migration:**
- ❌ 43+ components with inconsistent styling
- ❌ Hard-coded colors and spacing
- ❌ Large, complex components (368 lines)
- ❌ No design system
- ❌ Difficult maintenance

### **After Migration:**
- ✅ Consistent design system across all components
- ✅ Reusable primitive components
- ✅ Role-based theming
- ✅ Smaller, focused components (<200 lines)
- ✅ Better TypeScript support
- ✅ Improved accessibility
- ✅ Easier maintenance and updates

---

## 🚨 Common Pitfalls to Avoid

1. **Don't migrate everything at once** - Use phased approach
2. **Don't break existing functionality** - Test thoroughly
3. **Don't ignore accessibility** - Use built-in ARIA support
4. **Don't skip TypeScript** - Maintain type safety
5. **Don't forget responsive design** - Test on mobile devices

---

## 🔗 Next Steps

1. **Start with Navbar migration** (already created)
2. **Refactor StreamCard** as proof of concept
3. **Set up Storybook** for component development
4. **Create component tests** for new components
5. **Document component APIs** for team usage

---

## 📞 Support

For questions about migration:
- Review the **Component Library Audit** document
- Check existing component examples in `/lib/ui/`
- Test new components in isolation before integration

*This migration will significantly improve code maintainability, design consistency, and developer experience.*
