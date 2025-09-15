# TributeStream V1 - Architecture Overview

## Overview
TributeStream is a comprehensive memorial service platform built with SvelteKit, providing livestream services, memorial management, and family support tools for funeral directors and families.

## Technology Stack

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS with custom theme system
- **State Management**: Svelte stores and reactive patterns
- **Build Tool**: Vite (via SvelteKit)

### Backend
- **Runtime**: Node.js via SvelteKit server-side rendering
- **API**: SvelteKit API routes with TypeScript
- **Authentication**: Firebase Auth with custom session cookies
- **Database**: Firebase Firestore
- **File Storage**: Firebase Storage
- **Search**: Algolia integration

### External Services
- **Payments**: Stripe integration
- **Email**: Custom email service
- **Hosting**: Firebase Hosting (production)
- **CDN**: Firebase CDN for static assets

### Development Environment
- **Emulators**: Firebase Emulator Suite (Auth, Firestore, Storage)
- **Testing**: Vitest with component testing
- **Type Checking**: TypeScript with strict mode
- **Linting**: ESLint with Svelte plugin

## Application Architecture

### Directory Structure
```
frontend/src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── portals/        # Role-specific dashboard components
│   │   ├── calculator/     # Livestream booking components
│   │   └── ui/            # Basic UI components
│   ├── server/            # Server-side utilities and services
│   │   ├── admin.ts       # Admin service layer
│   │   ├── auditLogger.ts # Comprehensive audit logging
│   │   ├── email.ts       # Email service
│   │   ├── firebase.ts    # Firebase Admin SDK
│   │   └── stripe.ts      # Stripe integration
│   ├── types/             # TypeScript interfaces
│   │   ├── memorial.ts    # Memorial data models
│   │   ├── funeral-director.ts # FD data models
│   │   ├── admin.ts       # Admin data models
│   │   └── livestream.ts  # Livestream data models
│   ├── utils/             # Client-side utilities
│   │   ├── memorialAccess.ts # Access control logic
│   │   ├── payment.ts     # Payment utilities
│   │   └── errorHandler.ts # Error handling
│   ├── composables/       # Reactive utilities
│   │   ├── useAutoSave.ts # Auto-save functionality
│   │   └── useOptimizedData.ts # Data optimization
│   ├── config/            # Configuration files
│   └── styles/            # Styling utilities
├── routes/                # SvelteKit routes (pages + API)
│   ├── api/              # API endpoints
│   │   ├── admin/        # Admin APIs
│   │   ├── funeral-director/ # FD APIs
│   │   ├── memorials/    # Memorial management APIs
│   │   └── [other APIs]  # Various service APIs
│   ├── register/         # Registration flows
│   ├── tributes/         # Memorial viewing pages
│   └── [page routes]     # Application pages
├── app.html              # Root HTML template
├── app.css               # Global styles
├── app.d.ts              # Global type definitions
└── hooks.server.ts       # Server-side middleware
```

## Key Architectural Patterns

### 1. Role-Based Access Control (RBAC)
- **Three Primary Roles**: admin, owner, funeral_director
- **Hierarchical Permissions**: Admin > Owner/FD > Public
- **Component-Level Security**: Role-based UI rendering
- **API-Level Security**: Endpoint protection with role verification

### 2. Server-Side Authentication
- **Session Cookies**: HttpOnly, secure cookies for server-side auth
- **Firebase Integration**: Firebase Auth + Admin SDK for verification
- **Middleware Pattern**: Authentication handled in `hooks.server.ts`
- **Role Claims**: Custom claims stored in Firebase Auth

### 3. Comprehensive Audit Logging
- **System-Wide Tracking**: All user actions logged
- **Structured Events**: Typed audit events with metadata
- **Security Monitoring**: Access attempts and failures tracked
- **Compliance Ready**: Audit trail for regulatory requirements

### 4. API-First Design
- **Clear Separation**: Frontend and backend logic separated
- **RESTful Patterns**: Consistent API design patterns
- **Type Safety**: Request/response types for all endpoints
- **Error Handling**: Structured error responses

### 5. Component-Based Architecture
- **Modular Design**: Reusable, focused components
- **Portal Pattern**: Role-specific dashboard components
- **Composition**: Complex UIs built from simple components
- **Type Safety**: Props and events fully typed

## Data Flow Architecture

### Authentication Flow
```
1. User Login (Firebase Auth) → 
2. ID Token Generation → 
3. Session Cookie Creation (/api/session) → 
4. Server-Side Verification (hooks.server.ts) → 
5. Role-Based Access Control
```

### Memorial Management Flow
```
1. Memorial Creation (Family/FD) → 
2. Access Control Verification → 
3. Firestore Storage → 
4. Audit Logging → 
5. Real-time Updates
```

### Livestream Booking Flow
```
1. Service Calculator → 
2. Booking Form → 
3. Payment Processing (Stripe) → 
4. Schedule Locking → 
5. Confirmation & Notifications
```

## Security Architecture

### Authentication Security
- **Session Management**: Secure, HttpOnly cookies
- **Token Verification**: Server-side Firebase Admin SDK
- **Role Enforcement**: Custom claims with verification
- **Session Expiry**: 24-hour session timeout

### Access Control Security
- **Memorial Access**: Owner/FD assignment verification
- **API Protection**: Role-based endpoint access
- **Data Isolation**: User can only access authorized data
- **Admin Oversight**: Admin role has system-wide access

### Audit & Monitoring
- **Action Logging**: All significant actions tracked
- **Access Monitoring**: Failed access attempts logged
- **Error Tracking**: System errors captured and logged
- **Security Events**: Authentication and authorization events

## Performance Architecture

### Client-Side Optimization
- **Code Splitting**: Route-based code splitting via SvelteKit
- **Lazy Loading**: Components loaded on demand
- **State Management**: Efficient Svelte stores
- **Caching**: Browser caching for static assets

### Server-Side Optimization
- **Firebase Optimization**: Efficient Firestore queries
- **Connection Pooling**: Firebase Admin SDK connection reuse
- **Error Handling**: Graceful degradation patterns
- **Response Caching**: Strategic API response caching

### Database Optimization
- **Indexed Queries**: Firestore indexes for common queries
- **Data Structure**: Optimized document structure
- **Batch Operations**: Efficient bulk operations
- **Real-time Updates**: Firestore real-time listeners

## Deployment Architecture

### Development Environment
- **Firebase Emulators**: Local development with emulator suite
- **Hot Reloading**: Vite-powered development server
- **Type Checking**: Real-time TypeScript validation
- **Testing**: Automated testing with Vitest

### Production Environment
- **Firebase Hosting**: Static site hosting with CDN
- **Serverless Functions**: Firebase Functions for backend logic
- **Global CDN**: Firebase CDN for asset delivery
- **SSL/TLS**: Automatic HTTPS with Firebase Hosting

## Scalability Considerations

### Current Limitations
- **Single Region**: Firebase project in single region
- **Firestore Limits**: Document size and query limitations
- **Session Storage**: Server-side session management

### Future Scalability
- **Multi-Region**: Firebase multi-region deployment
- **Caching Layer**: Redis or similar for session caching
- **CDN Optimization**: Advanced CDN strategies
- **Database Sharding**: Firestore collection sharding patterns

## Integration Points

### External Services
- **Stripe**: Payment processing and webhook handling
- **Algolia**: Search functionality for memorials
- **Email Service**: Transactional email delivery
- **Firebase Services**: Auth, Firestore, Storage, Hosting

### Internal Services
- **Audit Service**: Centralized logging service
- **Access Control**: Memorial access verification service
- **Email Service**: Template-based email delivery
- **Payment Service**: Stripe integration wrapper

## Development Workflow

### Code Organization
- **Feature-Based**: Components organized by feature
- **Type-First**: TypeScript interfaces define contracts
- **Test-Driven**: Components have associated test files
- **Documentation**: Inline documentation for complex logic

### Quality Assurance
- **Type Safety**: Comprehensive TypeScript coverage
- **Testing**: Unit and integration tests
- **Code Review**: Structured review process
- **Linting**: Automated code quality checks

This architecture provides a solid foundation for the TributeStream platform with clear separation of concerns, comprehensive security, and scalability considerations for future growth.
