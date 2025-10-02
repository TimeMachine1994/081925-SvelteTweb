# Dev Mode Operations Guide - September 23, 2025

## Overview
This document outlines the DevRoleSwitcher implementation and troubleshooting for the TributeStream application's development mode functionality.

## DevRoleSwitcher Architecture

### Components
- **DevRoleSwitcher.svelte** - Client-side UI component (`/frontend/src/lib/components/DevRoleSwitcher.svelte`)
- **dev-role-switch API** - Server-side authentication endpoint (`/frontend/src/routes/api/dev-role-switch/+server.ts`)
- **Firebase Configuration** - Emulator setup (`firebase.json`, `firebase.ts`)

### Test Accounts
```
Admin:             admin@test.com / test123
Funeral Director:  director@test.com / test123  
Owner:             owner@test.com / test123
Viewer:            viewer@test.com / test123
```

## Implementation Details

### Server-Side Authentication Flow
1. **Logout**: `POST /logout?dev=true` (no redirect)
2. **Authentication**: `POST /api/dev-role-switch` with email/password
3. **Session Creation**: Server creates session cookie using Firebase Admin SDK
4. **Redirection**: Client redirects based on role

### Key Features
- **Security**: Only allows predefined test accounts
- **Custom Tokens**: Uses Firebase Admin SDK to create custom tokens
- **Session Management**: Creates secure HTTP-only session cookies
- **Role-Based Routing**: Redirects users to appropriate pages based on role

## Configuration Files

### Firebase Emulator Configuration (`firebase.json`)
```json
"emulators": {
  "auth": { "host": "127.0.0.1", "port": 9099 },
  "firestore": { "host": "127.0.0.1", "port": 8080 },
  "storage": { "host": "127.0.0.1", "port": 9199 },
  "hosting": { "host": "127.0.0.1", "port": 5000 },
  "ui": { "host": "127.0.0.1", "port": 4000 }
}
```

### Firebase Client Configuration (`firebase.ts`)
- Uses `dummy` API key in development mode
- Connects to emulators on `127.0.0.1` addresses
- Handles connection errors gracefully

## Scripts and Testing

### Test Account Creation
```bash
# Create test accounts
node scripts/create-test-accounts.js

# Reset and recreate accounts
node scripts/reset-emulator-accounts.js
```

### DevRoleSwitcher Testing
```bash
# Comprehensive test suite
node scripts/test-dev-role-switcher.js
```

## Troubleshooting

### Common Issues Fixed

#### 1. Firebase Client Network Errors
**Problem**: Browser Firebase client couldn't connect to emulators
**Solution**: Implemented server-side authentication to bypass browser issues

#### 2. CORS and API Key Issues
**Problem**: `ERR_EMPTY_RESPONSE` and API key validation failures
**Solution**: Used dummy API key and server-side custom token generation

#### 3. Authentication Middleware Interference
**Problem**: Auth middleware running on logout endpoint causing loops
**Solution**: Skip auth middleware for `/logout` endpoint

#### 4. Port Mismatches
**Problem**: Scripts connecting to wrong ports
**Solution**: Updated all configurations to use `127.0.0.1` consistently

### Current Working Flow
1. Firebase emulators running on `127.0.0.1` ports
2. Test accounts created via server API
3. DevRoleSwitcher uses server-side authentication
4. Session cookies created without browser Firebase client
5. Role-based redirection working properly

## File Structure
```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── DevRoleSwitcher.svelte
│   │   └── firebase.ts
│   └── routes/
│       ├── api/
│       │   ├── dev-role-switch/
│       │   │   └── +server.ts
│       │   ├── session/
│       │   │   └── +server.ts
│       │   └── create-test-accounts/
│       │       └── +server.ts
│       └── logout/
│           └── +server.ts
├── scripts/
│   ├── create-test-accounts.js
│   ├── reset-emulator-accounts.js
│   └── test-dev-role-switcher.js
└── hooks.server.ts
```

## Role Redirection Logic
- **Admin**: `/admin`
- **Funeral Director**: `/my-portal`
- **Owner**: `/my-portal`
- **Viewer**: `/`

## Security Considerations
- DevRoleSwitcher only visible in development mode (`import.meta.env.DEV`)
- Server validates test account emails before authentication
- Session cookies are HTTP-only and secure
- Custom tokens have proper role claims

## Performance Notes
- Server-side authentication eliminates browser Firebase client overhead
- No client-side Firebase imports in DevRoleSwitcher
- Efficient session cookie management
- Minimal network requests for role switching

## Future Improvements
- Add loading states during role switching
- Implement role switching history/logging
- Add keyboard shortcuts for quick role switching
- Consider adding more granular permissions testing
