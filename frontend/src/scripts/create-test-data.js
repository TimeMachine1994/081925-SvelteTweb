// Script to create test accounts and data for demo purposes
// Run this with: node src/scripts/create-test-data.js

import { adminAuth, adminDb } from '../lib/server/firebase.js';

const testAccounts = [
  {
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
    name: 'Admin User',
    data: {
      isAdmin: true,
      role: 'admin'
    }
  },
  {
    email: 'director@test.com',
    password: 'test123',
    role: 'funeral_director',
    name: 'John Director',
    data: {
      role: 'funeral_director',
      companyName: 'Smith & Sons Funeral Home',
      phone: '(555) 123-4567',
      address: {
        street: '123 Memorial Drive',
        city: 'Orlando',
        state: 'FL',
        zipCode: '32801'
      }
    }
  },
  {
    email: 'owner@test.com',
    password: 'test123',
    role: 'owner',
    name: 'Sarah Owner',
    data: {
      role: 'owner',
      phone: '(555) 987-6543'
    }
  },
  {
    email: 'viewer@test.com',
    password: 'test123',
    role: 'viewer',
    name: 'Mike Viewer',
    data: {
      role: 'viewer',
      followedMemorials: []
    }
  }
];

async function createTestAccounts() {
  console.log('Creating test accounts...');
  
  for (const account of testAccounts) {
    try {
      console.log(`Creating ${account.role}: ${account.email}`);
      
      // Create user account
      const userRecord = await adminAuth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.name
      });
      
      // Set custom claims
      const customClaims = { role: account.role };
      if (account.role === 'admin') {
        customClaims.isAdmin = true;
      }
      await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
      
      // Create user document in Firestore
      await adminDb.collection('users').doc(userRecord.uid).set({
        name: account.name,
        email: account.email,
        ...account.data,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
      
      console.log(`✅ Created ${account.role}: ${account.email}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Account already exists: ${account.email}`);
      } else {
        console.error(`❌ Error creating ${account.email}:`, error);
      }
    }
  }
}

async function createTestMemorial() {
  try {
    console.log('Creating test memorial...');
    
    // Get the owner user to create memorial under their account
    const ownerUser = await adminAuth.getUserByEmail('owner@test.com');
    
    // Create a test memorial
    const memorialData = {
      lovedOneName: 'Robert Johnson',
      dateOfBirth: '1945-03-15',
      dateOfPassing: '2024-09-01',
      biography: 'Robert was a loving father, grandfather, and friend to many. He spent his career as a teacher, inspiring countless students over 40 years. He loved fishing, gardening, and spending time with his family. His warm smile and generous spirit touched everyone who knew him.',
      serviceDetails: {
        date: '2024-09-15',
        time: '2:00 PM',
        location: 'Smith & Sons Funeral Home',
        address: '123 Memorial Drive, Orlando, FL 32801'
      },
      createdBy: ownerUser.uid,
      createdAt: new Date().toISOString(),
      isPublic: true,
      photos: [],
      tributes: [
        {
          id: 'tribute1',
          authorName: 'Mary Johnson',
          authorEmail: 'mary@example.com',
          message: 'Dad was the most wonderful man I ever knew. He taught me to be kind, work hard, and always help others. I will miss his stories and his hugs.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tribute2',
          authorName: 'Former Student',
          authorEmail: 'student@example.com',
          message: 'Mr. Johnson was my 5th grade teacher and changed my life. He believed in me when no one else did. Thank you for everything.',
          createdAt: new Date().toISOString()
        }
      ],
      followers: [],
      followerCount: 0
    };
    
    const memorialRef = await adminDb.collection('memorials').add(memorialData);
    console.log('✅ Created test memorial:', memorialRef.id);
    
    return memorialRef.id;
    
  } catch (error) {
    console.error('❌ Error creating test memorial:', error);
  }
}

async function main() {
  try {
    await createTestAccounts();
    const memorialId = await createTestMemorial();
    
    console.log('\n🎉 Test accounts and memorial created successfully!');
    console.log('\nTest Accounts:');
    testAccounts.forEach(account => {
      console.log(`${account.role}: ${account.email} / ${account.password}`);
    });
    
    if (memorialId) {
      console.log(`\nTest Memorial ID: ${memorialId}`);
    }
    
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main();
