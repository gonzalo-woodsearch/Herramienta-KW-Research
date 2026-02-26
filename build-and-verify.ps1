$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location "C:\Users\WoodSearch3\Desktop\Herramienta KW Research"
Write-Host "Building TypeScript..." -ForegroundColor Cyan
npm run build
Write-Host "`nVerifying Ahrefs credentials..." -ForegroundColor Cyan
npm run verify
