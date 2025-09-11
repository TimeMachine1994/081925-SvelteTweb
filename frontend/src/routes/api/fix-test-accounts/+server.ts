import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

const testAccounts = [
  {
    email: 'admin@test.com',
    role: 'admin',
    customClaims: {
      role: 'admin',
      admin: true
    }
  },
  {
    email: 'director@test.com',
    role: 'funeral_director',
    customClaims: {
      role: 'funeral_director',
      admin: false
    }
  },
  {
    email: 'owner@test.com',
    role: 'owner',
    customClaims: {
      role: 'owner',
      admin: false
    }
  }
];

export const POST: RequestHandler = async () => {
  try {
    const results = [];
    
    for (const account of testAccounts) {
      try {
        // Get user by email
        const userRecord = await adminAuth.getUserByEmail(account.email);
        
        // Set custom claims
        await adminAuth.setCustomUserClaims(userRecord.uid, account.customClaims);
        
        results.push({ 
          success: true, 
          email: account.email, 
          role: account.role,
          message: 'Custom claims updated'
        });
        
      } catch (error: any) {
        results.push({ 
          success: false, 
          email: account.email, 
          role: account.role,
          error: error.message 
        });
      }
    }
    
    return json({ success: true, results });
    
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
