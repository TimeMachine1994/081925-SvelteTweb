// Test database update for recordings
console.log('🧪 Testing database update for recordings...');

// Simulate calling the recordings API and checking if database gets updated
async function testDatabaseUpdate() {
    const streamId = '5SzVoDtsihClmGnPU8ph';
    
    console.log('\n1. Calling recordings API...');
    const response = await fetch(`http://localhost:5173/api/streams/${streamId}/recordings`);
    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log('- Success:', data.success);
    console.log('- Recording Count:', data.recordingCount);
    console.log('- Ready Recordings:', data.readyRecordings);
    
    if (data.latestRecording) {
        console.log('- Latest Recording UID:', data.latestRecording.uid);
        console.log('- Is Ready:', data.latestRecording.isReady);
        console.log('- HLS URL:', data.latestRecording.playbackUrls.hls);
    }
    
    console.log('\n2. Database should now be updated with recording info');
    console.log('Check your Firebase console or stream management page to verify');
}

testDatabaseUpdate().catch(console.error);
