// Fix stream status and test recording polling
console.log('🔧 Fixing stream status and testing recording polling...');

async function fixStreamStatus() {
	const streamId = '5SzVoDtsihClmGnPU8ph';

	console.log('\n1. Current stream status:');
	const statusResponse = await fetch('http://localhost:5173/api/streams/check-live-status', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ streamIds: [streamId] })
	});
	const statusData = await statusResponse.json();
	console.log('- Status:', statusData.results[0].status);
	console.log('- Was Live:', statusData.results[0].wasLive);
	console.log('- Is Live:', statusData.results[0].isLive);

	console.log('\n2. The issue: Stream status is "scheduled" but should be "completed"');
	console.log("   This is why recording polling isn't working!");

	console.log('\n3. Testing what happens if we manually call recordings API:');
	const recordingsResponse = await fetch(
		`http://localhost:5173/api/streams/${streamId}/recordings`
	);
	const recordingsData = await recordingsResponse.json();

	console.log('- Recordings found:', recordingsData.recordingCount);
	console.log('- Ready recordings:', recordingsData.readyRecordings);
	console.log('- Database should now be updated with recording data');

	console.log('\n4. Solution: We need to either:');
	console.log('   a) Manually update stream status to "completed" in database');
	console.log('   b) Fix the live status detection to properly mark streams as completed');
	console.log('   c) Modify polling to also check "scheduled" streams for recordings');
}

fixStreamStatus().catch(console.error);
