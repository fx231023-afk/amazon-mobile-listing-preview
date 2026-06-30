$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$toolsDir = Join-Path $projectRoot ".tools"
$cloudflaredPath = Join-Path $toolsDir "cloudflared.exe"
$stdoutLogPath = Join-Path $projectRoot "public-preview.out.log"
$stderrLogPath = Join-Path $projectRoot "public-preview.err.log"
$urlPath = Join-Path $projectRoot "PUBLIC_URL.txt"
$localUrl = "http://127.0.0.1:5173"

New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

if (!(Test-Path $cloudflaredPath)) {
  Write-Host "Downloading Cloudflare Tunnel helper..."
  $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $cloudflaredPath
}

function Test-LocalApp {
  try {
    $response = Invoke-WebRequest -Uri $localUrl -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (!(Test-LocalApp)) {
  Write-Host "Starting local preview app..."
  $viteScript = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
  $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue

  if (!$nodeCommand) {
    throw "Node.js is not available. Install Node.js first, then run npm install and retry."
  }

  if (!(Test-Path $viteScript)) {
    throw "Dependencies are missing. Run npm install in $projectRoot first, then retry."
  }

  Start-Process -FilePath $nodeCommand.Source -ArgumentList @($viteScript, "--host", "127.0.0.1", "--port", "5173") -WorkingDirectory $projectRoot -WindowStyle Hidden | Out-Null

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-LocalApp) {
      $ready = $true
      break
    }
  }

  if (!$ready) {
    throw "Local app did not start at $localUrl. Run npm install first, then retry."
  }
}

if (Test-Path $stdoutLogPath) {
  Remove-Item $stdoutLogPath -Force
}
if (Test-Path $stderrLogPath) {
  Remove-Item $stderrLogPath -Force
}
if (Test-Path $urlPath) {
  Remove-Item $urlPath -Force
}

Write-Host "Starting public temporary tunnel..."
$process = Start-Process -FilePath $cloudflaredPath -ArgumentList @("tunnel", "--url", $localUrl) -WorkingDirectory $projectRoot -RedirectStandardOutput $stdoutLogPath -RedirectStandardError $stderrLogPath -WindowStyle Hidden -PassThru

$publicUrl = $null
for ($i = 0; $i -lt 45; $i++) {
  Start-Sleep -Seconds 1
  $log = ""
  if (Test-Path $stdoutLogPath) {
    $log += Get-Content -Raw $stdoutLogPath
  }
  if (Test-Path $stderrLogPath) {
    $log += Get-Content -Raw $stderrLogPath
  }
  if ($log) {
    $match = [regex]::Match($log, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    if ($match.Success) {
      $publicUrl = $match.Value
      break
    }
  }
}

if (!$publicUrl) {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  throw "Could not create public tunnel. Check $stdoutLogPath and $stderrLogPath for details."
}

Set-Content -Path $urlPath -Value $publicUrl -Encoding UTF8

Write-Host ""
Write-Host "Public editor URL:"
Write-Host $publicUrl
Write-Host ""
Write-Host "The URL was also saved to:"
Write-Host $urlPath
Write-Host ""
Write-Host "Open this URL, upload images, then click 'Generate 24-hour share link'."
Write-Host "Keep this PowerShell window and this computer running while sharing."
Write-Host ""
Write-Host "Press Ctrl+C to stop the public tunnel."

try {
  Wait-Process -Id $process.Id
} finally {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
}
