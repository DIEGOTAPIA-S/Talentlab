$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
try {
    $filePath = "c:\Users\ingdi\OneDrive\Desktop\DUKITO DOC\SENA_PR\PITCH PRESENTACIÓN FINAL.pptx"
    $pres = $ppt.Presentations.Open($filePath)
    $outDir = "C:\Users\ingdi\.gemini\antigravity\brain\e3a49266-4aa7-4c34-a91f-3608dcc1b9d9\scratch\slides"
    if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }
    $pres.Slides.Item(1).Export("$outDir\slide_1.png", "PNG", 1280, 720)
    $pres.Slides.Item(2).Export("$outDir\slide_2.png", "PNG", 1280, 720)
    $pres.Slides.Item(10).Export("$outDir\slide_10.png", "PNG", 1280, 720)
    $pres.Close()
    Write-Host "Exported sample slides!"
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
