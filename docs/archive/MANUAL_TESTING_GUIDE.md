# Tributestream Pre-Validation Manual Testing Guide

## Overview

This guide provides comprehensive manual testing scenarios for the new pre-validation system implemented across all Tributestream registration endpoints.

## Testing Environment Setup

### Prerequisites
1. **Development server running**: `npm run dev`
2. **Firebase emulator** (optional): For isolated testing
3. **Browser dev tools open**: To monitor network requests and console logs
4. **Test email accounts**: Use disposable email services for testing

### Test Data Preparation
```
Valid Test Emails:
- newuser1@example.com
- newuser2@example.com  
- family@example.com
- director@funeral.com

Existing Test Emails (create these first):
- existing@example.com
- duplicate@example.com

Test Names:
- John Doe
- Mary Jane Smith
- José María García
```

## Test Scenarios

### 1. Main Registration Page (`/register`)

#### Test 1.1: Owner Registration - Success Flow
**Objective**: Verify successful owner registration with new email

**Steps**:
1. Navigate to `/register`
2. Fill form:
   - Name: "John Doe"
   - Email: "newowner@example.com"
   - Password: "SecurePass123"
   - Select "Create a memorial for my loved one"
3. Submit form

**Expected Results**:
- ✅ Form submits successfully
- ✅ reCAPTCHA verification completes
- ✅ User redirected to profile page
- ✅ User automatically logged in
- ✅ Console shows: "Email validation passed"

#### Test 1.2: Owner Registration - Duplicate Email
**Objective**: Verify fast failure for duplicate email

**Steps**:
1. Navigate to `/register`
2. Fill form with existing email: "existing@example.com"
3. Submit form

**Expected Results**:
- ❌ Error appears within 500ms
- ❌ Error message: "An account with email existing@example.com already exists..."
- ❌ Email field highlighted in red
- ❌ No reCAPTCHA prompt shown
- ❌ No password generation or other processing

#### Test 1.3: Viewer Registration - Success Flow
**Steps**:
1. Navigate to `/register`
2. Fill form with new email
3. Select "View and support memorials"
4. Submit form

**Expected Results**:
- ✅ Successful registration
- ✅ Redirected to profile page
- ✅ User role set to "viewer"

#### Test 1.4: Invalid Email Format
**Steps**:
1. Navigate to `/register`
2. Enter invalid email: "invalid-email"
3. Submit form

**Expected Results**:
- ❌ Error: "Please enter a valid email address."
- ❌ Email field highlighted
- ❌ Fast failure (no server request)

### 2. Loved One Registration (`/register/loved-one`)

#### Test 2.1: Family Registration - Success Flow
**Steps**:
1. Navigate to `/register/loved-one`
2. Fill form:
   - Loved One's Name: "Mary Smith"
   - Your Name: "John Smith"
   - Your Email: "family@example.com"
   - Your Phone: "555-1234"
3. Submit form

**Expected Results**:
- ✅ Memorial created with unique slug
- ✅ User account created and logged in
- ✅ Redirected to memorial page
- ✅ Email sent to family with credentials

#### Test 2.2: Family Registration - Duplicate Email
**Steps**:
1. Use existing email in form
2. Submit

**Expected Results**:
- ❌ Fast error response
- ❌ Email field highlighted
- ❌ No memorial creation attempted

#### Test 2.3: Memorial Slug Uniqueness
**Steps**:
1. Create memorial for "John Doe"
2. Immediately create another for "John Doe"

**Expected Results**:
- ✅ First memorial: `celebration-of-life-for-john-doe`
- ✅ Second memorial: `celebration-of-life-for-john-doe-1`
- ✅ Both memorials accessible

### 3. Funeral Director Registration (`/register/funeral-director`)

#### Test 3.1: Complete Funeral Director Registration
**Steps**:
1. Login as funeral director or admin
2. Navigate to `/register/funeral-director`
3. Fill comprehensive form:
   - Loved One's Name: "Robert Johnson"
   - Family Contact Name: "Sarah Johnson"
   - Family Contact Email: "sarah@example.com"
   - Family Contact Phone: "555-2345"
   - Director Name: "Michael Director"
   - Director Email: "michael@funeral.com"
   - Funeral Home: "Peaceful Rest"
   - Service Date: "2024-02-15"
   - Service Time: "14:00"
   - Location: "Main Chapel"
   - Address: "123 Memorial Ave"
4. Submit form

**Expected Results**:
- ✅ Both emails validated
- ✅ Family account created
- ✅ Memorial created with service details
- ✅ Redirected to memorial page
- ✅ Registration email sent to family

#### Test 3.2: Multiple Email Validation
**Steps**:
1. Use existing email for family contact
2. Use new email for director
3. Submit form

**Expected Results**:
- ❌ Error for family contact email
- ❌ Family contact email field highlighted
- ❌ Form submission prevented

#### Test 3.3: Optional Director Email
**Steps**:
1. Leave director email empty
2. Submit form with valid family email

**Expected Results**:
- ✅ Form submits successfully
- ✅ Only family email validated

### 4. API Endpoints Testing

#### Test 4.1: Quick Family Registration API
**Steps**:
1. Use API client (Postman/curl):
```bash
curl -X POST /api/funeral-director/quick-register-family \
  -H "Content-Type: application/json" \
  -d '{
    "lovedOneName": "Alice Cooper",
    "familyEmail": "alice-family@example.com",
    "serviceDate": "2024-03-01",
    "serviceTime": "10:00"
  }'
```

**Expected Results**:
- ✅ JSON response with success
- ✅ Memorial created
- ✅ Family account created

#### Test 4.2: API Error Handling
**Steps**:
1. Use existing email in API request
2. Send request

**Expected Results**:
- ❌ 400 status code
- ❌ JSON error with field targeting:
```json
{
  "error": "An account with the provided email already exists...",
  "field": "familyEmail"
}
```

### 5. Performance Testing

#### Test 5.1: Response Time Measurement
**Steps**:
1. Open browser dev tools → Network tab
2. Submit form with duplicate email
3. Measure response time

**Expected Results**:
- ✅ Error response within 500ms
- ✅ No unnecessary network requests
- ✅ Console log: "Email validation failed"

#### Test 5.2: Load Testing
**Steps**:
1. Rapidly submit multiple registration attempts
2. Monitor server performance

**Expected Results**:
- ✅ Consistent fast responses
- ✅ No server overload
- ✅ Rate limiting working

### 6. Error Message Consistency

#### Test 6.1: Cross-Endpoint Consistency
**Steps**:
1. Test duplicate email on each endpoint:
   - `/register` (owner)
   - `/register` (viewer)
   - `/register/loved-one`
   - `/register/funeral-director`
   - API endpoints

**Expected Results**:
- ✅ Identical error message format
- ✅ Consistent field targeting
- ✅ Same response timing

### 7. Frontend Integration Testing

#### Test 7.1: Field Highlighting
**Steps**:
1. Submit form with duplicate email
2. Observe field highlighting

**Expected Results**:
- ✅ Email field border turns red
- ✅ Error message appears below field
- ✅ Other fields remain normal

#### Test 7.2: Error Clearing
**Steps**:
1. Trigger field error
2. Correct the email
3. Resubmit form

**Expected Results**:
- ✅ Error highlighting removed
- ✅ Error message cleared
- ✅ Form submits successfully

### 8. Edge Cases Testing

#### Test 8.1: Special Characters in Names
**Steps**:
1. Use names with special characters:
   - "José María García"
   - "O'Connor"
   - "Smith-Johnson"

**Expected Results**:
- ✅ Slugs generated correctly
- ✅ No encoding issues
- ✅ URLs work properly

#### Test 8.2: Very Long Names
**Steps**:
1. Use extremely long name (100+ characters)

**Expected Results**:
- ✅ Slug truncated appropriately
- ✅ No URL issues
- ✅ Database storage works

#### Test 8.3: Network Failure Simulation
**Steps**:
1. Disable network in dev tools
2. Submit registration form

**Expected Results**:
- ❌ Graceful error handling
- ❌ User-friendly error message
- ❌ No application crash

### 9. Security Testing

#### Test 9.1: reCAPTCHA Bypass Attempt
**Steps**:
1. Disable JavaScript
2. Submit form

**Expected Results**:
- ❌ Server rejects request
- ❌ reCAPTCHA required message

#### Test 9.2: CSRF Protection
**Steps**:
1. Submit form from external site

**Expected Results**:
- ❌ Request blocked
- ❌ CSRF error

### 10. Mobile Testing

#### Test 10.1: Mobile Registration Flow
**Steps**:
1. Test on mobile device/emulator
2. Complete registration flow

**Expected Results**:
- ✅ Responsive design works
- ✅ Error messages display properly
- ✅ Field highlighting visible

## Test Results Checklist

### Performance Metrics
- [ ] Duplicate email errors < 500ms
- [ ] Successful registrations < 3 seconds
- [ ] No wasted processing on failures
- [ ] Server load reduced

### Consistency Metrics
- [ ] Identical error messages across endpoints
- [ ] Consistent field targeting
- [ ] Uniform slug generation
- [ ] Standardized user profiles

### User Experience Metrics
- [ ] Clear error messaging
- [ ] Field-specific highlighting
- [ ] No partial data creation
- [ ] Smooth registration flows

### Technical Metrics
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] No console errors
- [ ] Proper error logging

## Bug Reporting Template

```
**Bug Title**: [Brief description]

**Endpoint**: [Which registration endpoint]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 

**Browser**: [Chrome/Firefox/Safari version]
**Environment**: [Development/Staging/Production]

**Console Errors**: [Any JavaScript errors]
**Network Response**: [HTTP status and response body]

**Priority**: [High/Medium/Low]
```

## Success Criteria

### Must Pass
- ✅ All duplicate email scenarios return errors within 500ms
- ✅ All successful registrations complete within 3 seconds
- ✅ Error messages are identical across all endpoints
- ✅ Field-specific errors highlight correct fields
- ✅ No partial data creation on validation failures

### Should Pass
- ✅ Memorial slugs are always unique
- ✅ User profiles have consistent structure
- ✅ API responses follow standard format
- ✅ Mobile experience is smooth

### Nice to Have
- ✅ Special characters handled gracefully
- ✅ Network failures handled gracefully
- ✅ Performance under load is acceptable

## Completion Sign-off

**Tester**: _________________ **Date**: _________

**Results Summary**:
- Tests Passed: ___/___
- Critical Issues: ___
- Minor Issues: ___

**Ready for Production**: [ ] Yes [ ] No

**Notes**:
_________________________________
