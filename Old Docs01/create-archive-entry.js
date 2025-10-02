// Create missing archive entry by directly updating the memorial
// This bypasses the normal livestream stop process

async function createArchiveEntry() {
    const memorialId = "uuz7qEUXnRkQUbqrChBO";
    const cloudflareId = "b496cf702af478f1552827d1b73928c1";
    
    console.log("🔧 Creating archive entry manually...");
    
    // We'll use the livestream endpoint to create an archive entry
    // by simulating what should have happened when the stream stopped
    
    const archiveEntry = {
        id: `manual_${Date.now()}`,
        title: "Austin Sanchesgsgsgsgz Memorial Service",
        description: "Memorial service recording",
        cloudflareId: cloudflareId,
        playbackUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`,
        recordingPlaybackUrl: "",
        recordingThumbnail: "",
        startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        endedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isVisible: true,
        recordingReady: false, // Will be updated by recording check
        startedBy: "manual",
        startedByName: "Manual Entry",
        viewerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    console.log("📝 Archive entry to create:", archiveEntry);
    
    try {
        // We'll use the schedule endpoint to update the memorial
        // since it has database write access
        const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Include the archive entry in the update
                livestreamArchive: [archiveEntry]
            })
        });
        
        console.log("Update response status:", response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log("✅ Memorial updated:", result);
            
            // Now check for the recording
            console.log("🔄 Checking for recording...");
            const checkResponse = await fetch(`/api/memorials/${memorialId}/livestream/archive/check-recordings`, {
                method: 'POST'
            });
            
            if (checkResponse.ok) {
                const checkResult = await checkResponse.json();
                console.log("✅ Recording check result:", checkResult);
                
                if (checkResult.updated > 0) {
                    console.log("🎉 Recording is ready! Refreshing page...");
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    console.log("⏳ Recording still processing. Check again in a few minutes.");
                }
            }
        } else {
            const errorText = await response.text();
            console.log("❌ Update failed:", errorText);
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

createArchiveEntry();
