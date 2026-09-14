Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\kiyer\.gemini\antigravity-ide\brain\f46af043-7ad5-4ca8-b114-591bacc63e52\.user_uploaded\media_1789372343756.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Found logo bounding box: minX=$minX minY=$minY maxX=$maxX maxY=$maxY"

# Add safety margin of 10px
$padding = 12
$cropX = [Math]::Max(0, $minX - $padding)
$cropY = [Math]::Max(0, $minY - $padding)
$cropW = [Math]::Min($bmp.Width - $cropX, ($maxX - $minX + 1) + ($padding * 2))
$cropH = [Math]::Min($bmp.Height - $cropY, ($maxY - $minY + 1) + ($padding * 2))

$rect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
$cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bmp.Dispose()

$destLogo = "c:\Users\kiyer\OneDrive\Documents\Project Faisal\Faisal Phone\public\logo.png"
$destIcon = "c:\Users\kiyer\OneDrive\Documents\Project Faisal\Faisal Phone\public\icon.png"

$cropped.Save($destLogo, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Write-Host "SUCCESS: Cropped logo saved to $destLogo and $destIcon"
