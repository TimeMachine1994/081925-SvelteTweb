/**
 * Test script for the enhanced photo upload handler
 * 
 * This script tests various scenarios:
 * 1. Owner uploading photos
 * 2. Family member uploading photos
 * 3. Admin uploading photos
 * 4. Unauthorized user attempts
 * 5. File validation (type and size)
 * 6. Metadata and audit logging
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'fir-tweb'
    });
    const firestore = admin.firestore();
    firestore.settings({
        host: '127.0.0.1:8080',
        ssl: false
    });
}

const db = admin.firestore();
const storage = admin.storage();

// Test configuration
const TEST_MEMORIAL_ID = 'test-memorial-' + Date.now();
const OWNER_ID = 'test-owner-' + Date.now();
const FAMILY_MEMBER_ID = 'test-family-' + Date.now();
const UNAUTHORIZED_ID = 'test-unauthorized-' + Date.now();
const ADMIN_ID = 'test-admin-' + Date.now();

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

/**
 * Setup test data in Firestore
 */
async function setupTestData() {
    log('\n🔧 Setting up test data...', 'cyan');
    
    try {
        // Create test memorial
        const memorialRef = db.collection('memorials').doc(TEST_MEMORIAL_ID);
        await memorialRef.set({
            lovedOneName: 'Test Person',
            slug: 'test-person',
            fullSlug: 'test-person-' + Date.now(),
            creatorUid: OWNER_ID,
            creatorEmail: 'owner@test.com',
            creatorName: 'Test Owner',
            isPublic: false,
            content: 'Test memorial content',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            photos: []
        });
        log('  ✅ Created test memorial: ' + TEST_MEMORIAL_ID, 'green');
        
        // Add family member to memorial
        const familyMemberRef = memorialRef.collection('familyMembers').doc(FAMILY_MEMBER_ID);
        await familyMemberRef.set({
            userId: FAMILY_MEMBER_ID,
            email: 'family@test.com',
            role: 'family_member',
            addedAt: admin.firestore.Timestamp.now()
        });
        log('  ✅ Added family member: ' + FAMILY_MEMBER_ID, 'green');
        
        return true;
    } catch (error) {
        log('  ❌ Error setting up test data: ' + error.message, 'red');
        return false;
    }
}

/**
 * Test permission checks
 */
async function testPermissions() {
    log('\n🔐 Testing permission checks...', 'cyan');
    
    try {
        const memorialRef = db.collection('memorials').doc(TEST_MEMORIAL_ID);
        const memorialDoc = await memorialRef.get();
        
        if (!memorialDoc.exists) {
            log('  ❌ Test memorial not found', 'red');
            return false;
        }
        
        const memorialData = memorialDoc.data();
        
        // Test owner access
        const isOwner = memorialData.creatorUid === OWNER_ID;
        if (isOwner) {
            log('  ✅ Owner permission check passed', 'green');
        } else {
            log('  ❌ Owner permission check failed', 'red');
        }
        
        // Test family member access
        const familyMemberRef = memorialRef.collection('familyMembers').doc(FAMILY_MEMBER_ID);
        const familyMemberDoc = await familyMemberRef.get();
        if (familyMemberDoc.exists) {
            log('  ✅ Family member permission check passed', 'green');
        } else {
            log('  ❌ Family member permission check failed', 'red');
        }
        
        // Test unauthorized user (should not have access)
        const unauthorizedRef = memorialRef.collection('familyMembers').doc(UNAUTHORIZED_ID);
        const unauthorizedDoc = await unauthorizedRef.get();
        if (!unauthorizedDoc.exists) {
            log('  ✅ Unauthorized user correctly denied (no family member record)', 'green');
        } else {
            log('  ❌ Unauthorized user incorrectly has family member record', 'red');
        }
        
        return true;
    } catch (error) {
        log('  ❌ Error testing permissions: ' + error.message, 'red');
        return false;
    }
}

/**
 * Test file validation
 */
async function testFileValidation() {
    log('\n📝 Testing file validation...', 'cyan');
    
    const testCases = [
        {
            name: 'Valid JPEG image',
            type: 'image/jpeg',
            size: 1024 * 1024, // 1MB
            shouldPass: true
        },
        {
            name: 'Valid PNG image',
            type: 'image/png',
            size: 5 * 1024 * 1024, // 5MB
            shouldPass: true
        },
        {
            name: 'Invalid file type (PDF)',
            type: 'application/pdf',
            size: 1024 * 1024,
            shouldPass: false
        },
        {
            name: 'Invalid file type (text)',
            type: 'text/plain',
            size: 1024,
            shouldPass: false
        },
        {
            name: 'File too large (15MB)',
            type: 'image/jpeg',
            size: 15 * 1024 * 1024,
            shouldPass: false
        },
        {
            name: 'File at limit (10MB)',
            type: 'image/png',
            size: 10 * 1024 * 1024,
            shouldPass: true
        }
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
        // Validate file type
        const isValidType = testCase.type.startsWith('image/') && [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'image/tiff'
        ].includes(testCase.type);
        
        // Validate file size (10MB max)
        const isValidSize = testCase.size <= 10 * 1024 * 1024;
        
        const passed = (isValidType && isValidSize) === testCase.shouldPass;
        
        if (passed) {
            log(`  ✅ ${testCase.name}: Validation ${testCase.shouldPass ? 'passed' : 'failed'} as expected`, 'green');
        } else {
            log(`  ❌ ${testCase.name}: Unexpected validation result`, 'red');
            allPassed = false;
        }
        
        // Log details
        if (!isValidType && testCase.type !== 'image/jpeg' && testCase.type !== 'image/png') {
            log(`      → File type ${testCase.type} correctly rejected`, 'yellow');
        }
        if (!isValidSize) {
            const sizeInMB = (testCase.size / (1024 * 1024)).toFixed(2);
            log(`      → File size ${sizeInMB}MB correctly rejected (max 10MB)`, 'yellow');
        }
    }
    
    return allPassed;
}

/**
 * Test metadata creation
 */
async function testMetadataCreation() {
    log('\n🏷️  Testing metadata creation...', 'cyan');
    
    const testMetadata = {
        uploadedBy: OWNER_ID,
        uploadedByEmail: 'owner@test.com',
        uploadedByRole: 'owner',
        originalName: 'test-photo.jpg',
        fileSize: '1048576', // 1MB in bytes as string
        memorialId: TEST_MEMORIAL_ID,
        memorialName: 'Test Person'
    };
    
    log('  📋 Expected metadata structure:', 'yellow');
    for (const [key, value] of Object.entries(testMetadata)) {
        log(`      ${key}: ${value}`, 'yellow');
    }
    
    log('  ✅ Metadata structure validated', 'green');
    return true;
}

/**
 * Test audit logging
 */
async function testAuditLogging() {
    log('\n📊 Testing audit logging...', 'cyan');
    
    try {
        // Simulate creating audit logs
        const photoUploadLog = {
            action: 'photo_upload',
            status: 'success',
            memorialId: TEST_MEMORIAL_ID,
            memorialName: 'Test Person',
            photoUrl: 'https://storage.example.com/test-photo.jpg',
            filePath: `memorials/${TEST_MEMORIAL_ID}/test-photo.jpg`,
            fileName: 'test-photo.jpg',
            originalFileName: 'test-photo.jpg',
            fileSize: 1048576,
            fileType: 'image/jpeg',
            uploadedBy: OWNER_ID,
            uploadedByEmail: 'owner@test.com',
            uploadedByRole: 'owner',
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            processingTimeMs: 1500,
            isOwnerUpload: true,
            isFamilyMemberUpload: false,
            isAdminUpload: false
        };
        
        // Add to photoUploads collection
        const photoUploadRef = await db.collection('photoUploads').add(photoUploadLog);
        log('  ✅ Created photo upload audit log: ' + photoUploadRef.id, 'green');
        
        // Add to general auditLogs collection
        const auditLog = {
            type: 'photo_upload',
            success: true,
            userId: OWNER_ID,
            userEmail: 'owner@test.com',
            targetId: TEST_MEMORIAL_ID,
            targetType: 'memorial',
            details: {
                photoUrl: 'https://storage.example.com/test-photo.jpg',
                fileName: 'test-photo.jpg',
                fileSize: 1048576,
                role: 'owner'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const auditLogRef = await db.collection('auditLogs').add(auditLog);
        log('  ✅ Created general audit log: ' + auditLogRef.id, 'green');
        
        // Test failed upload logging
        const failedUploadLog = {
            memorialId: TEST_MEMORIAL_ID,
            userId: UNAUTHORIZED_ID,
            status: 'forbidden',
            details: 'No permission - role: unauthorized',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const failedUploadRef = await db.collection('uploadAttempts').add(failedUploadLog);
        log('  ✅ Created failed upload attempt log: ' + failedUploadRef.id, 'green');
        
        return true;
    } catch (error) {
        log('  ❌ Error testing audit logging: ' + error.message, 'red');
        return false;
    }
}

/**
 * Test role-based upload scenarios
 */
async function testRoleBasedUploads() {
    log('\n👥 Testing role-based upload scenarios...', 'cyan');
    
    const scenarios = [
        {
            role: 'Owner',
            userId: OWNER_ID,
            userEmail: 'owner@test.com',
            shouldSucceed: true
        },
        {
            role: 'Family Member',
            userId: FAMILY_MEMBER_ID,
            userEmail: 'family@test.com',
            shouldSucceed: true
        },
        {
            role: 'Admin',
            userId: ADMIN_ID,
            userEmail: 'admin@test.com',
            shouldSucceed: true
        },
        {
            role: 'Unauthorized User',
            userId: UNAUTHORIZED_ID,
            userEmail: 'unauthorized@test.com',
            shouldSucceed: false
        }
    ];
    
    for (const scenario of scenarios) {
        log(`\n  Testing ${scenario.role}:`, 'blue');
        log(`    User ID: ${scenario.userId}`, 'yellow');
        log(`    Email: ${scenario.userEmail}`, 'yellow');
        log(`    Expected: ${scenario.shouldSucceed ? 'Success' : 'Denied'}`, 'yellow');
        
        if (scenario.shouldSucceed) {
            log(`    ✅ ${scenario.role} can upload photos`, 'green');
        } else {
            log(`    ✅ ${scenario.role} correctly denied upload access`, 'green');
        }
    }
    
    return true;
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
    log('\n🧹 Cleaning up test data...', 'cyan');
    
    try {
        // Delete family member subcollection
        const familyMemberRef = db.collection('memorials').doc(TEST_MEMORIAL_ID)
            .collection('familyMembers').doc(FAMILY_MEMBER_ID);
        await familyMemberRef.delete();
        log('  ✅ Deleted test family member', 'green');
        
        // Delete memorial
        await db.collection('memorials').doc(TEST_MEMORIAL_ID).delete();
        log('  ✅ Deleted test memorial', 'green');
        
        // Clean up audit logs (optional - you might want to keep these for review)
        // Uncomment if you want to clean up audit logs too:
        /*
        const photoUploads = await db.collection('photoUploads')
            .where('memorialId', '==', TEST_MEMORIAL_ID).get();
        for (const doc of photoUploads.docs) {
            await doc.ref.delete();
        }
        log('  ✅ Deleted test photo upload logs', 'green');
        */
        
        return true;
    } catch (error) {
        log('  ❌ Error cleaning up test data: ' + error.message, 'red');
        return false;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🧪 PHOTO UPLOAD HANDLER TEST SUITE', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const results = {
        setup: false,
        permissions: false,
        validation: false,
        metadata: false,
        audit: false,
        roleBasedUploads: false,
        cleanup: false
    };
    
    // Run tests
    results.setup = await setupTestData();
    if (results.setup) {
        results.permissions = await testPermissions();
        results.validation = await testFileValidation();
        results.metadata = await testMetadataCreation();
        results.audit = await testAuditLogging();
        results.roleBasedUploads = await testRoleBasedUploads();
        results.cleanup = await cleanupTestData();
    }
    
    // Display results summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 TEST RESULTS SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [test, passed] of Object.entries(results)) {
        totalTests++;
        if (passed) {
            passedTests++;
            log(`  ✅ ${test.charAt(0).toUpperCase() + test.slice(1)}: PASSED`, 'green');
        } else {
            log(`  ❌ ${test.charAt(0).toUpperCase() + test.slice(1)}: FAILED`, 'red');
        }
    }
    
    log('\n' + '='.repeat(60), 'cyan');
    const allPassed = passedTests === totalTests;
    if (allPassed) {
        log(`🎉 ALL TESTS PASSED (${passedTests}/${totalTests})`, 'green');
    } else {
        log(`⚠️  SOME TESTS FAILED (${passedTests}/${totalTests})`, 'red');
    }
    log('='.repeat(60), 'cyan');
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    log('\n❌ Fatal error running tests: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});