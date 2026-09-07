# Fix route conflicts by removing old directories
Write-Host "🔧 Fixing route conflicts..."

$streamsPath = "src\routes\api\streams"

# Stop the dev server first
Write-Host "⏹️ Please stop the dev server (Ctrl+C) before running this script"
Read-Host "Press Enter when dev server is stopped"

# Remove [id] directory
if (Test-Path "$streamsPath\[id]") {
    Write-Host "🗑️ Removing [id] directory..."
    Remove-Item "$streamsPath\[id]" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed [id] directory"
}

# Remove [streamId] directory  
if (Test-Path "$streamsPath\[streamId]") {
    Write-Host "🗑️ Removing [streamId] directory..."
    Remove-Item "$streamsPath\[streamId]" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed [streamId] directory"
}

Write-Host "🎉 Route conflicts resolved!"
Write-Host "You can now restart: npm run dev"
