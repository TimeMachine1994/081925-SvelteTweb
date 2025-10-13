# Quick Migration Examples

## 🔄 How to Use Your New Component Library

### **1. Import the New Components**

```typescript
// In any Svelte component
import { Button, Card, Input, colors, spacing } from '$lib/ui';
```

### **2. Replace Existing Buttons**

#### Before:
```svelte
<button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Save Changes
</button>
```

#### After:
```svelte
<Button variant="primary" size="md">
  Save Changes
</Button>
```

### **3. Replace Cards/Containers**

#### Before:
```svelte
<div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <!-- content -->
</div>
```

#### After:
```svelte
<Card variant="default" padding="lg" rounded="lg" shadow="sm">
  <!-- content -->
</Card>
```

### **4. Replace Form Inputs**

#### Before:
```svelte
<input 
  type="email" 
  class="w-full px-3 py-2 border border-gray-300 rounded-md"
  bind:value={email}
/>
```

#### After:
```svelte
<Input 
  type="email" 
  size="md"
  fullWidth
  bind:value={email}
  placeholder="Enter your email"
/>
```

### **5. Use Design Tokens**

#### Before:
```svelte
<div class="text-gray-600 text-sm">Helper text</div>
```

#### After:
```svelte
<div style="color: {colors.text.secondary}; font-size: {typography.fontSize.sm};">
  Helper text
</div>
```

### **6. Replace Your Current StreamCard**

In any file that uses StreamCard:

#### Before:
```svelte
import StreamCard from '$lib/components/StreamCard.svelte';
```

#### After:
```svelte
import { StreamCard } from '$lib/ui';
```

The props remain the same - it's a drop-in replacement!

## 🎯 **Priority Files to Update**

1. **Portal components** (`/lib/components/portals/`)
2. **Calculator components** (`/lib/components/calculator/`)
3. **Authentication components** (`Login.svelte`, `Register.svelte`)
4. **Any page with buttons or forms**

## 🚨 **Quick Wins**

Start with these easy replacements:

1. **Find all buttons** with `class="bg-yellow-400"` → Replace with `<Button variant="role" role="owner">`
2. **Find all cards** with `class="bg-white border"` → Replace with `<Card>`
3. **Find all inputs** with `class="border border-gray-300"` → Replace with `<Input>`

This will immediately improve consistency across your app!
