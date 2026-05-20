param(
  [ValidateSet("start", "stop", "status")]
  [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

$XamppDir = if ([Environment]::GetEnvironmentVariable("XAMPP_DIR", "Process") -ne $null) { $env:XAMPP_DIR } else { "C:\xampp" }

function Get-ScriptEnv {
  param([string]$Name, [string]$Default)

  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ($null -ne $value) {
    return $value
  }

  return $Default
}

function Test-TcpListening {
  param([string]$HostName, [int]$Port)

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    if (!$async.AsyncWaitHandle.WaitOne(500, $false)) {
      return $false
    }

    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-ForTcp {
  param([string]$HostName, [int]$Port, [int]$TimeoutSeconds = 45)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-TcpListening $HostName $Port) {
      return $true
    }
    Start-Sleep -Seconds 1
  }

  return $false
}

function Show-Status {
  $apache = if (Test-TcpListening "127.0.0.1" 80) { "running" } else { "stopped" }
  $mysql = if (Test-TcpListening "127.0.0.1" 3306) { "running" } else { "stopped" }

  Write-Host "XAMPP directory: $XamppDir"
  Write-Host "Apache: $apache"
  Write-Host "MySQL:  $mysql"
}

function Start-Xampp {
  if ((Test-TcpListening "127.0.0.1" 80) -and (Test-TcpListening "127.0.0.1" 3306)) {
    Write-Host "XAMPP Apache and MySQL already appear to be running."
    return
  }

  $startCommand = Get-ScriptEnv "XAMPP_START_CMD" (Join-Path $XamppDir "xampp_start.exe")
  if (!(Test-Path $startCommand)) {
    throw "XAMPP was not found at $startCommand. Set XAMPP_DIR if XAMPP is installed somewhere else."
  }

  Write-Host "Starting XAMPP Apache and MySQL..."
  Start-Process -FilePath $startCommand -WorkingDirectory $XamppDir -WindowStyle Minimized | Out-Null

  if (!(Wait-ForTcp "127.0.0.1" 3306 60)) {
    throw "MySQL did not start on 127.0.0.1:3306. Open XAMPP Control Panel and start MySQL manually."
  }

  Show-Status
}

function Stop-Xampp {
  $stopCommand = Get-ScriptEnv "XAMPP_STOP_CMD" (Join-Path $XamppDir "xampp_stop.exe")
  if (!(Test-Path $stopCommand)) {
    throw "XAMPP was not found at $stopCommand. Set XAMPP_DIR if XAMPP is installed somewhere else."
  }

  Write-Host "Stopping XAMPP..."
  Start-Process -FilePath $stopCommand -WorkingDirectory $XamppDir -Wait | Out-Null
  Show-Status
}

switch ($Action) {
  "start" { Start-Xampp }
  "stop" { Stop-Xampp }
  "status" { Show-Status }
}
