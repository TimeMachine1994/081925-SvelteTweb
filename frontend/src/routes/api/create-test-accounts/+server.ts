import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase';

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

export const POST: RequestHandler = async () => {
  try {
    const results = [];
    
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
        const customClaims: Record<string, any> = { role: account.role };
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
        
        results.push({ success: true, role: account.role, email: account.email });
        
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          results.push({ success: true, role: account.role, email: account.email, message: 'Already exists' });
        } else {
          results.push({ success: false, role: account.role, email: account.email, error: error.message });
        }
      }
    }
    
    // Create test memorial
    try {
      const ownerUser = await adminAuth.getUserByEmail('owner@test.com');
      
      const memorialData = {
        lovedOneName: 'Robert Johnson',
        dateOfBirth: '1945-03-15',
        dateOfPassing: '2024-09-01',
        biography: 'Robert was a loving father, grandfather, and friend to many. He spent his career as a teacher, inspiring countless students over 40 years. He loved fishing, gardening, and spending time with his family.',
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
            message: 'Dad was the most wonderful man I ever knew. He taught me to be kind, work hard, and always help others.',
            createdAt: new Date().toISOString()
          }
        ],
        followers: [],
        followerCount: 0
      };
      
      const memorialRef = await adminDb.collection('memorials').add(memorialData);
      results.push({ success: true, type: 'memorial', id: memorialRef.id });
      
    } catch (error: any) {
      results.push({ success: false, type: 'memorial', error: error.message });
    }
    
    return json({ success: true, results });
    
  } catch (error: any) {
    console.error('Error creating test accounts:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
