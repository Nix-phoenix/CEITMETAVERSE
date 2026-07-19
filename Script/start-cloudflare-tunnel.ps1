# Starts (or reuses) a Cloudflare quick tunnel for the local backend (localhost:5000)
# running inside WSL, then updates the api-base meta tag in every WebPage/*.html
# file so the frontend knows where to reach the backend.

param(
    [string]$WslDistro = "Debian",
    [string]$LogPath = "/tmp/cloudflared.log"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Get-TunnelUrl {
    $log = wsl -d $WslDistro -e bash -lc "cat $LogPath 2>/dev/null"
    if ($log -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        return $Matches[0]
    }
    return $null
}

Write-Host "Checking for an existing cloudflared tunnel..."
$running = wsl -d $WslDistro -e bash -lc "pgrep -f 'cloudflared tunnel --url' >/dev/null 2>&1 && echo yes || echo no"

if ($running.Trim() -ne "yes") {
    Write-Host "Starting a new cloudflared quick tunnel (localhost:5000)..."
    wsl -d $WslDistro -e bash -lc "nohup cloudflared tunnel --url http://localhost:5000 --loglevel info > $LogPath 2>&1 < /dev/null & disown"

    $tunnelUrl = $null
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        $tunnelUrl = Get-TunnelUrl
        if ($tunnelUrl) { break }
    }
} else {
    Write-Host "cloudflared is already running, reusing existing tunnel."
    $tunnelUrl = Get-TunnelUrl
}

if (-not $tunnelUrl) {
    Write-Error "Could not determine the tunnel URL. Check $LogPath inside WSL ($WslDistro) for details."
    exit 1
}

Write-Host "Tunnel URL: $tunnelUrl"

$webPageDir = Join-Path $repoRoot "WebPage"
Get-ChildItem -Path $webPageDir -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match '<meta name="api-base" content="[^"]*">') {
        $updated = $content -replace '<meta name="api-base" content="[^"]*">', "<meta name=""api-base"" content=""$tunnelUrl"">"
    } else {
        $updated = $content -replace '(<meta charset="UTF-8"\s*/?>)', "`$1`n    <meta name=""api-base"" content=""$tunnelUrl"">"
    }
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($_.FullName, $updated)
        Write-Host "Updated api-base in $($_.Name)"
    }
}

Write-Host ""
Write-Host "Done. Backend is reachable at: $tunnelUrl"
Write-Host "If you want the deployed Cloudflare Pages site to use this URL too,"
Write-Host "commit and push the WebPage/*.html changes."
