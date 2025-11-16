# Admin Dashboard Documentation

## Overview
The admin dashboard provides comprehensive management capabilities for Tributestream administrators, including user management, memorial oversight, and system statistics.

## Authentication Flow

### Admin User Creation
1. **Registration**: Admin users are created via `/register` action `registerAdmin` or production script
2. **Custom Claims**: Set with `{ isAdmin: true }` using `adminAuth.setCustomUserClaims()`
3. **Firestore Document**: Created in `users` collection with `isAdmin: true` field
4. **Session Creation**: Uses same flow as regular users via `/auth/session` and `/api/session`

### Access Control
- **Route Protection**: Admin routes check `locals.user.admin` and `locals.user.role === 'admin'`
- **Redirect Logic**: Non-admin users redirected to `/profile`
- **Session Verification**: Handled in `hooks.server.ts` with Firebase session cookie validation

## Data Loading (`/admin/+page.server.ts`)

### Load Function Structure
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  // 1. Authentication check
  if (!locals.user || (!locals.user.admin && locals.user.role !== 'admin')) {
    throw redirect(302, '/login');
  }

  // 2. Firestore connection test
  await adminDb.collection('test').limit(1).get();

  // 3. Data fetching
  const memorialsSnap = await adminDb.collection('memorials').get();
  const usersSnap = await adminDb.collection('users').get();

  // 4. Data transformation and serialization
  // 5. Statistics calculation
  // 6. Return structured data
};
```

### Data Transformation

#### Memorial Data Processing
- **Timestamp Conversion**: All Firestore Timestamps converted to ISO strings
- **Nested Object Handling**: 
  - `paymentHistory[]` - converts `createdAt`, `updatedAt` timestamps
  - `schedule` - converts `createdAt`, `updatedAt`, `serviceDate` timestamps
- **Null Safety**: All timestamp conversions include null checks

#### User Data Processing
- **Fields Mapped**: `uid`, `email`, `displayName`, `role`, `createdAt`, `updatedAt`
- **Default Values**: `role` defaults to 'owner', empty strings for missing fields
- **Timestamp Handling**: Same conversion pattern as memorials

### Statistics Calculation
```typescript
stats: {
  totalMemorials: memorials.length,
  totalUsers: allUsers.length,
  activeStreams: memorials.filter(m => m.livestream).length,
  recentMemorials: memorials.filter(m => {
    const createdAt = new Date(m.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  }).length
}
```

## Data Structures

### Memorial Interface
```typescript
interface Memorial {
  id: string;
  title: string;
  description?: string;
  ownerUid: string;
  createdByUserId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  serviceDate?: string; // ISO string
  livestream?: boolean;
  paymentHistory: PaymentHistoryItem[];
  schedule?: ScheduleData;
  // ... other fields
}

interface PaymentHistoryItem {
  amount: number;
  status: string;
  createdAt: string | null; // ISO string
  updatedAt: string | null; // ISO string
  // ... other fields
}

interface ScheduleData {
  createdAt: string | null; // ISO string
  updatedAt: string | null; // ISO string
  serviceDate: string | null; // ISO string
  // ... other fields
}
```

### User Interface
```typescript
interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string; // 'admin' | 'owner' | 'funeral_director' | 'viewer'
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
```

## Error Handling

### Common Issues and Solutions

#### 1. Firestore Timestamp Serialization
**Problem**: SvelteKit cannot serialize Firestore Timestamp objects
**Solution**: Convert all timestamps to ISO strings using `convertTimestamp()` helper

#### 2. Session Cookie Validation
**Problem**: Invalid signature errors when switching environments
**Solution**: Automatic detection and clearing of invalid cookies in `hooks.server.ts`

#### 3. Nested Object Timestamps
**Problem**: Timestamps in nested objects (paymentHistory, schedule) not converted
**Solution**: Recursive timestamp conversion for all nested structures

### Error Logging
- **Detailed Logging**: All operations logged with context
- **Error Context**: Full error objects and stack traces captured
- **User Feedback**: Graceful error handling with user-friendly messages

## Security Considerations

### Access Control
- **Multi-layer Verification**: Custom claims + Firestore role field
- **Session Security**: HTTP-only, secure session cookies
- **Route Protection**: Server-side authentication checks

### Data Protection
- **Sensitive Data**: Admin access to all user and memorial data
- **Audit Trail**: All admin actions should be logged (future enhancement)
- **Permission Boundaries**: Clear separation between admin and user capabilities

## Performance Considerations

### Data Loading
- **Large Datasets**: Currently loads all memorials (~72) and users (~74)
- **Optimization Opportunities**: 
  - Pagination for large datasets
  - Selective loading based on admin needs
  - Caching for frequently accessed data

### Client-Side Rendering
- **Server-Side Loading**: All data loaded server-side for security
- **Hydration**: Large datasets may impact initial page load
- **Progressive Enhancement**: Consider lazy loading for non-critical data

## Comparison with Owner Registration Flow

### Similarities
1. **User Creation**: Both use `adminAuth.createUser()`
2. **Firestore Documents**: Both create user documents with consistent structure
3. **Authentication**: Both use custom tokens and session cookies
4. **Timestamp Handling**: Both use ISO string format for dates

### Differences
1. **Custom Claims**: Admin users get `isAdmin: true` claim
2. **Redirect Logic**: Admins redirected to `/admin`, others to `/my-portal` or memorial
3. **Data Access**: Admins can access all system data, owners only their own

### Consistency Verification ✅
- **Data Structures**: Aligned between admin and owner flows
- **Authentication**: Same session creation and verification process
- **Serialization**: Same timestamp conversion patterns applied
- **Error Handling**: Consistent error patterns and logging

## Future Enhancements

### Functionality
- [ ] User management actions (edit, delete, suspend)
- [ ] Memorial management actions (edit, delete, transfer ownership)
- [ ] System configuration management
- [ ] Audit logging for admin actions
- [ ] Bulk operations for data management

### Performance
- [ ] Pagination for large datasets
- [ ] Search and filtering capabilities
- [ ] Real-time updates for dashboard stats
- [ ] Caching layer for frequently accessed data

### Security
- [ ] Two-factor authentication for admin accounts
- [ ] IP-based access restrictions
- [ ] Session timeout management
- [ ] Detailed audit trails

## Troubleshooting

### Common Issues
1. **500 Errors**: Usually timestamp serialization - check conversion functions
2. **Authentication Failures**: Verify custom claims and session cookies
3. **Data Loading Errors**: Check Firestore connection and permissions
4. **Environment Issues**: Clear session cookies when switching environments

### Debugging Steps
1. Check server logs for detailed error messages
2. Verify Firebase Admin SDK initialization
3. Test Firestore connectivity with simple queries
4. Validate user authentication and custom claims
5. Inspect session cookie validity and signatures
