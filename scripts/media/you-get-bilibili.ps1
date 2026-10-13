<#
Examples (run from the project directory):
  .\scripts\media\you-get-bilibili.ps1 -Url 'https://www.bilibili.com/video/BV.../'
  .\scripts\media\you-get-bilibili.ps1 -Url 'https://www.bilibili.com/video/BV.../?p=2' -InfoOnly
  .\scripts\media\you-get-bilibili.ps1 -Url 'https://www.bilibili.com/video/BV.../' -OutputDir 'D:\Videos' -Cookies 'D:\cookies.txt'
Install you-get first: py -m pip install --upgrade you-get
FFmpeg must be installed and available on PATH for merging audio/video.
Official documentation: https://github.com/soimort/you-get
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [string]$OutputDir = (Join-Path $PSScriptRoot '..\..\assets\videos\bilibili\downloads'),
    [string]$Cookies,
    [string]$Format,
    [switch]$InfoOnly,
    [switch]$Playlist
)

$ErrorActionPreference = 'Stop'

try {
    $videoUri = $null
    if (-not [Uri]::TryCreate($Url, [UriKind]::Absolute, [ref]$videoUri) -or
        $videoUri.Scheme -notin @('http', 'https') -or
        ($videoUri.Host -ne 'b23.tv' -and $videoUri.Host -ne 'bilibili.com' -and
         -not $videoUri.Host.EndsWith('.bilibili.com'))) {
        throw 'Provide a valid Bilibili or b23.tv video URL.'
    }

    $downloader = Get-Command you-get -CommandType Application -ErrorAction SilentlyContinue
    if (-not $downloader) {
        throw 'you-get was not found on PATH. Run: py -m pip install --upgrade you-get; then add the Python Scripts directory to PATH.'
    }
    if (-not $InfoOnly -and -not (Get-Command ffmpeg -CommandType Application -ErrorAction SilentlyContinue)) {
        throw 'FFmpeg was not found on PATH. Install FFmpeg and reopen PowerShell before downloading.'
    }

    $downloadArgs = @('--output-dir', $OutputDir)
    if ($Cookies) {
        if (-not (Test-Path -LiteralPath $Cookies -PathType Leaf)) {
            throw "Cookies file does not exist: $Cookies"
        }
        $downloadArgs += @('--cookies', (Resolve-Path -LiteralPath $Cookies).Path)
    }
    if ($Format) { $downloadArgs += @('--format', $Format) }
    if ($InfoOnly) { $downloadArgs += '--info' }
    if ($Playlist) { $downloadArgs += '--playlist' }
    $downloadArgs += $Url

    # Array arguments preserve spaces and URL query strings without shell evaluation.
    # No --force: retain you-get's default resume/skip behavior.
    & $downloader.Source @downloadArgs
    $downloadExitCode = $LASTEXITCODE
    if ($downloadExitCode -ne 0) {
        Write-Warning 'you-get failed. Review its output; try updating you-get or supplying your cookies file if login is required.'
    }
    exit $downloadExitCode
}
catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
