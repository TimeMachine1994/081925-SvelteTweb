# Firebase Memorial Migration Script

This script migrates all memorial data from the source Firebase project (`tributestream-lemhr`) to the destination project (`fir-tweb`).

## What Gets Migrated

- **Users collection** - All user accounts and profiles
- **Memorials collection** - All memorial documents
- **Streams subcollection** - All streams for each memorial
- **Slideshows subcollection** - All slideshows for each memorial

## Prerequisites

1. **Node.js** installed (version 16 or higher)
2. **Internet connection** for Firebase access
3. **Firebase Admin credentials** for destination project (fir-tweb)
4. **Google Cloud credentials** for source project access

## Installation

1. Navigate to the scripts directory:
```bash
cd scripts
```

2. Install dependencies:
```bash
npm install
```

3. **Set up service account credentials** (REQUIRED):

   **For Source Project (tributestream-lemhr):**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select the `tributestream-lemhr` project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the downloaded file as `tributestream-lemhr-service-account.json` in the `scripts/` directory
   
   **For Destination Project (fir-tweb):**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select the `fir-tweb` project  
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the downloaded file as `fir-tweb-service-account.json` in the parent directory (not in scripts/)

## Running the Migration

**⚠️ IMPORTANT: This will copy data to your production Firebase. Make sure you want to do this!**

```bash
npm run migrate-memorials
```

## What the Script Does

1. **Connects** to both Firebase projects
2. **Reads** all documents from source project
3. **Cleans** data (removes undefined values for Firestore compatibility)
4. **Writes** data to destination project in batches
5. **Reports** migration statistics

## Migration Process

### Phase 1: Users
- Migrates all user documents from `users` collection
- Preserves user IDs and all profile data

### Phase 2: Memorials
- Migrates all memorial documents from `memorials` collection
- For each memorial, also migrates:
  - **Streams subcollection** (all stream configurations)
  - **Slideshows subcollection** (all slideshow data)

### Batch Processing
- Uses Firestore batch writes (500 documents per batch)
- Handles large datasets efficiently
- Provides progress updates during migration

## Output Example

```
🚀 Starting Firebase memorial migration...
Source: tributestream-lemhr
Destination: fir-tweb

👥 Starting user migration...
Found 25 users to migrate
✅ Committed batch of 25 users
👥 User migration complete: 25/25 successful

🏛️  Starting memorial migration...
Found 150 memorials to migrate
  📁 Migrating 3 streams for memorial abc123
  📁 Migrating 1 slideshows for memorial abc123
✅ Committed batch of 150 memorials
🏛️  Memorial migration complete: 150/150 successful

📊 MIGRATION SUMMARY
==================
Memorials: 150/150 (0 errors)
Streams: 450/450 (0 errors)
Slideshows: 75/75 (0 errors)
Users: 25/25 (0 errors)

Total: 700/700 documents migrated (0 errors)

✅ Migration completed successfully!
```

## Error Handling

- **Individual document errors** don't stop the entire migration
- **Error statistics** are tracked and reported
- **Detailed error logs** help identify issues
- **Batch commits** ensure data consistency

## Safety Features

- **Read-only** source operations (no data is modified in source)
- **Undefined value cleaning** prevents Firestore errors
- **Batch processing** for reliability
- **Progress reporting** for monitoring

## Troubleshooting

### Permission Errors
- Ensure you have read access to source project
- Ensure you have write access to destination project
- Check Firebase security rules

### Network Errors
- Verify internet connection
- Check Firebase project status
- Retry the migration if needed

### Data Errors
- Check console output for specific error details
- Verify source data integrity
- Review Firestore security rules

## Post-Migration

After successful migration:

1. **Verify data** in Firebase Console for destination project
2. **Test application** functionality with migrated data
3. **Update any hardcoded references** to old project
4. **Consider backing up** the migrated data

## Support

If you encounter issues:
1. Check the console output for error details
2. Verify Firebase project configurations
3. Ensure proper permissions on both projects
4. Review this README for troubleshooting steps

---

# Firebase Authentication Clearing Script

This script allows you to bulk delete all users from Firebase Authentication instead of manually deleting them one by one.

## ⚠️ WARNING

**This script will DELETE ALL users from your Firebase Authentication database!**

Only use this for:
- Development/testing environments
- Cleaning up test data
- Resetting authentication for a fresh start

**DO NOT run this on production unless you absolutely know what you're doing!**

## Running the Script

1. Make sure you're in the scripts directory:
```bash
cd scripts
```

2. Ensure dependencies are installed:
```bash
npm install
```

3. Make sure you have the service account file:
   - The script uses `fir-tweb-service-account.json` from the parent directory
   - See the Prerequisites section above for how to obtain this

4. Run the script:
```bash
npm run clear-auth
```

## What the Script Does

1. **Lists all users** in Firebase Authentication
2. **Shows preview** of first 10 users and total count
3. **Requires confirmation** - you must type "DELETE ALL" to proceed
4. **Deletes users in batches** of 100 (Firebase limit)
5. **Provides progress updates** for each batch
6. **Reports summary** of successful/failed deletions

## Example Output

```
🔥 Firebase Authentication User Deletion Script

⚠️  WARNING: This will DELETE ALL users from Firebase Authentication!

📋 Fetching all users...

Found 45 users:

  1. user1@example.com (John Doe) - UID: abc12345...
  2. user2@example.com (Jane Smith) - UID: def67890...
  3. test@example.com (Test User) - UID: ghi11223...
  ... and 42 more users

❓ Are you sure you want to delete ALL these users? Type "DELETE ALL" to confirm: DELETE ALL

🗑️  Starting user deletion...

Deleting batch 1/1 (45 users)...
  ✅ Batch deleted successfully

📊 DELETION SUMMARY
==================
Total users processed: 45
Successfully deleted: 45
Failed to delete: 0

✅ All users deleted successfully!
```

## Safety Features

- **Preview before deletion** - see what will be deleted
- **Explicit confirmation** - must type exact phrase
- **Batch processing** - handles large numbers of users
- **Error tracking** - reports failed deletions
- **Cancellation** - can cancel at confirmation prompt

## Troubleshooting

### Permission Errors
- Ensure your service account has authentication admin privileges
- Check Firebase IAM roles for the service account

### Script Won't Run
- Verify Node.js version (16 or higher)
- Make sure firebase-admin is installed: `npm install`
- Check that service account file path is correct

### Partial Deletions
- Some users may fail due to active sessions or locks
- Re-run the script to attempt remaining deletions
- Check Firebase Console for any users with special restrictions
