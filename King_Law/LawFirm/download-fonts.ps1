# Download fonts for King Law Firm
# Run this script from the project root directory

Write-Host "Downloading custom fonts..." -ForegroundColor Cyan

$fontsDir = "static/fonts"

# Create fonts directory if it doesn't exist
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force
    Write-Host "Created fonts directory" -ForegroundColor Green
}

# Download Junction
Write-Host "`nDownloading Junction..." -ForegroundColor Yellow
$junctionUrl = "https://github.com/theleagueofmoveabletype/junction/releases/download/2.5/junction.zip"
Invoke-WebRequest -Uri $junctionUrl -OutFile "$fontsDir/junction.zip"
Expand-Archive -Path "$fontsDir/junction.zip" -DestinationPath "$fontsDir/junction-temp" -Force
Copy-Item "$fontsDir/junction-temp/webfonts/Junction-regular.woff2" "$fontsDir/Junction-regular.woff2" -Force
Copy-Item "$fontsDir/junction-temp/webfonts/Junction-regular.woff" "$fontsDir/Junction-regular.woff" -Force
Remove-Item "$fontsDir/junction.zip"
Remove-Item "$fontsDir/junction-temp" -Recurse -Force
Write-Host "✓ Junction installed" -ForegroundColor Green

# Download Goudy Bookletter 1911
Write-Host "`nDownloading Goudy Bookletter 1911..." -ForegroundColor Yellow
$goudyUrl = "https://github.com/theleagueofmoveabletype/goudy-bookletter-1911/releases/download/1.100/goudy-bookletter-1911.zip"
Invoke-WebRequest -Uri $goudyUrl -OutFile "$fontsDir/goudy.zip"
Expand-Archive -Path "$fontsDir/goudy.zip" -DestinationPath "$fontsDir/goudy-temp" -Force
Copy-Item "$fontsDir/goudy-temp/webfonts/GoudyBookletter1911.woff2" "$fontsDir/GoudyBookletter1911.woff2" -Force
Copy-Item "$fontsDir/goudy-temp/webfonts/GoudyBookletter1911.woff" "$fontsDir/GoudyBookletter1911.woff" -Force
Remove-Item "$fontsDir/goudy.zip"
Remove-Item "$fontsDir/goudy-temp" -Recurse -Force
Write-Host "✓ Goudy Bookletter 1911 installed" -ForegroundColor Green

# Download League Script
Write-Host "`nDownloading League Script..." -ForegroundColor Yellow
$scriptUrl = "https://github.com/theleagueofmoveabletype/league-script/releases/download/1.400/league-script.zip"
Invoke-WebRequest -Uri $scriptUrl -OutFile "$fontsDir/league-script.zip"
Expand-Archive -Path "$fontsDir/league-script.zip" -DestinationPath "$fontsDir/script-temp" -Force
Copy-Item "$fontsDir/script-temp/webfonts/LeagueScript-Regular.woff2" "$fontsDir/LeagueScript-Regular.woff2" -Force
Copy-Item "$fontsDir/script-temp/webfonts/LeagueScript-Regular.woff" "$fontsDir/LeagueScript-Regular.woff" -Force
Remove-Item "$fontsDir/league-script.zip"
Remove-Item "$fontsDir/script-temp" -Recurse -Force
Write-Host "✓ League Script installed" -ForegroundColor Green

Write-Host "`n✓ All fonts downloaded successfully!" -ForegroundColor Green
Write-Host "`nInstalled fonts:" -ForegroundColor Cyan
Get-ChildItem "$fontsDir/*.woff*" | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host "`nFonts are ready to use! Run 'npm run dev' to test." -ForegroundColor Green
