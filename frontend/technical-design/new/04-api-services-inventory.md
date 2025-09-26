# TributeStream V1 - API Services Inventory

## Overview
This document provides a comprehensive inventory of all API endpoints in TributeStream V1, organized by functional area with detailed specifications for each service.

## API Architecture

### Design Patterns
- **RESTful Design**: Standard HTTP methods and status codes
- **Type Safety**: TypeScript interfaces for all requests/responses
- **Role-Based Authorization**: Permission checks on all endpoints
- **Audit Logging**: All significant actions logged
- **Error Handling**: Structured error responses
- **Request Validation**: Input validation and sanitization

### Common Response Patterns
```typescript
// Success Response
{ success: true, data?: any, message?: string }

// Error Response  
{ error: string, details?: any }

// Paginated Response
{ data: any[], total: number, page: number, limit: number }
```

## Authentication & Session Management

### `/api/session`
**Purpose**: Create and manage user sessions

#### POST `/api/session`
- **Description**: Create session cookie from Firebase ID token
- **Request**: `{ idToken: string, slug?: string }`
- **Response**: `{ redirectTo: string }`
- **Features**:
  - 24-hour session cookie creation
  - Role-based redirect logic
  - User record propagation delay handling
  - Audit logging for login events

### `/api/logout`
**Purpose**: Session termination

#### GET `/api/logout`
- **Description**: Clear session cookie and redirect
- **Response**: Redirect to login page
- **Features**: Secure cookie removal

### `/api/clear-session`
**Purpose**: Alternative session clearing endpoint

#### GET `/api/clear-session`
- **Description**: Clear session cookie
- **Response**: JSON confirmation

### Role Management (Development)

#### POST `/api/set-role-claim`
- **Description**: Set user role claims (development only)
- **Request**: `{ uid: string, role: string }`
- **Response**: `{ success: boolean }`

#### POST `/api/set-admin-claim`
- **Description**: Set admin privileges (development only)
- **Request**: `{ uid: string, admin: boolean }`
- **Response**: `{ success: boolean }`

## Admin APIs

### `/api/admin/users`
**Purpose**: User management for administrators

#### GET `/api/admin/users`
- **Authorization**: Admin role required
- **Description**: Retrieve all users with memorial counts
- **Response**: `UserManagementData[]`
- **Features**:
  - Memorial count aggregation
  - Suspension status tracking
  - Creation date sorting

#### POST `/api/admin/users`
- **Authorization**: Admin role required
- **Description**: Create new user account
- **Request**: `{ email: string, displayName?: string, role: UserRole, isAdmin?: boolean }`
- **Response**: `{ success: boolean }`
- **Features**:
  - Role assignment
  - Audit logging
  - Email validation

### `/api/admin/stats`
**Purpose**: Dashboard statistics

#### GET `/api/admin/stats`
- **Authorization**: Admin role required
- **Description**: Get system statistics
- **Response**: `AdminDashboardStats`
- **Metrics**:
  - Total users and memorials
  - Active livestreams
  - Weekly growth statistics

### `/api/admin/create-memorial`
**Purpose**: Admin memorial creation

#### POST `/api/admin/create-memorial`
- **Authorization**: Admin role required
- **Description**: Create memorial as administrator
- **Request**: Memorial creation data
- **Response**: `{ memorialId: string, slug: string }`

### `/api/admin/audit-logs`
**Purpose**: Audit log access

#### GET `/api/admin/audit-logs`
- **Authorization**: Admin role required
- **Description**: Retrieve audit logs with filtering
- **Query Parameters**:
  - `action`: Filter by action type
  - `userEmail`: Filter by user email
  - `resourceType`: Filter by resource type
  - `dateFrom`: Start date filter
  - `dateTo`: End date filter
  - `limit`: Result limit (max 1000)
- **Response**: `{ events: AuditEvent[], summary: AuditSummary }`
- **Features**:
  - Advanced filtering capabilities
  - Summary statistics
  - Access logging for accountability

## Funeral Director APIs

### `/api/funeral-director/register`
**Purpose**: Funeral director registration

#### POST `/api/funeral-director/register`
- **Description**: Register new funeral director business
- **Request**: `FuneralDirectorRegistration`
- **Response**: `{ success: boolean, uid: string }`
- **Features**:
  - Auto-approval in V1
  - Business profile creation
  - Role assignment

### `/api/funeral-director/create-memorial`
**Purpose**: Memorial creation for families

#### POST `/api/funeral-director/create-memorial`
- **Authorization**: Funeral director role required
- **Description**: Create comprehensive memorial for family
- **Request**: `FuneralDirectorMemorialRequest`
- **Response**: `{ memorialId: string, fullSlug: string }`
- **Features**:
  - Family account creation
  - Password generation
  - Registration email sending
  - Comprehensive memorial data

### `/api/funeral-director/create-customer-memorial`
**Purpose**: Enhanced memorial creation

#### POST `/api/funeral-director/create-customer-memorial`
- **Authorization**: Funeral director role required
- **Description**: Create memorial with enhanced features
- **Request**: Enhanced memorial data
- **Response**: Memorial creation confirmation

### `/api/funeral-director/memorials`
**Purpose**: Assigned memorial management

#### GET `/api/funeral-director/memorials`
- **Authorization**: Funeral director role required
- **Description**: Get memorials assigned to funeral director
- **Response**: `Memorial[]`
- **Features**: Filtered by `funeralDirectorUid`

### `/api/funeral-director/profile`
**Purpose**: Funeral director profile management

#### GET `/api/funeral-director/profile`
- **Authorization**: Funeral director role required
- **Description**: Get funeral director profile
- **Response**: `FuneralDirector`

#### POST `/api/funeral-director/profile`
- **Authorization**: Funeral director role required
- **Description**: Update funeral director profile
- **Request**: Profile update data
- **Response**: `{ success: boolean }`

### `/api/funeral-director/quick-register-family`
**Purpose**: Quick family registration

#### POST `/api/funeral-director/quick-register-family`
- **Authorization**: Funeral director role required
- **Description**: Quickly register family for memorial
- **Request**: Family registration data
- **Response**: Registration confirmation

## Memorial Management APIs

### `/api/memorials/[memorialId]/assign`
**Purpose**: Funeral director assignment

#### POST `/api/memorials/[memorialId]/assign`
- **Authorization**: Admin or owner access required
- **Description**: Assign funeral director to memorial
- **Request**: `{ funeralDirectorUid: string }`
- **Response**: `{ success: boolean }`

### `/api/memorials/[memorialId]/embeds`
**Purpose**: Video embed management

#### GET `/api/memorials/[memorialId]/embeds`
- **Authorization**: View access required
- **Description**: Get memorial video embeds
- **Response**: `Embed[]`

#### POST `/api/memorials/[memorialId]/embeds`
- **Authorization**: Edit access required
- **Description**: Add video embed to memorial
- **Request**: `{ title: string, type: 'youtube' | 'vimeo', embedUrl: string }`
- **Response**: `{ embedId: string }`

### `/api/memorials/[memorialId]/follow`
**Purpose**: Memorial following

#### POST `/api/memorials/[memorialId]/follow`
- **Authorization**: Authenticated user required
- **Description**: Follow/unfollow memorial
- **Request**: `{ action: 'follow' | 'unfollow' }`
- **Response**: `{ success: boolean, followerCount: number }`

### `/api/memorials/[memorialId]/schedule`
**Purpose**: Schedule management

#### GET `/api/memorials/[memorialId]/schedule`
- **Authorization**: View access required
- **Description**: Get memorial schedule
- **Response**: Schedule data

#### POST `/api/memorials/[memorialId]/schedule`
- **Authorization**: Edit access required
- **Description**: Update memorial schedule
- **Request**: Schedule update data
- **Response**: `{ success: boolean }`

### `/api/memorials/[memorialId]/schedule/auto-save`
**Purpose**: Auto-save functionality

#### POST `/api/memorials/[memorialId]/schedule/auto-save`
- **Authorization**: Edit access required
- **Description**: Auto-save schedule changes
- **Request**: Schedule data
- **Response**: `{ success: boolean, timestamp: string }`

## Livestream APIs

### `/api/livestream/create`
**Purpose**: Livestream session creation

#### POST `/api/livestream/create`
- **Authorization**: Authenticated user required
- **Description**: Create new livestream session
- **Request**: Livestream configuration
- **Response**: `{ streamId: string, streamUrl: string }`

### `/api/memorials/[memorialId]/livestream`
**Purpose**: Memorial livestream management

#### GET `/api/memorials/[memorialId]/livestream`
- **Authorization**: View access required
- **Description**: Get livestream configuration
- **Response**: Livestream data

#### POST `/api/memorials/[memorialId]/livestream`
- **Authorization**: Edit access required
- **Description**: Update livestream configuration
- **Request**: Livestream settings
- **Response**: `{ success: boolean }`

### `/api/memorials/[memorialId]/livestream/start`
**Purpose**: Livestream control

#### POST `/api/memorials/[memorialId]/livestream/start`
- **Authorization**: Edit access required
- **Description**: Start livestream session
- **Request**: Start parameters
- **Response**: `{ streamUrl: string, streamKey: string }`

### `/api/memorials/[memorialId]/livestream/whip`
**Purpose**: WHIP protocol support

#### GET `/api/memorials/[memorialId]/livestream/whip`
- **Authorization**: Edit access required
- **Description**: WHIP protocol endpoint for streaming
- **Response**: WHIP configuration

### `/api/memorials/[memorialId]/livestream/archive`
**Purpose**: Livestream archive management

#### GET `/api/memorials/[memorialId]/livestream/archive`
- **Authorization**: View access required
- **Description**: Get all archived livestream entries
- **Response**: `LivestreamArchiveEntry[]`
- **Features**:
  - Returns all archive entries for funeral directors/owners
  - Filters visible entries for public viewers
  - Includes recording status and metadata

#### POST `/api/memorials/[memorialId]/livestream/archive`
- **Authorization**: Edit access required
- **Description**: Create new archive entry
- **Request**: `{ title: string, description?: string, cloudflareId: string }`
- **Response**: `{ success: boolean, entryId: string }`

### `/api/memorials/[memorialId]/livestream/archive/[entryId]`
**Purpose**: Individual archive entry management

#### PUT `/api/memorials/[memorialId]/livestream/archive/[entryId]`
- **Authorization**: Edit access required
- **Description**: Update archive entry (visibility, title, etc.)
- **Request**: Archive entry updates
- **Response**: `{ success: boolean }`

#### DELETE `/api/memorials/[memorialId]/livestream/archive/[entryId]`
- **Authorization**: Edit access required
- **Description**: Delete archive entry
- **Response**: `{ success: boolean }`

### `/api/memorials/[memorialId]/livestream/archive/check-recordings`
**Purpose**: Recording status verification

#### POST `/api/memorials/[memorialId]/livestream/archive/check-recordings`
- **Authorization**: Edit access required
- **Description**: Check and update recording status for all archive entries
- **Response**: `{ updated: number, summary: string }`
- **Features**:
  - Queries Cloudflare API for recording status
  - Updates recordingReady and playback URLs
  - Returns summary of updates made

### `/api/memorials/[memorialId]/scheduled-services`
**Purpose**: Multi-service streaming management

#### GET `/api/memorials/[memorialId]/scheduled-services`
- **Authorization**: View access required
- **Description**: Get all scheduled services for memorial
- **Response**: `ScheduledService[]`
- **Features**:
  - Converts Memorial.services to scheduled service format
  - Includes stream credentials and status
  - Supports main + additional services

#### POST `/api/memorials/[memorialId]/scheduled-services`
- **Authorization**: Edit access required
- **Description**: Create new scheduled service
- **Request**: Service configuration
- **Response**: `{ success: boolean, serviceId: string }`

### `/api/memorials/[memorialId]/scheduled-services/[serviceId]`
**Purpose**: Individual scheduled service management

#### PUT `/api/memorials/[memorialId]/scheduled-services/[serviceId]`
- **Authorization**: Edit access required
- **Description**: Update scheduled service (status, visibility)
- **Request**: `{ status?: string, isVisible?: boolean }`
- **Response**: `{ success: boolean }`
- **Features**:
  - Updates service status (scheduled → live → completed)
  - Controls public visibility
  - Manages stream session data

#### DELETE `/api/memorials/[memorialId]/scheduled-services/[serviceId]`
- **Authorization**: Edit access required
- **Description**: Delete scheduled service
- **Response**: `{ success: boolean }`

### `/api/memorials/[memorialId]/livestreams`
**Purpose**: Livestream session management

#### GET `/api/memorials/[memorialId]/livestreams`
- **Authorization**: View access required
- **Description**: Get all livestream sessions
- **Response**: `LivestreamSession[]`

### `/api/memorials/[memorialId]/stream/status`
**Purpose**: Stream status monitoring

#### GET `/api/memorials/[memorialId]/stream/status`
- **Authorization**: View access required
- **Description**: Get current stream status
- **Response**: `{ status: string, viewers: number, uptime: number }`

### `/api/memorials/[memorialId]/stream/mobile`
**Purpose**: Mobile streaming support

#### POST `/api/memorials/[memorialId]/stream/mobile`
- **Authorization**: Edit access required
- **Description**: Configure mobile streaming
- **Request**: Mobile stream configuration
- **Response**: Mobile stream settings

## Payment & Booking APIs

### `/api/create-payment-intent`
**Purpose**: Stripe payment processing

#### POST `/api/create-payment-intent`
- **Authorization**: Authenticated user required
- **Description**: Create Stripe payment intent
- **Request**: `{ amount: number, currency: string, metadata: object }`
- **Response**: `{ clientSecret: string, paymentIntentId: string }`
- **Features**:
  - Stripe integration
  - Metadata tracking
  - Error handling

### `/api/check-payment-status`
**Purpose**: Payment verification

#### GET `/api/check-payment-status`
- **Authorization**: Authenticated user required
- **Description**: Check payment status
- **Query**: `paymentIntentId`
- **Response**: `{ status: string, amount: number, paid: boolean }`

### `/api/webhooks/stripe`
**Purpose**: Stripe webhook handling

#### POST `/api/webhooks/stripe`
- **Description**: Handle Stripe webhook events
- **Request**: Stripe webhook payload
- **Response**: `{ received: boolean }`
- **Features**:
  - Webhook signature verification
  - Payment status updates
  - Order fulfillment triggers

### `/api/webhooks/cloudflare/recording`
**Purpose**: Cloudflare Stream recording notifications

#### POST `/api/webhooks/cloudflare/recording`
- **Description**: Handle Cloudflare recording ready notifications
- **Request**: Cloudflare webhook payload
- **Response**: `{ received: boolean }`
- **Features**:
  - Automatic recording status updates
  - Updates memorial archive entries
  - Sets recordingReady and playback URLs
  - Optional webhook signature verification
  - Handles HLS/DASH URLs, thumbnails, metadata

### `/api/lock-schedule`
**Purpose**: Schedule locking after payment

#### POST `/api/lock-schedule`
- **Authorization**: Authenticated user required
- **Description**: Lock schedule after payment completion
- **Request**: `{ memorialId: string, paymentIntentId: string }`
- **Response**: `{ success: boolean, lockedAt: string }`

## Utility APIs

### `/api/contact`
**Purpose**: Contact form processing

#### POST `/api/contact`
- **Description**: Process contact form submissions
- **Request**: `{ name: string, email: string, message: string, subject?: string }`
- **Response**: `{ success: boolean }`
- **Features**:
  - Email validation
  - Spam protection
  - Email delivery

### Email APIs

#### POST `/api/send-confirmation-email`
- **Authorization**: System or admin access
- **Description**: Send confirmation emails
- **Request**: Email template data
- **Response**: `{ sent: boolean }`

#### POST `/api/send-action-required-email`
- **Authorization**: System or admin access
- **Description**: Send action required notifications
- **Request**: Action details
- **Response**: `{ sent: boolean }`

#### POST `/api/send-failure-email`
- **Authorization**: System or admin access
- **Description**: Send failure notifications
- **Request**: Failure details
- **Response**: `{ sent: boolean }`

### `/api/memorial/follow`
**Purpose**: Memorial following (alternative endpoint)

#### POST `/api/memorial/follow`
- **Authorization**: Authenticated user required
- **Description**: Follow memorial (global endpoint)
- **Request**: `{ memorialId: string, action: 'follow' | 'unfollow' }`
- **Response**: `{ success: boolean }`

## Development & Testing APIs

### `/api/dev-role-switch`
**Purpose**: Development role switching

#### POST `/api/dev-role-switch`
- **Description**: Switch user roles in development
- **Request**: `{ email: string, password: string }`
- **Response**: `{ success: boolean, redirectTo: string }`
- **Features**:
  - Development environment only
  - Predefined test accounts only
  - Session cookie creation
  - Role-based redirection

### `/api/create-test-accounts`
**Purpose**: Test account creation

#### POST `/api/create-test-accounts`
- **Description**: Create predefined test accounts
- **Response**: `{ created: string[], existing: string[] }`
- **Features**:
  - Admin, director, owner, viewer accounts
  - Development environment only
  - Password: test123 for all accounts

### `/api/fix-test-accounts`
**Purpose**: Test account maintenance

#### POST `/api/fix-test-accounts`
- **Description**: Fix issues with test accounts
- **Response**: `{ fixed: string[], errors: string[] }`
- **Features**:
  - Role claim fixes
  - Profile synchronization
  - Development environment only

### `/api/set-role-claim`
**Purpose**: Development role assignment

#### POST `/api/set-role-claim`
- **Description**: Set user role claims (development only)
- **Request**: `{ uid: string, role: string }`
- **Response**: `{ success: boolean }`
- **Features**:
  - Firebase Auth custom claims
  - Development environment only

### `/api/set-admin-claim`
**Purpose**: Development admin assignment

#### POST `/api/set-admin-claim`
- **Description**: Set admin privileges (development only)
- **Request**: `{ uid: string, admin: boolean }`
- **Response**: `{ success: boolean }`
- **Features**:
  - Firebase Auth admin claims
  - Development environment only

## API Security Features

### Authentication
- **Session Verification**: All protected endpoints verify session cookies
- **Role Validation**: Role-specific endpoint access control
- **Token Refresh**: Automatic token refresh handling

### Authorization
- **Resource-Level Access**: Memorial-specific permission checks
- **Principle of Least Privilege**: Minimum required permissions
- **Admin Override**: Emergency admin access capabilities

### Audit & Monitoring
- **Request Logging**: All API requests logged
- **Access Tracking**: Failed access attempts monitored
- **Performance Monitoring**: Response time and error rate tracking

### Error Handling
- **Structured Responses**: Consistent error response format
- **Input Validation**: Request payload validation
- **Rate Limiting**: Protection against abuse (when implemented)

## Performance Considerations

### Optimization Strategies
- **Database Indexing**: Optimized Firestore queries
- **Connection Pooling**: Efficient Firebase Admin SDK usage
- **Response Caching**: Strategic caching for read-heavy endpoints
- **Batch Operations**: Efficient bulk data operations

### Monitoring
- **Response Times**: API endpoint performance tracking
- **Error Rates**: Failed request monitoring
- **Resource Usage**: Database and compute resource monitoring
