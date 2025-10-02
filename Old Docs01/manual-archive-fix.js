// Manual fix to create missing archive entry
// Run this in browser console to create the missing archive entry

async function createMissingArchiveEntry() {
    const memorialId = "uuz7qEUXnRkQUbqrChBO";
    const cloudflareId = "b496cf702af478f1552827d1b73928c1";
    
    console.log("🔧 Creating missing archive entry...");
    
    try {
        // Create archive entry manually via API
        const response = await fetch(`/api/memorials/${memorialId}/livestream/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: `manual_${Date.now()}`,
                title: "Austin Sanchesgsgsgsgz Memorial Service",
                description: "Memorial service recording",
                cloudflareId: cloudflareId,
                playbackUrl: `https://cloudflarestream.com/${cloudflareId}/iframe`,
                recordingPlaybackUrl: "",
                recordingThumbnail: "",
                startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                endedAt: new Date(),
                isVisible: true,
                recordingReady: false,
                startedBy: "manual",
                startedByName: "Manual Entry",
                viewerCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("✅ Archive entry created:", result);
            
            // Now trigger recording check
            console.log("🔄 Checking for recording...");
            const checkResponse = await fetch(`/api/memorials/${memorialId}/livestream/archive/check-recordings`, {
                method: 'POST'
            });
            const checkResult = await checkResponse.json();
            console.log("✅ Recording check result:", checkResult);
            
            if (checkResult.updated > 0) {
                console.log("🎉 Recording is ready! Refresh the page to see it.");
                setTimeout(() => window.location.reload(), 2000);
            } else {
                console.log("⏳ Recording still processing. Will check again in 30 seconds...");
            }
        } else {
            console.error("❌ Failed to create archive entry:", await response.text());
        }
        
    } catch (error) {
        console.error("❌ Error creating archive entry:", error);
    }
}

createMissingArchiveEntry();
