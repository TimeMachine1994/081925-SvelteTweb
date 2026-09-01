# Tributestream API Documentation

## Overview

Tributestream provides a comprehensive API for user registration, memorial creation, and funeral director services. All endpoints implement pre-validation for optimal performance and consistent error handling.

## Authentication

Most API endpoints require authentication via SvelteKit sessions. Users must be logged in and have appropriate role permissions.

## Error Handling

All endpoints follow a consistent error response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message",
  "field": "fieldName",  // Optional: for field-specific errors
  "code": "ERROR_CODE"   // Optional: for programmatic handling
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Registration Endpoints

### 1. Main Registration

#### Register Owner
**POST** `/register?/registerOwner`

Creates a new memorial owner account.

**Form Data:**
```typescript
{
  name: string;           // Full name (required)
  email: string;          // Email address (required)
  password: string;       // Password (required)
  recaptchaToken: string; // reCAPTCHA token (required)
}
```

**Success Response:**
```json
{
  "success": true,
  "customToken": "firebase-custom-token"
}
```

**Error Examples:**
```json
// Duplicate email
{
  "message": "An account with email user@example.com already exists. Please use a different email or sign in to your existing account.",
  "field": "email"
}

// Missing fields
{
  "message": "Name, email and password are required"
}

// reCAPTCHA failure
{
  "message": "Security verification failed. Please try again."
}
```

#### Register Viewer
**POST** `/register?/registerViewer`

Creates a new viewer account.

**Form Data:** Same as Register Owner

**Success Response:** Same as Register Owner

#### Register Admin
**POST** `/register?/registerAdmin`

Creates a new admin account (restricted access).

**Form Data:**
```typescript
{
  email: string;          // Email address (required)
  password: string;       // Password (required)
}
```

**Success Response:** Redirects to admin dashboard

### 2. Loved One Registration

#### Create Memorial for Loved One
**POST** `/register/loved-one`

Creates a family account and memorial in one step.

**Form Data:**
```typescript
{
  lovedOneName: string;   // Name of deceased (required)
  name: string;           // Family contact name (required)
  email: string;          // Family contact email (required)
  phone?: string;         // Family contact phone (optional)
}
```

**Success Response:** Redirects to memorial page

**Error Examples:**
```json
// Duplicate email
{
  "error": "An account with email family@example.com already exists. Please use a different email or sign in to your existing account.",
  "field": "email"
}

// Missing fields
{
  "error": "Please fill out all required fields."
}
```

### 3. Funeral Director Registration

#### Enhanced Funeral Director Registration
**POST** `/register/funeral-director`

Creates a comprehensive family account and memorial with service details.

**Form Data:**
```typescript
{
  // Loved one information
  lovedOneName: string;           // Name of deceased (required)
  
  // Family contact information
  familyContactName: string;      // Primary contact name (required)
  familyContactEmail: string;     // Primary contact email (required)
  familyContactPhone: string;     // Primary contact phone (required)
  contactPreference: 'phone' | 'email'; // Contact preference (required)
  
  // Funeral director information
  directorName: string;           // Director name (required)
  directorEmail?: string;         // Director email (optional)
  funeralHomeName: string;        // Funeral home name (required)
  
  // Service information
  memorialDate?: string;          // Service date (optional)
  memorialTime?: string;          // Service time (optional)
  locationName?: string;          // Service location (optional)
  locationAddress?: string;       // Service address (optional)
  
  // Additional information
  additionalNotes?: string;       // Additional notes (optional)
}
```

**Success Response:** Redirects to memorial page

**Error Examples:**
```json
// Multiple email validation
{
  "error": "An account with email family@example.com already exists. Please use a different email or sign in to your existing account.",
  "field": "familyContactEmail"
}

// Validation failure
{
  "error": "Validation failed: Director name is required, Family contact email is required"
}
```

## API Endpoints

### 1. Funeral Director Profile Registration

#### Create Funeral Director Profile
**POST** `/api/funeral-director/register`

Creates a professional funeral director profile.

**Request Body:**
```json
{
  "companyName": "Peaceful Rest Funeral Home",
  "contactPerson": "John Director",
  "email": "john@funeral.com",
  "phone": "555-1234",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Funeral director registration completed successfully",
  "id": "user-uid"
}
```

**Error Examples:**
```json
// Missing field
{
  "error": "Missing required field: companyName"
}

// Validation error
{
  "error": "Invalid email format",
  "field": "email"
}
```

### 2. Quick Family Registration

#### Quick Register Family Memorial
**POST** `/api/funeral-director/quick-register-family`

Quickly creates a family account and memorial (funeral director only).

**Request Body:**
```json
{
  "lovedOneName": "John Doe",
  "familyEmail": "family@example.com",
  "serviceDate": "2024-01-15",
  "serviceTime": "14:00"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Family memorial created successfully",
  "memorialId": "memorial-id",
  "memorialUrl": "/memorial-slug"
}
```

**Error Examples:**
```json
// Duplicate email
{
  "error": "An account with the provided email already exists. Please use a different email or sign in to your existing account.",
  "field": "familyEmail"
}

// Missing fields
{
  "error": "All fields are required"
}

// Access denied
{
  "error": "Funeral director access required"
}
```

## Memorial Creation

### Profile Page Memorial Creation

#### Create Memorial (Owner Only)
**POST** `/profile?/createMemorial`

Creates a new memorial for existing owners.

**Form Data:**
```typescript
{
  lovedOneName: string;       // Name of deceased (required)
  recaptchaToken: string;     // reCAPTCHA token (required)
}
```

**Success Response:** Redirects to memorial page

**Error Examples:**
```json
// Payment required
{
  "message": "You must complete payment for your existing memorial before creating a new one."
}

// Missing name
{
  "message": "Loved one's name is required"
}

// Unauthorized
{
  "message": "Only owners can create memorials"
}
```

## Validation Features

### Pre-Validation Benefits

All registration endpoints implement pre-validation that:

1. **Checks email availability** before expensive operations
2. **Generates unique memorial slugs** with collision detection
3. **Validates data formats** before processing
4. **Provides field-specific errors** for better UX

### Email Validation

- **Format validation**: RFC-compliant email format checking
- **Existence checking**: Proactive Firebase Auth duplicate detection
- **Consistent messaging**: Standardized error messages across all endpoints

### Memorial Slug Generation

- **Unique generation**: Guaranteed uniqueness with counter-based collision resolution
- **SEO-friendly**: Clean, readable URLs
- **Fallback handling**: Timestamp-based fallback for high-collision scenarios

### User Profile Standardization

- **Consistent structure**: Same profile format across all registration paths
- **Role-specific fields**: Appropriate fields for each user role
- **Data validation**: Comprehensive validation with clear error messages

## Rate Limiting

All endpoints implement rate limiting to prevent abuse:

- **Registration endpoints**: 5 requests per minute per IP
- **API endpoints**: 10 requests per minute per authenticated user
- **Memorial creation**: 3 requests per minute per user

## Security Features

### reCAPTCHA Protection

All public registration endpoints require reCAPTCHA verification:

- **Registration forms**: reCAPTCHA v3 with action-specific scoring
- **Memorial creation**: Anti-spam protection
- **Score thresholds**: Configurable per action type

### Authentication Requirements

- **API endpoints**: Require valid session authentication
- **Role-based access**: Endpoints check user roles and permissions
- **CSRF protection**: Built-in SvelteKit CSRF protection

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `EMAIL_EXISTS` | Email already registered | 400 |
| `INVALID_EMAIL` | Invalid email format | 400 |
| `MISSING_FIELDS` | Required fields missing | 400 |
| `RECAPTCHA_FAILED` | reCAPTCHA verification failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `VALIDATION_ERROR` | Data validation failed | 400 |
| `PAYMENT_REQUIRED` | Payment needed for operation | 400 |
| `RATE_LIMITED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

## SDK and Integration

### Frontend Integration

All endpoints are designed for SvelteKit form actions and can be used with:

```typescript
import { enhance } from '$app/forms';

// Form enhancement with error handling
const handleSubmit: SubmitFunction = ({ formData }) => {
  return async ({ result, update }) => {
    if (result.type === 'failure') {
      // Handle field-specific errors
      if (result.data?.field) {
        fieldErrors = { [result.data.field]: result.data.message };
      } else {
        generalError = result.data?.message;
      }
    }
    await update();
  };
};
```

### API Client Example

```typescript
// API endpoint usage
const response = await fetch('/api/funeral-director/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    companyName: 'Funeral Home',
    contactPerson: 'John Director',
    email: 'john@funeral.com',
    phone: '555-1234',
    address: { /* address object */ }
  })
});

const result = await response.json();

if (!response.ok) {
  // Handle error
  console.error(result.error);
  if (result.field) {
    // Highlight specific field
    highlightField(result.field);
  }
}
```

## Changelog

### Version 2.0 (Current)
- **Added pre-validation** for all registration endpoints
- **Standardized error responses** with field targeting
- **Improved memorial slug generation** with uniqueness guarantees
- **Enhanced user profile structure** with role-specific fields
- **Added comprehensive testing** for all validation utilities

### Version 1.0
- Basic registration endpoints
- Simple error handling
- Basic memorial creation
- Firebase Auth integration
