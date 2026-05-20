$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $RootDir ".immoflow-dev.json"
$StopXampp = if ([Environment]::GetEnvironmentVariable("STOP_XAMPP", "Process") -ne $null) { $env:STOP_XAMPP } else { "0" }
$XamppDir = if ([Environment]::GetEnvironmentVariable("XAMPP_DIR", "Process") -ne $null) { $env:XAMPP_DIR } else { "C:\xampp" }

function Test-ProcessRunning {
  param([int]$ProcessId)

  try {
    Get-Process -Id $ProcessId -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Stop-ProcessTree {
  param([int]$RootProcessId)

  $children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$RootProcessId" -ErrorAction SilentlyContinue)
  foreach ($child in $children) {
    Stop-ProcessTree ([int]$child.ProcessId)
  }

  if (Test-ProcessRunning $RootProcessId) {
    Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Stop-TrackedServices {
  if (!(Test-Path $PidFile)) {
    Write-Host "No tracked ImmoFlow app services were found."
    return
  }

  try {
    $tracked = Get-Content -Raw $PidFile | ConvertFrom-Json
  } catch {
    Write-Host "Could not read $PidFile. Remove it manually if it is stale."
    return
  }

  $processIds = @()
  if ($tracked.backendPid) {
    $processIds += [int]$tracked.backendPid
  }
  if ($tracked.frontendPid) {
    $processIds += [int]$tracked.frontendPid
  }

  if ($processIds.Count -eq 0) {
    Write-Host "No tracked ImmoFlow app services were found."
  } else {
    Write-Host "Stopping ImmoFlow app services: $($processIds -join ', ')"
    foreach ($processId in $processIds) {
      Stop-ProcessTree $processId
    }
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

function Stop-Xampp {
  if ($StopXampp -ne "1") {
    return
  }

  $stopCommand = if ([Environment]::GetEnvironmentVariable("XAMPP_STOP_CMD", "Process") -ne $null) {
    $env:XAMPP_STOP_CMD
  } else {
    Join-Path $XamppDir "xampp_stop.exe"
  }

  if (!(Test-Path $stopCommand)) {
    Write-Host "XAMPP was not found at $stopCommand. Skipping XAMPP stop."
    return
  }

  Write-Host "Stopping XAMPP..."
  Start-Process -FilePath $stopCommand -WorkingDirectory $XamppDir -Wait | Out-Null
}

Stop-TrackedServices
Stop-Xampp
