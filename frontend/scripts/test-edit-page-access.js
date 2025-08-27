#!/usr/bin/env node

/**
 * Test script to verify the memorial edit page access control
 * Tests the implementation of Phase 3.2 of the photo security implementation plan
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../remembering-randy-firebase-adminsdk-o0x40-c86ce97c74.json'), 'utf8')
);

initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'remembering-randy.appspot.com'
});

const auth = getAuth();
const db = getFirestore();

// Test configuration
const TEST_MEMORIAL_ID = 'test-memorial-' + Date.now();
const TEST_OWNER_EMAIL = 'owner@test.com';
const TEST_FAMILY_EMAIL = 'family@test.com';
const TEST_OTHER_EMAIL = 'other@test.com';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, emoji = '📝', color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message) {
    log(message, '✅', colors.green);
}

function error(message) {
    log(message, '❌', colors.red);
}

function info(message) {
    log(message, '🔍', colors.blue);
}

function warning(message) {
    log(message, '⚠️', colors.yellow);
}

async function createTestUsers() {
    info('Creating test users...');
    
    const users = {};
    
    try {
        // Create owner user
        try {
            await auth.deleteUser((await auth.getUserByEmail(TEST_OWNER_EMAIL)).uid);
        } catch (e) { /* User doesn't exist */ }
        
        users.owner = await auth.createUser({
            email: TEST_OWNER_EMAIL,
            emailVerified: true,
            password: 'testPassword123!',
            displayName: 'Test Owner'
        });
        success(`Created owner user: ${users.owner.uid}`);
        
        // Create family member user
        try {
            await auth.deleteUser((await auth.getUserByEmail(TEST_FAMILY_EMAIL)).uid);
        } catch (e) { /* User doesn't exist */ }
        
        users.family = await auth.createUser({
            email: TEST_FAMILY_EMAIL,
            emailVerified: true,
            password: 'testPassword123!',
            displayName: 'Test Family'
        });
        success(`Created family user: ${users.family.uid}`);
        
        // Create other user (no access)
        try {
            await auth.deleteUser((await auth.getUserByEmail(TEST_OTHER_EMAIL)).uid);
        } catch (e) { /* User doesn't exist */ }
        
        users.other = await auth.createUser({
            email: TEST_OTHER_EMAIL,
            emailVerified: true,
            password: 'testPassword123!',
            displayName: 'Test Other'
        });
        success(`Created other user: ${users.other.uid}`);
        
    } catch (err) {
        error(`Failed to create test users: ${err.message}`);
        throw err;
    }
    
    return users;
}

async function createTestMemorial(ownerId) {
    info('Creating test memorial...');
    
    const memorial = {
        fullName: 'Test Memorial',
        firstName: 'Test',
        lastName: 'Memorial',
        creatorUid: ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [
            'https://example.com/photo1.jpg',
            'https://example.com/photo2.jpg',
            'https://example.com/photo3.jpg'
        ],
        photoMetadata: {},
        slideshowSettings: {
            autoplay: true,
            duration: 5000,
            transition: 'fade'
        },
        privacySetting: 'public',
        visibility: 'public'
    };
    
    try {
        await db.collection('memorials').doc(TEST_MEMORIAL_ID).set(memorial);
        success(`Created memorial: ${TEST_MEMORIAL_ID}`);
        return TEST_MEMORIAL_ID;
    } catch (err) {
        error(`Failed to create memorial: ${err.message}`);
        throw err;
    }
}

async function addFamilyMember(memorialId, userId, role = 'family', permissions = {}) {
    info(`Adding family member ${userId} to memorial ${memorialId}...`);
    
    const familyMember = {
        userId,
        role,
        status: 'active',
        addedAt: new Date(),
        permissions: {
            canUploadPhotos: true,
            canEditPhotos: true,
            canInvite: false,
            ...permissions
        }
    };
    
    try {
        await db
            .collection('memorials')
            .doc(memorialId)
            .collection('familyMembers')
            .doc(userId)
            .set(familyMember);
        success(`Added family member: ${userId}`);
    } catch (err) {
        error(`Failed to add family member: ${err.message}`);
        throw err;
    }
}

async function simulateEditPageLoad(memorialId, userId, expectedRole, expectedPermissions) {
    info(`Simulating edit page load for user ${userId}...`);
    
    try {
        // Get memorial
        const memorialDoc = await db.collection('memorials').doc(memorialId).get();
        
        if (!memorialDoc.exists) {
            throw new Error('Memorial not found');
        }
        
        const memorialData = memorialDoc.data();
        
        // Check ownership
        const isOwner = memorialData.creatorUid === userId;
        
        // Check family member status
        let isFamilyMember = false;
        let familyMemberPermissions = null;
        
        const familyMemberDoc = await db
            .collection('memorials')
            .doc(memorialId)
            .collection('familyMembers')
            .doc(userId)
            .get();
        
        if (familyMemberDoc.exists) {
            const familyMemberData = familyMemberDoc.data();
            if (familyMemberData.status === 'active') {
                isFamilyMember = true;
                familyMemberPermissions = familyMemberData;
            }
        }
        
        // Determine access
        let userRole = null;
        let hasAccess = false;
        
        if (isOwner) {
            userRole = 'owner';
            hasAccess = true;
        } else if (isFamilyMember) {
            userRole = 'family_member';
            hasAccess = true;
        }
        
        // Verify expectations
        if (expectedRole === null && hasAccess) {
            error(`User ${userId} should NOT have access but does (role: ${userRole})`);
            return false;
        }
        
        if (expectedRole !== null && !hasAccess) {
            error(`User ${userId} should have access but doesn't`);
            return false;
        }
        
        if (expectedRole !== null && userRole !== expectedRole) {
            error(`User ${userId} has wrong role: expected ${expectedRole}, got ${userRole}`);
            return false;
        }
        
        // Check permissions if user has access
        if (hasAccess) {
            const canDelete = userRole === 'owner';
            const canManageSettings = userRole === 'owner';
            const canUploadPhotos = true;
            const canEditPhotos = userRole === 'owner' ||
                (userRole === 'family_member' && familyMemberPermissions && familyMemberPermissions.permissions && familyMemberPermissions.permissions.canEditPhotos === true);
            const canInviteOthers = userRole === 'owner' ||
                (userRole === 'family_member' && familyMemberPermissions && familyMemberPermissions.permissions && familyMemberPermissions.permissions.canInvite === true);
            
            const actualPermissions = {
                canDelete,
                canManageSettings,
                canUploadPhotos,
                canEditPhotos,
                canInviteOthers
            };
            
            // Compare with expected permissions
            for (const [key, expectedValue] of Object.entries(expectedPermissions)) {
                if (actualPermissions[key] !== expectedValue) {
                    error(`Permission mismatch for ${key}: expected ${expectedValue}, got ${actualPermissions[key]}`);
                    return false;
                }
            }
            
            success(`User ${userId} has correct access (role: ${userRole}) with expected permissions`);
            console.log('  Permissions:', actualPermissions);
        } else {
            success(`User ${userId} correctly denied access`);
        }
        
        return true;
        
    } catch (err) {
        error(`Failed to simulate edit page load: ${err.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n' + colors.cyan + '🧪 Testing Memorial Edit Page Access Control' + colors.reset);
    console.log(colors.cyan + '=' .repeat(50) + colors.reset + '\n');
    
    let users, memorialId;
    let allTestsPassed = true;
    
    try {
        // Setup
        users = await createTestUsers();
        memorialId = await createTestMemorial(users.owner.uid);
        
        // Add family member
        await addFamilyMember(memorialId, users.family.uid, 'family', {
            canUploadPhotos: true,
            canEditPhotos: true,
            canInvite: false
        });
        
        console.log('\n' + colors.magenta + '📋 Running Access Tests...' + colors.reset);
        console.log(colors.magenta + '-' .repeat(30) + colors.reset + '\n');
        
        // Test 1: Owner should have full access
        info('Test 1: Owner access');
        const test1 = await simulateEditPageLoad(memorialId, users.owner.uid, 'owner', {
            canDelete: true,
            canManageSettings: true,
            canUploadPhotos: true,
            canEditPhotos: true,
            canInviteOthers: true
        });
        allTestsPassed = allTestsPassed && test1;
        
        console.log();
        
        // Test 2: Family member should have limited access
        info('Test 2: Family member access');
        const test2 = await simulateEditPageLoad(memorialId, users.family.uid, 'family_member', {
            canDelete: false,
            canManageSettings: false,
            canUploadPhotos: true,
            canEditPhotos: true,
            canInviteOthers: false
        });
        allTestsPassed = allTestsPassed && test2;
        
        console.log();
        
        // Test 3: Other user should have no access
        info('Test 3: Unauthorized user access');
        const test3 = await simulateEditPageLoad(memorialId, users.other.uid, null, {});
        allTestsPassed = allTestsPassed && test3;
        
        console.log();
        
        // Test 4: Pending family member should have no access
        info('Test 4: Pending family member access');
        await db
            .collection('memorials')
            .doc(memorialId)
            .collection('familyMembers')
            .doc(users.other.uid)
            .set({
                userId: users.other.uid,
                role: 'family',
                status: 'pending',
                addedAt: new Date(),
                permissions: {
                    canUploadPhotos: true,
                    canEditPhotos: true
                }
            });
        
        const test4 = await simulateEditPageLoad(memorialId, users.other.uid, null, {});
        allTestsPassed = allTestsPassed && test4;
        
    } catch (err) {
        error(`Test suite failed: ${err.message}`);
        allTestsPassed = false;
    } finally {
        // Cleanup
        console.log('\n' + colors.yellow + '🧹 Cleaning up test data...' + colors.reset);
        
        try {
            // Delete test memorial and subcollections
            if (memorialId) {
                const familyMembers = await db
                    .collection('memorials')
                    .doc(memorialId)
                    .collection('familyMembers')
                    .get();
                
                for (const doc of familyMembers.docs) {
                    await doc.ref.delete();
                }
                
                await db.collection('memorials').doc(memorialId).delete();
                success('Deleted test memorial');
            }
            
            // Delete test users
            if (users) {
                for (const [name, user] of Object.entries(users)) {
                    try {
                        await auth.deleteUser(user.uid);
                        success(`Deleted ${name} user`);
                    } catch (e) {
                        warning(`Could not delete ${name} user: ${e.message}`);
                    }
                }
            }
        } catch (err) {
            error(`Cleanup failed: ${err.message}`);
        }
    }
    
    // Final results
    console.log('\n' + colors.cyan + '=' .repeat(50) + colors.reset);
    if (allTestsPassed) {
        console.log(colors.green + '✅ All tests passed!' + colors.reset);
    } else {
        console.log(colors.red + '❌ Some tests failed!' + colors.reset);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(err => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
});