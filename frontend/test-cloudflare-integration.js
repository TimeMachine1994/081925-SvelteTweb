#!/usr/bin/env node

/**
 * Test script to verify Cloudflare Stream integration
 * Run with: node test-cloudflare-integration.js
 */

import {
	createLiveInput,
	isCloudflareConfigured,
	deleteLiveInput
} from './src/lib/server/cloudflare-stream.js';

async function testCloudflareIntegration() {
	console.log('🎬 Testing Cloudflare Stream Integration...\n');

	// Check if Cloudflare is configured
	console.log('1. Checking Cloudflare configuration...');
	const isConfigured = isCloudflareConfigured();
	console.log(`   Cloudflare configured: ${isConfigured ? '✅ YES' : '❌ NO'}\n`);

	if (!isConfigured) {
		console.log('❌ Cloudflare is not configured. Please add to .env:');
		console.log('   CLOUDFLARE_ACCOUNT_ID=your_account_id');
		console.log('   CLOUDFLARE_API_TOKEN=your_api_token\n');
		return;
	}

	try {
		// Test creating a live input
		console.log('2. Creating test live input...');
		const liveInput = await createLiveInput({
			name: 'Test Stream - Integration Test',
			recording: true,
			recordingTimeout: 30
		});

		console.log('✅ Live input created successfully!');
		console.log(`   Input ID: ${liveInput.uid}`);
		console.log(`   RTMP URL: ${liveInput.rtmps.url}`);
		console.log(`   Stream Key: ${liveInput.rtmps.streamKey.substring(0, 8)}...`);
		console.log(`   Recording: ${liveInput.recording?.mode || 'automatic'}\n`);

		// Test deleting the live input
		console.log('3. Cleaning up test live input...');
		await deleteLiveInput(liveInput.uid);
		console.log('✅ Live input deleted successfully!\n');

		console.log('🎉 All tests passed! Cloudflare Stream integration is working correctly.');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error('   Full error:', error);
	}
}

// Run the test
testCloudflareIntegration().catch(console.error);
