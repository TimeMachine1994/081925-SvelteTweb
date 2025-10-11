import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';

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

				// For funeral directors, create the missing funeral_directors collection entry
				if (account.role === 'funeral_director') {
					await adminDb
						.collection('funeral_directors')
						.doc(userRecord.uid)
						.set({
							companyName: 'Smith & Sons Funeral Home',
							contactPerson: 'John Director',
							email: account.email,
							phone: '(555) 123-4567',
							address: {
								street: '123 Memorial Drive',
								city: 'Orlando',
								state: 'FL',
								zipCode: '32801'
							},
							status: 'approved',
							isActive: true,
							createdAt: new Date(),
							approvedAt: new Date(),
							approvedBy: 'system_auto_approve',
							userId: userRecord.uid
						});
				}

				results.push({
					success: true,
					email: account.email,
					role: account.role,
					message:
						account.role === 'funeral_director'
							? 'Custom claims updated and funeral_directors profile created'
							: 'Custom claims updated'
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
