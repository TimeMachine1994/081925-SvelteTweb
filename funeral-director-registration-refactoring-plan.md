# Funeral Director Registration Refactoring Plan

## 1. Executive Summary

This document outlines the comprehensive refactoring plan for the funeral director registration system at `/register/funeral-director`. The current simple registration form will be transformed into a detailed service coordination form that collects comprehensive funeral service information while maintaining the same core functionality of account creation, memorial setup, and auto-login flow.

### Current State vs. Target State

**Current State:**
- Simple 5-field form (loved one name, director name, email, phone, funeral home)
- Creates user account with `owner` role
- Creates basic memorial with slug
- Auto-login via custom token
- Basic email notification with login credentials

**Target State:**
- Comprehensive 12+ field service coordination form
- Enhanced memorial creation with detailed service information
- Live URL preview functionality
- Family contact information collection
- Service scheduling and location details
- Contact preference management
- Same authentication and auto-login flow
- Enhanced email notifications with service details

## 2. Current System Analysis

### 2.1. Existing Data Flow

Based on the current implementation:

1. **Form Submission** → `+page.server.ts` action
2. **User Creation** → Firebase Auth with generated password
3. **Role Assignment** → Custom claim `role: 'owner'`
4. **User Profile** → Firestore `users` collection
5. **Memorial Creation** → Firestore `memorials` collection with basic slug
6. **Email Notification** → SendGrid with login credentials
7. **Auto-Login** → Custom token → `/auth/session` → redirect to portal

### 2.2. Current Memorial Schema

The existing `Memorial` interface includes:
```typescript
interface Memorial {
  id: string;
  lovedOneName: string;
  slug: string;
  fullSlug: string;
  createdByUserId: string;
  creatorEmail: string;
  creatorName: string;
  directorFullName?: string;
  funeralHomeName?: string;
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  // ... other fields
}
```

**Key Insight:** The existing schema already supports many of the new fields we need!

## 3. Data Model Enhancements

### 3.1. Memorial Schema Extensions

The current `Memorial` interface already includes most required fields. We need to add:

```typescript
interface Memorial {
  // Existing fields (already supported)
  lovedOneName: string;
  slug: string;
  directorFullName?: string;
  funeralHomeName?: string;
  memorialDate?: string;
  memorialTime?: string;
  memorialLocationName?: string;
  memorialLocationAddress?: string;
  
  // New fields to add
  familyContactName?: string;
  familyContactEmail?: string;
  familyContactPhone?: string;
  familyContactPreference?: 'phone' | 'email';
  directorEmail?: string;
  additionalNotes?: string;
}
```

### 3.2. User Profile Enhancements

Extend the user profile to store director-specific information:

```typescript
interface User {
  // Existing fields
  email: string;
  displayName: string;
  phone?: string;
  funeralHomeName?: string;
  role: string;
  createdAt: Date;
  
  // New director-specific fields
  directorEmail?: string;
  professionalInfo?: {
    licenseNumber?: string;
    yearsOfExperience?: number;
  };
}
```

## 4. Frontend Refactoring Plan

### 4.1. Enhanced Form Component

**File:** `frontend/src/routes/register/funeral-director/+page.svelte`

Transform the existing form into a comprehensive service coordination form with sections for:
- Live URL Preview
- Family Information
- Funeral Director & Service Details
- Memorial Location
- Contact Preference
- Additional Notes

### 4.2. New Component: Live URL Preview

**File:** `frontend/src/lib/components/LiveUrlPreview.svelte`

Real-time URL generation based on loved one's name input.

## 5. Backend Refactoring Plan

### 5.1. Enhanced Server Action

**File:** `frontend/src/routes/register/funeral-director/+page.server.ts`

Enhanced validation, comprehensive data collection, and improved error handling.

## 6. Email Service Enhancement

### 6.1. Enhanced Registration Email Function

**File:** `frontend/src/lib/server/email.ts`

Professional email template with service details summary and clear next steps.

## 7. Database Migration Strategy

### 7.1. Firestore Schema Updates

**Backward Compatibility Approach:**
- All new fields are optional to maintain compatibility with existing memorials
- Existing memorials will continue to function without the new fields
- New registrations will populate the enhanced fields

**Migration Steps:**

1. **Phase 1: Add New Fields (Non-Breaking)**
   ```typescript
   // Add to existing Memorial documents
   {
     familyContactName?: string;
     familyContactEmail?: string;
     familyContactPhone?: string;
     familyContactPreference?: 'phone' | 'email';
     directorEmail?: string;
     additionalNotes?: string;
   }
   ```

2. **Phase 2: Update FireCMS Schema**
   - Update `firecms/src/types/memorial.ts`
   - Update `firecms/src/collections/memorials.tsx`
   - Add new fields to admin interface

3. **Phase 3: Data Validation Script**
   ```typescript
   // Optional: Script to validate existing data
   async function validateMemorialData() {
     const memorials = await adminDb.collection('memorials').get();
     memorials.forEach(doc => {
       const data = doc.data();
       // Log any data inconsistencies
       if (!data.creatorEmail && !data.familyContactEmail) {
         console.warn(`Memorial ${doc.id} missing contact email`);
       }
     });
   }
   ```

### 7.2. User Collection Updates

**Enhanced User Profile Fields:**
```typescript
// Add to existing User documents
{
  directorEmail?: string;
  professionalInfo?: {
    licenseNumber?: string;
    yearsOfExperience?: number;
  };
}
```

## 8. Integration with Existing Systems

### 8.1. Authentication Flow (No Changes Required)

The existing authentication flow remains unchanged:
- Firebase Auth user creation
- Custom claims for role assignment
- Session management via cookies
- Auto-login via custom tokens

### 8.2. Role-Based Access Control (No Changes Required)

The enhanced registration maintains the existing RBAC system:
- Users created with `owner` role
- Access to owner portal functionality
- Existing permission structure preserved

### 8.3. Admin Dashboard Integration

**Enhanced Admin View:**
- Admin dashboard will automatically display new fields
- No code changes required due to dynamic rendering
- Enhanced memorial details in admin interface

## 9. Testing Strategy

### 9.1. Unit Tests

**Frontend Component Tests:**
```typescript
// Test file: src/routes/register/funeral-director/+page.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import FuneralDirectorRegistration from './+page.svelte';

describe('Funeral Director Registration', () => {
  test('renders all form sections', () => {
    const { getByText } = render(FuneralDirectorRegistration);
    expect(getByText('Family Information')).toBeInTheDocument();
    expect(getByText('Funeral Director & Service Details')).toBeInTheDocument();
    expect(getByText('Memorial Location')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const { getByRole, getByText } = render(FuneralDirectorRegistration);
    const submitButton = getByRole('button', { name: /submit form/i });
    
    await fireEvent.click(submitButton);
    expect(getByText(/please fill out all required fields/i)).toBeInTheDocument();
  });

  test('generates live URL preview', async () => {
    const { getByLabelText, getByText } = render(FuneralDirectorRegistration);
    const nameInput = getByLabelText(/loved one's full name/i);
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    expect(getByText(/celebration-of-life-for-john-doe/)).toBeInTheDocument();
  });
});
```

**Backend Action Tests:**
```typescript
// Test file: src/routes/register/funeral-director/+page.server.test.ts
import { describe, test, expect, vi } from 'vitest';
import { actions } from './+page.server';

describe('Funeral Director Registration Action', () => {
  test('validates required fields', async () => {
    const formData = new FormData();
    formData.append('lovedOneName', '');
    
    const result = await actions.default({
      request: { formData: () => Promise.resolve(formData) }
    });
    
    expect(result.status).toBe(400);
    expect(result.data.error).toContain('required fields');
  });

  test('creates user and memorial successfully', async () => {
    // Mock Firebase Admin SDK
    const mockUserRecord = { uid: 'test-uid' };
    vi.mocked(adminAuth.createUser).mockResolvedValue(mockUserRecord);
    
    const formData = new FormData();
    formData.append('lovedOneName', 'John Doe');
    formData.append('directorName', 'Jane Director');
    formData.append('familyContactEmail', 'family@example.com');
    formData.append('familyContactPhone', '555-0123');
    
    // Test implementation
  });
});
```

### 9.2. Integration Tests

**Firebase Emulator Tests:**
```typescript
// Test file: tests/integration/registration.test.ts
import { test, expect } from '@playwright/test';

test.describe('Funeral Director Registration Integration', () => {
  test('complete registration flow', async ({ page }) => {
    await page.goto('/register/funeral-director');
    
    // Fill out form
    await page.fill('[name="lovedOneName"]', 'John Doe');
    await page.fill('[name="directorName"]', 'Jane Director');
    await page.fill('[name="familyContactEmail"]', 'family@example.com');
    await page.fill('[name="familyContactPhone"]', '555-0123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify redirect to portal
    await expect(page).toHaveURL(/\/my-portal/);
    
    // Verify memorial creation
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
```

### 9.3. End-to-End Tests

**Complete User Journey:**
```typescript
// Test file: e2e/funeral-director-registration.spec.ts
import { test, expect } from '@playwright/test';

test('funeral director registration and memorial management', async ({ page }) => {
  // Registration
  await page.goto('/register/funeral-director');
  await fillRegistrationForm(page);
  await page.click('button[type="submit"]');
  
  // Auto-login verification
  await expect(page).toHaveURL(/\/my-portal/);
  
  // Memorial management
  await page.click('text=Edit Memorial');
  await expect(page.locator('[name="lovedOneName"]')).toHaveValue('John Doe');
  
  // Photo upload
  await page.click('text=Upload Photos');
  // ... photo upload test
});
```

## 10. Implementation Roadmap

### 10.1. Phase 1: Foundation (Week 1)

**Tasks:**
- [ ] Create `LiveUrlPreview.svelte` component
- [ ] Update memorial TypeScript interfaces
- [ ] Add new fields to FireCMS schema
- [ ] Write unit tests for new components

**Deliverables:**
- Working URL preview component
- Updated type definitions
- Enhanced admin interface

### 10.2. Phase 2: Form Enhancement (Week 2)

**Tasks:**
- [ ] Refactor `+page.svelte` with new form sections
- [ ] Implement form validation
- [ ] Add responsive CSS styling
- [ ] Test form functionality

**Deliverables:**
- Complete enhanced registration form
- Form validation and error handling
- Mobile-responsive design

### 10.3. Phase 3: Backend Integration (Week 3)

**Tasks:**
- [ ] Update `+page.server.ts` action
- [ ] Enhance email service
- [ ] Implement comprehensive error handling
- [ ] Add backend validation

**Deliverables:**
- Enhanced server-side processing
- Professional email notifications
- Robust error handling

### 10.4. Phase 4: Testing & Deployment (Week 4)

**Tasks:**
- [ ] Complete unit test suite
- [ ] Integration testing with Firebase emulator
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Production deployment

**Deliverables:**
- Comprehensive test coverage
- Performance benchmarks
- Production-ready system

## 11. Risk Assessment & Mitigation

### 11.1. Technical Risks

**Risk: Data Migration Issues**
- **Mitigation:** Backward-compatible schema design
- **Fallback:** Gradual rollout with feature flags

**Risk: Email Delivery Problems**
- **Mitigation:** Enhanced error handling and logging
- **Fallback:** Admin notification system for failed emails

**Risk: Form Complexity Overwhelming Users**
- **Mitigation:** Progressive disclosure and clear section organization
- **Fallback:** Optional field design with smart defaults

### 11.2. Business Risks

**Risk: User Adoption Resistance**
- **Mitigation:** Clear value proposition and improved UX
- **Fallback:** Parallel simple form option

**Risk: Increased Support Burden**
- **Mitigation:** Comprehensive help text and validation
- **Fallback:** Enhanced documentation and training

## 12. Success Metrics

### 12.1. Technical Metrics

- **Form Completion Rate:** >90% (vs current baseline)
- **Error Rate:** <5% of submissions
- **Page Load Time:** <2 seconds
- **Email Delivery Rate:** >98%

### 12.2. Business Metrics

- **User Satisfaction:** Survey score >4.5/5
- **Support Ticket Reduction:** 20% fewer registration-related tickets
- **Data Quality:** 95% of registrations include service details
- **Conversion Rate:** Maintain or improve current registration conversion

## 13. Conclusion

This refactoring plan transforms the funeral director registration from a simple account creation process into a comprehensive service coordination system while maintaining all existing functionality. The phased approach ensures minimal risk and allows for iterative improvements based on user feedback.

The enhanced system will provide:
- Better data collection for service coordination
- Improved user experience with live previews
- Professional email communications
- Comprehensive service detail tracking
- Maintained authentication and security standards

**Next Steps:**
1. Review and approve this refactoring plan
2. Begin Phase 1 implementation
3. Set up monitoring and feedback collection
4. Plan user training and documentation updates