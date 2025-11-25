// Enhanced debug script to check recording status
// Run this in your browser console on the event page

async function debugRecording() {
    const memorialId = "uuz7qEUXnRkQUbqrChBO"; // Your event ID from logs
    const cloudflareId = "b496cf702af478f1552827d1b73928c1"; // Your current Cloudflare ID
    
    console.log("🔍 Debugging recording status for event:", memorialId);
    console.log("🎬 Cloudflare ID:", cloudflareId);
    
    try {
        // Check current event data
        console.log("📊 Checking event archive entries...");
        const archiveResponse = await fetch(`/api/memorials/${memorialId}/livestream/archive`);
        const archiveData = await archiveResponse.json();
        
        console.log("📋 Archive entries:", archiveData);
        console.log("📋 Archive count:", archiveData.length);
        
        if (archiveData.length > 0) {
            archiveData.forEach((entry, index) => {
                console.log(`📼 Entry ${index + 1}:`, {
                    id: entry.id,
                    title: entry.title,
                    cloudflareId: entry.cloudflareId,
                    recordingReady: entry.recordingReady,
                    isVisible: entry.isVisible,
                    playbackUrl: entry.playbackUrl
                });
            });
        }
        
        // Trigger manual recording check
        console.log("🔄 Triggering manual recording check...");
        const checkResponse = await fetch(`/api/memorials/${memorialId}/livestream/archive/check-recordings`, {
            method: 'POST'
        });
        const checkData = await checkResponse.json();
        
        console.log("✅ Manual check result:", checkData);
        
        // Check updated archive
        console.log("📊 Checking updated archive entries...");
        const updatedArchiveResponse = await fetch(`/api/memorials/${memorialId}/livestream/archive`);
        const updatedArchiveData = await updatedArchiveResponse.json();
        
        console.log("📋 Updated archive entries:", updatedArchiveData);
        
        if (updatedArchiveData.length > 0) {
            updatedArchiveData.forEach((entry, index) => {
                console.log(`📼 Updated Entry ${index + 1}:`, {
                    id: entry.id,
                    title: entry.title,
                    cloudflareId: entry.cloudflareId,
                    recordingReady: entry.recordingReady,
                    isVisible: entry.isVisible,
                    playbackUrl: entry.playbackUrl
                });
            });
        }
        
    } catch (error) {
        console.error("❌ Debug error:", error);
    }
}

// Run the debug function
debugRecording();
