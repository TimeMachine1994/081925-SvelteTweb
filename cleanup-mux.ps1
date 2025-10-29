# MUX Integration Cleanup Script
# Run this script from the project root directory

Write-Host "🧹 Starting MUX Integration Cleanup..." -ForegroundColor Cyan
Write-Host ""

$rootDir = Get-Location

# Track what we're doing
$deletedCount = 0
$errorCount = 0

function Remove-PathSafely {
    param($path)
    
    $fullPath = Join-Path $rootDir $path
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Path $fullPath -Recurse -Force
            Write-Host "  ✅ Deleted: $path" -ForegroundColor Green
            $script:deletedCount++
        } catch {
            Write-Host "  ❌ Error deleting $path : $_" -ForegroundColor Red
            $script:errorCount++
        }
    } else {
        Write-Host "  ⚠️  Not found: $path" -ForegroundColor Yellow
    }
}

# Phase 1: Delete MUX API Directories
Write-Host "📁 Phase 1: Deleting MUX API Directories..." -ForegroundColor Yellow
Remove-PathSafely "frontend\src\routes\api\mux"
Remove-PathSafely "frontend\src\routes\api\config\mux"
Remove-PathSafely "frontend\src\routes\api\bridge"
Remove-PathSafely "frontend\src\routes\api\streams\[streamId]\bridge"
Remove-PathSafely "frontend\src\routes\api\webhooks\mux"
Write-Host ""

# Phase 2: Delete Test Pages
Write-Host "📁 Phase 2: Deleting Test Pages..." -ForegroundColor Yellow
Remove-PathSafely "frontend\src\routes\testpage"
Remove-PathSafely "frontend\src\routes\test\bridge2"
Remove-PathSafely "frontend\src\routes\test-stream"
Write-Host ""

# Phase 3: Delete MUX Components
Write-Host "📁 Phase 3: Deleting MUX Components and Services..." -ForegroundColor Yellow
Remove-PathSafely "frontend\src\lib\components\MuxBridgeTester2.svelte"
Remove-PathSafely "frontend\src\lib\components\MuxBridgeTestCard.svelte"
Remove-PathSafely "frontend\src\lib\services\muxWebRTC.ts"
Remove-PathSafely "frontend\src\lib\services\__tests__\muxWebRTC.test.ts"
Write-Host ""

# Phase 4: Delete Cloudflare Worker
Write-Host "📁 Phase 4: Deleting Cloudflare Worker..." -ForegroundColor Yellow
Remove-PathSafely "workers\mux-bridge"
Write-Host ""

# Phase 5: Delete MUX Documentation
Write-Host "📁 Phase 5: Deleting MUX Documentation..." -ForegroundColor Yellow
Remove-PathSafely "MUX_SETUP_GUIDE.md"
Remove-PathSafely "MUX_ENVIRONMENT_SETUP.md"
Remove-PathSafely "MUX_INTEGRATION_STATUS_REPORT.md"
Remove-PathSafely "MUX_BRIDGE_TEST_COMPONENT_PLAN.md"
Remove-PathSafely "TESTPAGE_GUIDE.md"
Remove-PathSafely "BRIDGE_API_IMPLEMENTATION_PLAN.md"
Remove-PathSafely "CLOUDFLARE_WORKER_DEPLOYMENT_GUIDE.md"
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "  ✅ Successfully deleted: $deletedCount items" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  ❌ Errors encountered: $errorCount items" -ForegroundColor Red
}
Write-Host ""
Write-Host "⚠️  MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host "  1. Review and update: frontend\src\lib\components\BrowserStreamer.svelte" -ForegroundColor White
Write-Host "     (This component is heavily MUX-integrated and may need removal or rewrite)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Review and update: frontend\src\lib\ui\stream\StreamActions.svelte" -ForegroundColor White
Write-Host "     (Remove MUX browser streaming button)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Update: frontend\src\routes\memorials\[id]\streams\+page.svelte" -ForegroundColor White
Write-Host "     (Remove MUX bridge UI references)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. Update: PRODUCTION_DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "     (Remove MUX deployment steps)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  5. Update: API_DOCUMENTATION.md" -ForegroundColor White
Write-Host "     (Remove MUX API documentation)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  6. Remove MUX environment variables from your .env file:" -ForegroundColor White
Write-Host "     - MUX_TOKEN_ID" -ForegroundColor DarkGray
Write-Host "     - MUX_TOKEN_SECRET" -ForegroundColor DarkGray
Write-Host "     - MUX_WEBHOOK_SECRET" -ForegroundColor DarkGray
Write-Host "     - MUX_BRIDGE_WORKER_URL" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Already updated:" -ForegroundColor Green
Write-Host "  - frontend\.env.example (MUX vars removed)" -ForegroundColor White
Write-Host "  - frontend\src\lib\config\features.ts (MUX flags removed)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Review the CLEANUP_MUX_INTEGRATION.md file for full details" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
