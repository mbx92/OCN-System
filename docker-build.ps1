# OCN System Docker Build & Push Script (Windows PowerShell)
# Usage: .\docker-build.ps1 [version]

param(
    [string]$Version = "latest"
)

$ImageName = "mbx92/ocn-system"
$ErrorActionPreference = "Stop"

Write-Host "🐳 Building Docker image..." -ForegroundColor Cyan
Write-Host "   Image: ${ImageName}:${Version}" -ForegroundColor Gray
Write-Host ""

# Build the image
docker build `
  -t "${ImageName}:${Version}" `
  -t "${ImageName}:latest" `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Pushing to Docker Hub..." -ForegroundColor Cyan

# Push both tags
docker push "${ImageName}:${Version}"

if ($Version -ne "latest") {
    docker push "${ImageName}:latest"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Push successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Docker image updated:" -ForegroundColor Green
Write-Host "   - ${ImageName}:${Version}" -ForegroundColor Gray
Write-Host "   - ${ImageName}:latest" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 To deploy on production:" -ForegroundColor Yellow
Write-Host "   docker pull ${ImageName}:latest" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
