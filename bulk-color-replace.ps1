# Bulk Color Replacement Script for Tributestream Live Rebrand
# Replaces memorial gold (#D5BA7F) with celebration blue (#3B82F6)

Write-Host "🎨 Tributestream Live - Bulk Color Replacement Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = ".\frontend\src"
$fileExtensions = @("*.svelte", "*.ts", "*.css")

# Color mappings: Old (Gold) to New (Blue)
$colorReplacements = @{
    # Hex colors uppercase
    "#D5BA7F" = "#3B82F6"
    "#C5AA6F" = "#2563EB"
    
    # Tailwind classes - exact matches
    "bg-[#D5BA7F]" = "bg-blue-500"
    "text-[#D5BA7F]" = "text-blue-500"
    "hover:bg-[#D5BA7F]" = "hover:bg-blue-600"
    "hover:text-[#D5BA7F]" = "hover:text-blue-400"
    "focus:ring-[#D5BA7F]" = "focus:ring-blue-500"
    "focus:border-[#D5BA7F]" = "focus:border-blue-500"
    "border-[#D5BA7F]" = "border-blue-500"
    "bg-[#C5AA6F]" = "bg-blue-600"
    "hover:bg-[#C5AA6F]" = "hover:bg-blue-700"
}

$totalFiles = 0
$totalReplacements = 0

Write-Host "Searching for files in: $rootPath" -ForegroundColor Yellow
Write-Host ""

foreach ($extension in $fileExtensions) {
    $files = Get-ChildItem -Path $rootPath -Filter $extension -Recurse -File
    
    foreach ($file in $files) {
        $fileChanged = $false
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        $fileReplacements = 0
        
        foreach ($oldColor in $colorReplacements.Keys) {
            $newColor = $colorReplacements[$oldColor]
            
            if ($content -match [regex]::Escape($oldColor)) {
                $matchCount = ([regex]::Matches($content, [regex]::Escape($oldColor))).Count
                $content = $content -replace [regex]::Escape($oldColor), $newColor
                $fileReplacements += $matchCount
                $fileChanged = $true
            }
        }
        
        if ($fileChanged) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $totalFiles++
            $totalReplacements += $fileReplacements
            
            $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
            Write-Host "✅ Updated: $relativePath" -ForegroundColor Green
            Write-Host "   Replacements: $fileReplacements" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Color replacement complete!" -ForegroundColor Green
Write-Host "Files updated: $totalFiles" -ForegroundColor Yellow
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual review recommended for:" -ForegroundColor Magenta
Write-Host "  - Inline styles with hex colors" -ForegroundColor Gray
Write-Host "  - CSS variables" -ForegroundColor Gray
Write-Host "  - SVG attributes" -ForegroundColor Gray
Write-Host ""
