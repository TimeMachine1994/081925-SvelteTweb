# PowerShell script to remove conflicting route directories
# Run this to resolve the route conflicts

Write-Host "🧹 Cleaning up conflicting route directories..."

$frontendPath = "c:\Code\Tributestream\Winsurf\081925-SvelteTweb\frontend"
$streamsPath = "$frontendPath\src\routes\api\streams"

# Remove the old [id] directory
$idPath = "$streamsPath\[id]"
if (Test-Path $idPath) {
    Write-Host "🗑️ Removing $idPath"
    Remove-Item -Path $idPath -Recurse -Force
    Write-Host "✅ Removed [id] directory"
} else {
    Write-Host "⚠️ [id] directory not found"
}

# Remove the old [streamId] directory  
$streamIdPath = "$streamsPath\[streamId]"
if (Test-Path $streamIdPath) {
    Write-Host "🗑️ Removing $streamIdPath"
    Remove-Item -Path $streamIdPath -Recurse -Force
    Write-Host "✅ Removed [streamId] directory"
} else {
    Write-Host "⚠️ [streamId] directory not found"
}

Write-Host "🎉 Route cleanup complete!"
Write-Host ""
Write-Host "New API structure:"
Write-Host "- Management: /api/streams/management/[id]/"
Write-Host "- Playback: /api/streams/playback/[streamId]/"
Write-Host ""
Write-Host "You can now restart the dev server without conflicts."
