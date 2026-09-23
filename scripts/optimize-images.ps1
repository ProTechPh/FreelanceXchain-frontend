# Image Optimization Script using sharp
# Usage: .\optimize-images.ps1

$ErrorActionPreference = "Stop"

$ImagesDir = Join-Path $PSScriptRoot ".." "public" "images"

Write-Host "?? Starting image optimization..." -ForegroundColor Cyan
Write-Host ""

# JPEG files to convert
$JpegFiles = @(
    "logo-wordmark.jpg"
    "logo-full.jpg"
    "logo-icon.jpg"
    "logo-sparkle.jpg"
)

function Convert-ToWebP {
    param(
        [string]$InputFile
    )
    
    $InputPath = Join-Path $ImagesDir $InputFile
    $OutputName = $InputFile -replace "\.jpg$", ".webp"
    $OutputPath = Join-Path $ImagesDir $OutputName
    
    if (-not (Test-Path $InputPath)) {
        Write-Host "??  Skipping: $InputFile (not found)" -ForegroundColor Yellow
        return
    }
    
    try {
        # Check if npx and sharp are available
        $sharpVersion = npx sharp --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "? sharp CLI not found. Install with: npm install -g sharp-cli" -ForegroundColor Red
            return
        }
        
        Write-Host "Converting: $InputFile -> $OutputName" -ForegroundColor Green
        npx sharp "$InputPath" --webp "{ quality: 85, effort: 6 }" --output "$OutputPath"
        
        # Show size comparison
        $OriginalSize = (Get-Item $InputPath).Length
        $WebpSize = (Get-Item $OutputPath).Length
        $Savings = [math]::Round(($OriginalSize - $WebpSize) * 100 / $OriginalSize, 1)
        
        Write-Host "   Original: $([math]::Round($OriginalSize / 1KB, 1)) KB" -ForegroundColor Gray
        Write-Host "   WebP: $([math]::Round($WebpSize / 1KB, 1)) KB" -ForegroundColor Gray
        Write-Host "   Savings: $Savings%" -ForegroundColor Green
    }
    catch {
        Write-Host "? Error converting ${InputFile}: $_" -ForegroundColor Red
    }
}

Set-Location $ImagesDir

foreach ($File in $JpegFiles) {
    Convert-ToWebP -InputFile $File
    Write-Host ""
}

Write-Host "? Optimization complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Verify the WebP files were created"
Write-Host "2. Update references in your code to use WebP with JPEG fallback"
Write-Host "3. Keep original JPEG files as fallbacks for older browsers"
