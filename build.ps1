esbuild main.js --bundle --outfile="dist/main.js" --format=esm --minify --log-level=warning
terser dist/main.js --output dist/main.js --compress --mangle --module
# npx roadroller dist/main.js -o dist/main.js
Remove-Item .\svg-optimized\*
svgo --folder dist --output svg-optimized --quiet --precision 2 --multipass
Compress-Archive "dist/main.js", ".\dist\index.html", "svg-optimized\*.svg"  ./output.zip -CompressionLevel Optimal -Force
$len = (Get-Item .\output.zip).Length / 1024
$js_len = (Get-Item dist\main.js).Length / 1024
$images_len = (Get-ChildItem .\svg-optimized | Measure-Object -Property Length -Sum).Sum / 1024
Write-Output "zip: $len"
Write-Output "js: $js_len"
Write-Output "images: $images_len"