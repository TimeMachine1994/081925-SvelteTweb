// Debug what data the stream management page is receiving
console.log('🔍 Debugging stream data...');

async function debugStreamData() {
    const streamId = '5SzVoDtsihClmGnPU8ph';
    
    console.log('\n1. What the recordings API returns:');
    const recordingsResponse = await fetch(`http://localhost:5173/api/streams/${streamId}/recordings`);
    const recordingsData = await recordingsResponse.json();
    
    console.log('- Success:', recordingsData.success);
    console.log('- Recording Count:', recordingsData.recordingCount);
    console.log('- Ready Recordings:', recordingsData.readyRecordings);
    if (recordingsData.latestRecording) {
        console.log('- Latest Recording Ready:', recordingsData.latestRecording.isReady);
        console.log('- HLS URL:', recordingsData.latestRecording.playbackUrls.hls);
    }
    
    console.log('\n2. The recordings API should have updated the database');
    console.log('   But the UI might not be getting the updated data');
    
    console.log('\n3. The CompletedStreamCard needs these fields to show "ready":');
    console.log('   - stream.recordingReady = true');
    console.log('   - stream.recordingPlaybackUrl = HLS URL');
    
    console.log('\n4. If UI still shows "Checking", the issue is:');
    console.log('   a) Database update failed silently');
    console.log('   b) UI polling not working');
    console.log('   c) Stream management page not getting updated data');
    
    console.log('\n5. Try refreshing the page manually to see if data is there');
}

debugStreamData().catch(console.error);
