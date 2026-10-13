param(
  [string]$DeckPath = 'output\ai-history-to-agents-50min.pptx',
  [string]$PreviewPath = '.cache\slide-preview',
  [string]$PdfPath = 'output\ai-history-to-agents-50min.pdf'
)
$ErrorActionPreference = 'Stop'
$workspacePath = Split-Path -Parent $PSScriptRoot
$pptxPath = (Resolve-Path -LiteralPath (Join-Path $workspacePath $DeckPath)).Path
$previewDirectory = [System.IO.Path]::GetFullPath((Join-Path $workspacePath $PreviewPath))
$pdfOutputPath = [System.IO.Path]::GetFullPath((Join-Path $workspacePath $PdfPath))
if (-not $previewDirectory.StartsWith($workspacePath + [System.IO.Path]::DirectorySeparatorChar)) { throw 'Preview path must be inside workspace' }
if (-not $pdfOutputPath.StartsWith($workspacePath + [System.IO.Path]::DirectorySeparatorChar)) { throw 'PDF path must be inside workspace' }
New-Item -ItemType Directory -Force -Path $previewDirectory | Out-Null
# WPS is opened with a read-only presentation and no interactive window.
# Existing WPS documents are not closed and the application is not quit.
$presentationApp = New-Object -ComObject 'kwpp.Application'
$presentation = $presentationApp.Presentations.Open($pptxPath, $true, $false, $false)
$geometryWarnings = @()
try {
  $slideCount = $presentation.Slides.Count
  for ($slideNumber = 1; $slideNumber -le $slideCount; $slideNumber++) {
    $currentSlide = $presentation.Slides.Item($slideNumber)
    $currentSlide.Export((Join-Path $previewDirectory ('slide-{0:D2}.png' -f $slideNumber)), 'PNG', 1600, 900)
    foreach ($slideShape in $currentSlide.Shapes) {
      if ($slideShape.HasTextFrame -and $slideShape.TextFrame.HasText) {
        $boundsHeight = $slideShape.TextFrame.TextRange.BoundHeight
        if ($boundsHeight -gt ($slideShape.Height + 2)) {
          $geometryWarnings += [PSCustomObject]@{slide=$slideNumber; text=$slideShape.TextFrame.TextRange.Text; height=$slideShape.Height; textHeight=$boundsHeight}
        }
      }
    }
  }
  $presentation.SaveAs($pdfOutputPath, 32)
  $report = [PSCustomObject]@{slideCount=$slideCount;renderer='WPS Presentation';pngWidth=1600;pngHeight=900;warnings=$geometryWarnings}
  $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $previewDirectory 'render-report.json') -Encoding UTF8
  Write-Output ('Rendered {0} slides and PDF. Text-height warnings: {1}' -f $slideCount,$geometryWarnings.Count)
}
finally {
  $presentation.Close()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation)
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentationApp)
}
