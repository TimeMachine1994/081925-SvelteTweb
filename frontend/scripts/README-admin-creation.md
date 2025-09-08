# Admin User Creation Scripts

This directory contains scripts to create admin users for different environments.

## Scripts Available

### 1. Testing Environment
**File:** `create-admin-testing.js`
**Usage:** `node scripts/create-admin-testing.js <email> [displayName]`

Creates an admin user for testing/development environment.

**Features:**
- Creates Firebase Auth user if doesn't exist
- Sets custom claims: `role=admin`, `admin=true`, `environment=testing`
- Creates Firestore user document
- Safe for development use

**Example:**
```bash
node scripts/create-admin-testing.js test-admin@yourdomain.com "Test Administrator"
```

### 2. Production Environment
**File:** `create-admin-production.js`
**Usage:** `node scripts/create-admin-production.js <email> [displayName]`

Creates an admin user for production environment with safety checks.

**Features:**
- Requires manual confirmation ("CONFIRM PRODUCTION")
- Checks for existing admins and warns
- Uses separate production service account key
- Sets custom claims: `role=admin`, `admin=true`, `environment=production`
- Includes security reminders

**Example:**
```bash
node scripts/create-admin-production.js admin@yourdomain.com "Production Administrator"
```

### 3. Legacy Script
**File:** `create-admin.js`
**Usage:** `node scripts/create-admin.js <email> [displayName]`

Original bootstrap script for creating the first admin user.

## Prerequisites

### For Testing Environment
- `service-account-key.json` in project root
- Firebase Admin SDK access

### For Production Environment
- `service-account-key-production.json` in project root (separate from testing)
- Production Firebase project access
- Manual confirmation required

## Service Account Keys

### Testing/Development
Place your development Firebase service account key as:
```
/frontend/service-account-key.json
```

### Production
Place your production Firebase service account key as:
```
/frontend/service-account-key-production.json
```

**⚠️ Important:** Never commit service account keys to version control!

## Security Best Practices

### For Production Admins
1. **Change default passwords immediately**
2. **Enable 2FA for admin accounts**
3. **Use strong, unique passwords**
4. **Review admin permissions regularly**
5. **Monitor admin activity logs**
6. **Limit number of admin users**

### Environment Separation
- Always use separate Firebase projects for testing and production
- Use different service account keys for each environment
- Never test admin scripts against production

## Admin Capabilities

Once created, admin users can access:
- `/admin` - Admin portal with full system management
- `/my-portal` - Personal portal (role-based interface)
- `/profile` - User profile management

Admin users have the following permissions:
- Create/manage memorials
- Manage user roles and permissions
- Access system analytics
- Manage funeral director registrations
- Override access controls (where appropriate)

## Troubleshooting

### Common Issues

**Service account key not found:**
- Ensure the key file exists in the correct location
- Check file permissions
- Verify the file is valid JSON

**Permission denied:**
- Verify service account has required permissions
- Check Firebase project access
- Ensure Admin SDK is enabled

**User already exists:**
- Script will update existing users with admin privileges
- Check Firebase Auth console to verify user status

### Getting Help

If you encounter issues:
1. Check the Firebase console for error details
2. Verify service account permissions
3. Ensure Firebase Admin SDK is properly configured
4. Review the script output for specific error messages

## Environment Variables

You can also set these environment variables for additional configuration:

```bash
# Optional: Override default service account paths
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/testing-key.json
FIREBASE_PRODUCTION_SERVICE_ACCOUNT_KEY_PATH=/path/to/production-key.json

# Optional: Set default admin display name
DEFAULT_ADMIN_DISPLAY_NAME="System Administrator"
```
