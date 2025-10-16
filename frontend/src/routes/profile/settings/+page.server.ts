import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Ensure user is authenticated
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	try {
		// Get user profile data
		const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
		const userData = userDoc.data();

		// Get additional profile data based on role
		let additionalData = {};
		if (locals.user.role === 'funeral_director') {
			const fdDoc = await adminDb.collection('funeral_directors').doc(locals.user.uid).get();
			if (fdDoc.exists) {
				additionalData = { funeralDirector: fdDoc.data() };
			}
		}

		return {
			user: locals.user,
			profile: userData,
			...additionalData
		};
	} catch (error) {
		console.error('Error loading profile settings:', error);
		throw redirect(302, '/profile');
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Not authenticated', success: false });
		}

		try {
			const formData = await request.formData();
			const displayName = formData.get('displayName')?.toString();
			const email = formData.get('email')?.toString();
			const phone = formData.get('phone')?.toString();
			const street = formData.get('street')?.toString();
			const city = formData.get('city')?.toString();
			const state = formData.get('state')?.toString();
			const zipCode = formData.get('zipCode')?.toString();

			// Validate required fields
			if (!displayName || !email) {
				return fail(400, { 
					message: 'Display name and email are required', 
					success: false 
				});
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return fail(400, { 
					message: 'Please enter a valid email address', 
					success: false 
				});
			}

			// Prepare update data
			const updateData: any = {
				displayName,
				email,
				phone: phone || null,
				address: {
					street: street || '',
					city: city || '',
					state: state || '',
					zipCode: zipCode || ''
				},
				updatedAt: new Date()
			};

			// Update user document in Firestore
			await adminDb.collection('users').doc(locals.user.uid).update(updateData);

			// If email changed, update Firebase Auth email
			if (email !== locals.user.email) {
				try {
					const auth = getAuth();
					await auth.updateUser(locals.user.uid, { email });
				} catch (authError) {
					console.error('Error updating auth email:', authError);
					// Continue with profile update even if auth email update fails
				}
			}

			return {
				message: 'Profile updated successfully!',
				success: true
			};

		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { 
				message: 'Failed to update profile. Please try again.', 
				success: false 
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Not authenticated', success: false });
		}

		try {
			const formData = await request.formData();
			const currentPassword = formData.get('currentPassword')?.toString();
			const newPassword = formData.get('newPassword')?.toString();
			const confirmPassword = formData.get('confirmPassword')?.toString();

			// Validate required fields
			if (!currentPassword || !newPassword || !confirmPassword) {
				return fail(400, { 
					message: 'All password fields are required', 
					success: false 
				});
			}

			// Validate password match
			if (newPassword !== confirmPassword) {
				return fail(400, { 
					message: 'New passwords do not match', 
					success: false 
				});
			}

			// Validate password strength
			if (newPassword.length < 6) {
				return fail(400, { 
					message: 'Password must be at least 6 characters long', 
					success: false 
				});
			}

			// Note: In a real implementation, you would need to verify the current password
			// This typically requires re-authentication on the client side
			// For now, we'll just update the password in Firebase Auth
			try {
				const auth = getAuth();
				await auth.updateUser(locals.user.uid, {
					password: newPassword
				});

				// Update password change timestamp in user document
				await adminDb.collection('users').doc(locals.user.uid).update({
					passwordChangedAt: new Date(),
					updatedAt: new Date()
				});

				return {
					message: 'Password updated successfully!',
					success: true
				};

			} catch (authError: any) {
				console.error('Error updating password:', authError);
				
				// Handle specific Firebase Auth errors
				if (authError.code === 'auth/weak-password') {
					return fail(400, { 
						message: 'Password is too weak. Please choose a stronger password.', 
						success: false 
					});
				}
				
				return fail(500, { 
					message: 'Failed to update password. Please try again.', 
					success: false 
				});
			}

		} catch (error) {
			console.error('Error changing password:', error);
			return fail(500, { 
				message: 'Failed to change password. Please try again.', 
				success: false 
			});
		}
	}
};
