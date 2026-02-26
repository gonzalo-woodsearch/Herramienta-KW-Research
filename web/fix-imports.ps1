$files = Get-ChildItem -Path "lib" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace "from '(.*)\.js'", "from '`$1'"
    $newContent = $newContent -replace 'from "(.*)\.js"', 'from "`$1"'
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "`nDone! Fixed all .js extensions in imports"
