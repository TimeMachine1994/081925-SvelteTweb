# Utilities & Helper Functions

## Overview

TributeStream includes a comprehensive set of utility functions and helper modules that provide common functionality across the application. These utilities handle data transformation, validation, error handling, and other shared operations.

## Core Utility Modules

### 1. Scheduled Services Utilities

**Location:** `/lib/server/scheduledServicesUtils.ts`

Handles conversion between Memorial service data and livestream system formats.

#### Key Functions

```typescript
// Convert Memorial.services to scheduled services format
export function convertMemorialToScheduledServices(memorial: Memorial): any[] {
  const services: any[] = [];
  
  // Add main service
  if (memorial.services.main) {
    const mainService = {
      id: 'main_main',
      title: `${memorial.lovedOneName} Memorial Service`,
      status: 'scheduled',
      location: memorial.services.main.location,
      time: memorial.services.main.time,
      hours: memorial.services.main.hours || 1,
      isVisible: true
    };
    services.push(mainService);
  }
  
  // Add additional services
  if (memorial.services.additional) {
    memorial.services.additional.forEach((service, index) => {
      if (service.enabled) {
        services.push({
          id: `additional_${index}`,
          title: `Additional Service ${index + 1}`,
          status: 'scheduled',
          location: service.location,
          time: service.time,
          hours: service.hours || 1,
          isVisible: true
        });
      }
    });
  }
  
  return services.sort(sortServicesByDateTime);
}

// Format service time for display
export function formatServiceTime(time: any): string {
  if (!time || time.isUnknown) return 'Time TBD';
  if (!time.date) return 'Date TBD';
  
  const date = new Date(time.date);
  const timeStr = time.time ? ` at ${time.time}` : '';
  return date.toLocaleDateString() + timeStr;
}

// Get service status color class
export function getServiceStatusColor(status: string): string {
  switch (status) {
    case 'live': return 'bg-red-500';
    case 'scheduled': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

// Filter services by visibility
export function filterVisibleServices(services: any[]): any[] {
  return services.filter(service => service.isVisible !== false);
}
```

### 2. Memorial Access Utilities

**Location:** `/lib/utils/memorialAccess.ts`

Comprehensive access control and permission verification system.

#### Core Classes

```typescript
export class MemorialAccessVerifier {
  // Check view access permissions
  static async checkViewAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
    // Admin always has access
    if (user.role === 'admin' || user.isAdmin) {
      return { hasAccess: true, accessLevel: 'admin', reason: 'Admin privileges' };
    }
    
    const memorial = await getMemorialDocument(memorialId);
    
    // Owner access
    if (memorial.ownerUid === user.uid) {
      return { hasAccess: true, accessLevel: 'admin', reason: 'Memorial owner' };
    }
    
    // Funeral director access
    if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
      return { hasAccess: true, accessLevel: 'edit', reason: 'Assigned funeral director' };
    }
    
    return { hasAccess: false, accessLevel: 'none', reason: 'Insufficient permissions' };
  }
  
  // Check livestream control permissions
  static async checkLivestreamAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
    // Only admin, owner, and funeral director can control livestream
    const viewAccess = await this.checkViewAccess(memorialId, user);
    
    if (viewAccess.accessLevel === 'admin' || viewAccess.accessLevel === 'edit') {
      return viewAccess;
    }
    
    return { hasAccess: false, accessLevel: 'none', reason: 'Livestream control requires owner or funeral director permissions' };
  }
}
```

### 3. Error Handling Utilities

**Location:** `/lib/utils/errorHandler.ts`

Centralized error handling with user-friendly messages and logging.

#### Error Management

```typescript
// Standard error codes
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  MEMORIAL_NOT_FOUND: 'MEMORIAL_NOT_FOUND',
  SAVE_FAILED: 'SAVE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FIREBASE_ERROR: 'FIREBASE_ERROR'
} as const;

// Create standardized app error
export function createAppError(code: keyof typeof ErrorCodes, details?: any, context?: ErrorContext): AppError {
  return {
    code,
    message: ErrorMessages[code],
    details,
    context: {
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent,
      url: window?.location.href,
      ...context
    },
    recoverable: isRecoverableError(code)
  };
}

// Comprehensive error handler
export function handleError(error: any, context?: ErrorContext): AppError {
  let appError: AppError;
  
  if (error.code?.startsWith('auth/')) {
    appError = handleFirebaseError(error, context);
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    appError = handleNetworkError(error, context);
  } else {
    appError = createAppError(ErrorCodes.UNKNOWN_ERROR, { originalError: error.message }, context);
  }
  
  logError(appError);
  showErrorNotification(appError);
  
  return appError;
}
```

### 4. Auto-Save Composable

**Location:** `/lib/composables/useAutoSave.ts`

Reactive auto-save functionality for forms and data entry.

#### Auto-Save Implementation

```typescript
export function useAutoSave(memorialId: string, options?: {
  delay?: number;
  onSave?: (success: boolean, error?: string) => void;
  onLoad?: (data: AutoSaveData | null) => void;
}) {
  let saveTimeout: NodeJS.Timeout | null = null;
  let isSaving = false;
  let hasUnsavedChanges = false;
  
  // Trigger auto-save with debouncing
  function triggerAutoSave(data: AutoSaveData) {
    hasUnsavedChanges = true;
    
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(() => {
      autoSave(data);
    }, options?.delay || 2000);
  }
  
  // Perform auto-save operation
  async function autoSave(data: AutoSaveData) {
    if (!data.services && !data.calculatorData) return;
    
    isSaving = true;
    hasUnsavedChanges = false;
    
    try {
      const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: data.services,
          calculatorData: data.calculatorData,
          timestamp: Date.now()
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        options?.onSave?.(true);
      } else {
        hasUnsavedChanges = true;
        options?.onSave?.(false, result.error);
      }
    } catch (error) {
      hasUnsavedChanges = true;
      options?.onSave?.(false, error.message);
    } finally {
      isSaving = false;
    }
  }
  
  return {
    isSaving: () => isSaving,
    hasUnsavedChanges: () => hasUnsavedChanges,
    triggerAutoSave,
    saveNow: (data: AutoSaveData) => autoSave(data),
    loadAutoSavedData
  };
}
```

## Validation Utilities

### Data Validation Functions

```typescript
// Validate service time information
export function validateServiceTime(time: any): boolean {
  if (!time) return false;
  if (time.isUnknown) return true; // Unknown time is valid
  return !!(time.date && time.time);
}

// Validate memorial data structure
export function validateMemorialData(memorial: Partial<Memorial>): ValidationResult {
  const errors: string[] = [];
  
  if (!memorial.lovedOneName?.trim()) {
    errors.push('Loved one name is required');
  }
  
  if (!memorial.services?.main) {
    errors.push('Main service information is required');
  }
  
  if (memorial.services?.main && !validateServiceTime(memorial.services.main.time)) {
    errors.push('Main service time is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
```

## Formatting Utilities

### Display Formatting Functions

```typescript
// Format currency values
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date for display
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Format duration in minutes to human readable
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}
```

## Data Transformation Utilities

### Object and Array Helpers

```typescript
// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// Remove undefined/null values from object
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  
  return cleaned;
}

// Generate unique ID
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
}

// Debounce function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

## URL and Slug Utilities

### URL Generation and Validation

```typescript
// Generate URL-safe slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Generate full memorial slug
export function generateFullSlug(lovedOneName: string, funeralHomeName?: string): string {
  const nameSlug = generateSlug(lovedOneName);
  
  if (funeralHomeName) {
    const homeSlug = generateSlug(funeralHomeName);
    return `${homeSlug}/${nameSlug}`;
  }
  
  return nameSlug;
}

// Validate slug format
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
}
```

## Usage Examples

### Auto-Save Integration

```svelte
<script>
  import { useAutoSave } from '$lib/composables/useAutoSave';
  
  export let memorialId: string;
  let services = $state({});
  let calculatorData = $state({});
  
  const autoSave = useAutoSave(memorialId, {
    delay: 2000,
    onSave: (success, error) => {
      if (success) {
        console.log('✅ Auto-saved successfully');
      } else {
        console.error('❌ Auto-save failed:', error);
      }
    }
  });
  
  // Trigger auto-save when data changes
  $effect(() => {
    autoSave.triggerAutoSave({ services, calculatorData });
  });
</script>
```

### Error Handling Integration

```typescript
import { handleError, ErrorCodes } from '$lib/utils/errorHandler';

async function saveMemorial(data: Memorial) {
  try {
    const response = await fetch('/api/memorials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Save failed');
    }
    
    return await response.json();
  } catch (error) {
    return handleError(error, {
      component: 'MemorialForm',
      action: 'save',
      memorialId: data.id
    });
  }
}
```

---

*These utilities provide the foundation for consistent data handling, error management, and user experience across the TributeStream platform.*
