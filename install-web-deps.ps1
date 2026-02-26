$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location "C:\Users\WoodSearch3\Desktop\Herramienta KW Research\web"
Write-Host "Installing web app dependencies..." -ForegroundColor Cyan
npm install
