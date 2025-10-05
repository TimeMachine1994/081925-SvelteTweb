// Force trigger the polling system to update the UI
console.log('🔄 Force triggering polling system...');

async function forcePolling() {
    const streamId = '5SzVoDtsihClmGnPU8ph';
    
    console.log('\n1. Simulating the polling system check:');
    
    // This is what the UI polling does - check for completed streams without recordingReady
    console.log('- Checking if stream needs recording update...');
    console.log('- Stream ID:', streamId);
    console.log('- Expected: status="completed", recordingReady=false');
    
    console.log('\n2. Calling recordings API (what polling does):');
    const recordingsResponse = await fetch(`http://localhost:5173/api/streams/${streamId}/recordings`);
    const recordingsData = await recordingsResponse.json();
    
    if (recordingsData.success && recordingsData.recordingCount > 0) {
        console.log('✅ Recordings found - database should be updated');
        console.log('- Recording Count:', recordingsData.recordingCount);
        console.log('- Ready Recordings:', recordingsData.readyRecordings);
    }
    
    console.log('\n3. The UI should now refresh and show the video player');
    console.log('   If it doesn\'t, try:');
    console.log('   a) Hard refresh the page (Ctrl+F5)');
    console.log('   b) Check browser console for errors');
    console.log('   c) Check if polling is actually running');
    
    console.log('\n4. Expected result: CompletedStreamCard shows video player');
}

forcePolling().catch(console.error);
