# Documentation Cleanup Script (Simple Version)
# Run this from the project root directory

Write-Host "Tributestream Documentation Cleanup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Ask for confirmation
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Delete 27+ outdated files" -ForegroundColor Yellow
Write-Host "  2. Create archive/ folder for historical docs" -ForegroundColor Yellow
Write-Host "  3. Organize remaining documentation" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Creating archive folders..." -ForegroundColor Green

# Create archive structure
New-Item -ItemType Directory -Force -Path "archive" | Out-Null
New-Item -ItemType Directory -Force -Path "archive/streaming-v1" | Out-Null
New-Item -ItemType Directory -Force -Path "archive/project-tracking" | Out-Null
New-Item -ItemType Directory -Force -Path "archive/implementations" | Out-Null

Write-Host "Archive folders created" -ForegroundColor Green
Write-Host ""

# DELETE SECTION
Write-Host "Deleting outdated files..." -ForegroundColor Yellow
Write-Host ""

$filesToDelete = @(
    "SENDGRID_DYNAMIC_TEMPLATES_MIGRATION.md",
    "SENDGRID_NEW_WELCOME_TEMPLATES.md",
    "SENDGRID_TEMPLATES_COPY_PASTE.md",
    "SENDGRID_TEMPLATE_FIX_PLAN.md",
    "FUNERAL_DIRECTOR_EMAIL_TEMPLATE.md",
    "SENDGRID_FUNERAL_DIRECTOR_TEMPLATE.html",
    "LEGACY_MEMORIAL_VIMEO_DATA.md",
    "LEGACY_MEMORIAL_VIMEO_DATA.json",
    "LEGACY_MEMORIAL_VIMEO_DATA_WITH_SLUGS.json",
    "FIREBASE_MEMORIAL_IMPORT_DATA.json",
    "BUTTON_MIGRATION_PROGRESS.md",
    "BUILD_TIME_IMAGE_OPTIMIZATION_SUMMARY.md",
    "CHECKOUT_PAYMENT_FIX_PLAN.md",
    "REGISTRATION_PREVALIDATION_PLAN.md",
    "QUICK_MIGRATION_EXAMPLES.md",
    "CLOUD_STORAGE_OPTIONS.md",
    "DEMO_TESTS_SUMMARY.md",
    "DEMO_FIRESTORE_SETUP.md",
    "BASIC_REGISTRATION_EMAIL_UPDATE.md",
    "FUNERAL_DIRECTOR_TRACKING_FIX.md",
    "EMAIL_TEMPLATE_EDITOR_IMPLEMENTATION.md",
    "AUDIO_IMPLEMENTATION_GUIDE.md",
    "TRIBUTESTREAM_VIDEO_SCRIPT.md",
    "slideshow-oct17.md",
    "users-temp.json",
    "users.json"
)

$deletedCount = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Deleted: $file" -ForegroundColor Red
        $deletedCount++
    }
}

Write-Host ""
Write-Host "Deleted $deletedCount files" -ForegroundColor Green
Write-Host ""

# ARCHIVE SECTION
Write-Host "Archiving historical docs..." -ForegroundColor Yellow
Write-Host ""

# Archive streaming v1 docs
$streamingArchive = @(
    "STREAMCARD_OVERVIEW.md",
    "STREAMCARD_COMPONENTS.md",
    "STREAMCARD_INTERFACES.md",
    "STREAMCARD_APIS.md",
    "STREAMCARD_MIGRATION_SUMMARY.md",
    "STREAMING_REFACTOR_COMPLETE.md",
    "STREAMING_REFACTOR_EXECUTION_PLAN.md",
    "STREAMING_REFACTOR_PROGRESS.md",
    "STREAMING_ARCHITECTURE_PLAN.md",
    "STREAMING_METHODS_TEST_PLAN.md",
    "STREAMING_MIGRATION_GUIDE.md",
    "SCHEDULE_STREAM_INTEGRATION_ANALYSIS.md"
)

$archivedCount = 0
foreach ($file in $streamingArchive) {
    if (Test-Path $file) {
        Move-Item $file "archive/streaming-v1/" -Force
        Write-Host "  Archived: $file" -ForegroundColor Cyan
        $archivedCount++
    }
}

# Archive project tracking docs
$projectTracking = @(
    "PHASE_1_COMPLETE.md",
    "PHASE_2_COMPLETE.md",
    "PHASE_3_COMPLETE.md",
    "PHASE_4_COMPLETE.md",
    "PHASE_2_DEMO_DATA_COMPLETE.md",
    "IMPLEMENTATION_COMPLETE_SUMMARY.md"
)

foreach ($file in $projectTracking) {
    if (Test-Path $file) {
        Move-Item $file "archive/project-tracking/" -Force
        Write-Host "  Archived: $file" -ForegroundColor Cyan
        $archivedCount++
    }
}

# Archive implementation docs
$implementations = @(
    "WELCOME_EMAILS_IMPLEMENTATION.md",
    "FUNERAL_DIRECTOR_EMAIL_IMPLEMENTATION.md"
)

foreach ($file in $implementations) {
    if (Test-Path $file) {
        Move-Item $file "archive/implementations/" -Force
        Write-Host "  Archived: $file" -ForegroundColor Cyan
        $archivedCount++
    }
}

Write-Host ""
Write-Host "Archived $archivedCount files" -ForegroundColor Green
Write-Host ""

# SUMMARY
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

$remainingDocs = (Get-ChildItem -Path . -Filter "*.md" -File).Count
$archivedDocsTotal = (Get-ChildItem -Path "archive" -Filter "*.md" -Recurse -File).Count

Write-Host "  Remaining docs in root: $remainingDocs" -ForegroundColor Green
Write-Host "  Archived docs: $archivedDocsTotal" -ForegroundColor Cyan
Write-Host "  Deleted files: $deletedCount" -ForegroundColor Red
Write-Host ""

Write-Host "Documentation cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review DOCUMENTATION_AUDIT.md for full details" -ForegroundColor White
Write-Host "  2. Update API_DOCUMENTATION.md (remove WHIP/WHEP)" -ForegroundColor White
Write-Host "  3. Consider deleting Old Docs01/ folder" -ForegroundColor White
Write-Host ""
