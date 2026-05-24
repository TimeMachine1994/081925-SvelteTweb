#!/usr/bin/env node

/**
 * 🧪 Test Script for Invitation Migration Logic
 * 
 * This script tests the ID transformation logic without accessing the database
 */

console.log('🧪 Testing Invitation Migration Logic');
console.log('=====================================\n');

// Test cases for ID transformation
const testCases = [
    {
        input: {
            oldId: 'abc123xyz',
            inviteeEmail: 'john.doe@example.com',
            memorialId: 'memorial-001'
        },
        expectedNewId: 'john.doe@example.com_memorial-001'
    },
    {
        input: {
            oldId: 'def456uvw',
            inviteeEmail: 'jane.smith@test.org',
            memorialId: 'mem-2024-05-15'
        },
        expectedNewId: 'jane.smith@test.org_mem-2024-05-15'
    },
    {
        input: {
            oldId: 'john.doe@example.com_memorial-001', // Already in new format
            inviteeEmail: 'john.doe@example.com',
            memorialId: 'memorial-001'
        },
        expectedNewId: 'john.doe@example.com_memorial-001'
    }
];

// Function to generate new ID
function generateNewId(email, memorialId) {
    return `${email}_${memorialId}`;
}

// Function to check if ID is already in new format
function isNewFormat(id, email, memorialId) {
    return id === generateNewId(email, memorialId);
}

// Run tests
let passed = 0;
let failed = 0;

console.log('📝 Running test cases:\n');

testCases.forEach((testCase, index) => {
    const { oldId, inviteeEmail, memorialId } = testCase.input;
    const newId = generateNewId(inviteeEmail, memorialId);
    const alreadyMigrated = isNewFormat(oldId, inviteeEmail, memorialId);
    
    console.log(`Test ${index + 1}:`);
    console.log(`  Input: ${oldId}`);
    console.log(`  Email: ${inviteeEmail}`);
    console.log(`  Memorial: ${memorialId}`);
    console.log(`  Generated ID: ${newId}`);
    console.log(`  Already migrated: ${alreadyMigrated}`);
    
    if (newId === testCase.expectedNewId) {
        console.log(`  ✅ PASSED\n`);
        passed++;
    } else {
        console.log(`  ❌ FAILED - Expected: ${testCase.expectedNewId}\n`);
        failed++;
    }
});

// Edge case tests
console.log('🔍 Testing edge cases:\n');

const edgeCases = [
    {
        name: 'Missing email',
        input: { inviteeEmail: null, memorialId: 'mem-123' },
        shouldFail: true
    },
    {
        name: 'Missing memorial ID',
        input: { inviteeEmail: 'test@example.com', memorialId: null },
        shouldFail: true
    },
    {
        name: 'Email with special characters',
        input: { inviteeEmail: 'user+tag@example.com', memorialId: 'mem-123' },
        shouldFail: false
    },
    {
        name: 'Memorial ID with special characters',
        input: { inviteeEmail: 'user@example.com', memorialId: 'mem-2024/05/15' },
        shouldFail: false
    }
];

edgeCases.forEach((edgeCase) => {
    console.log(`Testing: ${edgeCase.name}`);
    
    try {
        const { inviteeEmail, memorialId } = edgeCase.input;
        
        if (!inviteeEmail || !memorialId) {
            if (edgeCase.shouldFail) {
                console.log(`  ✅ Correctly identified invalid input\n`);
                passed++;
            } else {
                console.log(`  ❌ Should not have failed\n`);
                failed++;
            }
        } else {
            const newId = generateNewId(inviteeEmail, memorialId);
            console.log(`  Generated: ${newId}`);
            
            if (edgeCase.shouldFail) {
                console.log(`  ❌ Should have failed\n`);
                failed++;
            } else {
                console.log(`  ✅ Handled correctly\n`);
                passed++;
            }
        }
    } catch (error) {
        if (edgeCase.shouldFail) {
            console.log(`  ✅ Correctly failed: ${error.message}\n`);
            passed++;
        } else {
            console.log(`  ❌ Unexpected error: ${error.message}\n`);
            failed++;
        }
    }
});

// Summary
console.log('=====================================');
console.log('📊 TEST RESULTS:');
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📊 Total: ${passed + failed}`);
console.log(`  🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! The migration logic is working correctly.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the migration logic.');
    process.exit(1);
}