import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock SvelteKit environment
vi.mock('$env/dynamic/private', () => ({
	env: {
		FIREBASE_PROJECT_ID: 'fir-tweb',
		FIREBASE_PRIVATE_KEY: 'mock-key',
		FIREBASE_CLIENT_EMAIL: 'mock@example.com'
	}
}));

import { adminDb, adminAuth } from '$lib/server/firebase';

describe('Firebase Integration Tests', () => {
	beforeAll(async () => {
		// Set up test environment to use emulators
		process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
		process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9098';
	});

	afterAll(async () => {
		// Clean up test environment
		delete process.env.FIRESTORE_EMULATOR_HOST;
		delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
	});

	it('should connect to Firestore emulator', async () => {
		// Test basic Firestore connection
		const testDoc = adminDb.collection('test').doc('integration-test');
		
		await testDoc.set({
			message: 'Hello from integration test',
			timestamp: new Date(),
			testId: 'firebase-integration-test'
		});

		const snapshot = await testDoc.get();
		const data = snapshot.data();

		expect(snapshot.exists).toBe(true);
		expect(data?.message).toBe('Hello from integration test');
		expect(data?.testId).toBe('firebase-integration-test');
	});

	it('should create and retrieve event data', async () => {
		// Test event creation workflow
		const memorialData = {
			lovedOneName: 'Test Event Person',
			slug: 'test-event-integration',
			fullSlug: 'test-event-integration',
			ownerUid: 'test-owner-uid',
			ownerEmail: 'test@example.com',
			isPublic: false,
			content: 'Test event content',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const docRef = await adminDb.collection('memorials').add(memorialData);
		expect(docRef.id).toBeDefined();

		// Retrieve the event
		const snapshot = await docRef.get();
		const retrievedData = snapshot.data();

		expect(retrievedData?.lovedOneName).toBe('Test Event Person');
		expect(retrievedData?.slug).toBe('test-event-integration');
		expect(retrievedData?.ownerEmail).toBe('test@example.com');
	});

	it('should create user with authentication', async () => {
		// Test user creation workflow
		const userRecord = await adminAuth.createUser({
			email: 'integration-test@example.com',
			password: 'testpassword123',
			displayName: 'Integration Test User'
		});

		expect(userRecord.uid).toBeDefined();
		expect(userRecord.email).toBe('integration-test@example.com');
		expect(userRecord.displayName).toBe('Integration Test User');

		// Set custom claims
		await adminAuth.setCustomUserClaims(userRecord.uid, {
			role: 'owner',
			isOwner: true
		});

		// Verify claims
		const userWithClaims = await adminAuth.getUser(userRecord.uid);
		expect(userWithClaims.customClaims?.role).toBe('owner');
		expect(userWithClaims.customClaims?.isOwner).toBe(true);
	});

	it('should handle audit logging', async () => {
		// Test audit log creation
		const auditLogData = {
			uid: 'test-user-uid',
			action: 'integration_test_action',
			userEmail: 'test@example.com',
			userRole: 'owner',
			resourceType: 'event',
			resourceId: 'test-event-id',
			details: { testType: 'integration' },
			success: true,
			timestamp: new Date(),
			ipAddress: '127.0.0.1',
			userAgent: 'vitest-integration-test'
		};

		const docRef = await adminDb.collection('audit_logs').add(auditLogData);
		expect(docRef.id).toBeDefined();

		// Query audit logs
		const querySnapshot = await adminDb
			.collection('audit_logs')
			.where('action', '==', 'integration_test_action')
			.get();

		expect(querySnapshot.empty).toBe(false);
		expect(querySnapshot.docs.length).toBe(1);
		
		const logData = querySnapshot.docs[0].data();
		expect(logData.userEmail).toBe('test@example.com');
		expect(logData.details.testType).toBe('integration');
	});
});
