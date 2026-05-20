$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$PidFile = Join-Path $RootDir ".immoflow-dev.json"

$BackendHostWasSet = [Environment]::GetEnvironmentVariable("BACKEND_HOST", "Process") -ne $null
$BackendPortWasSet = [Environment]::GetEnvironmentVariable("BACKEND_PORT", "Process") -ne $null
$FrontendHostWasSet = [Environment]::GetEnvironmentVariable("FRONTEND_HOST", "Process") -ne $null
$FrontendPortWasSet = [Environment]::GetEnvironmentVariable("FRONTEND_PORT", "Process") -ne $null

$BackendHost = if ($BackendHostWasSet) { $env:BACKEND_HOST } else { "127.0.0.1" }
$BackendPort = if ($BackendPortWasSet) { [int]$env:BACKEND_PORT } else { 8001 }
$FrontendHost = if ($FrontendHostWasSet) { $env:FRONTEND_HOST } else { "127.0.0.1" }
$FrontendPort = if ($FrontendPortWasSet) { [int]$env:FRONTEND_PORT } else { 3001 }
$StartXampp = if ([Environment]::GetEnvironmentVariable("START_XAMPP", "Process") -ne $null) { $env:START_XAMPP } else { "1" }
$XamppDir = if ([Environment]::GetEnvironmentVariable("XAMPP_DIR", "Process") -ne $null) { $env:XAMPP_DIR } else { "C:\xampp" }

$StartedProcessIds = @()
$PhpPath = $null

function Get-ScriptEnv {
  param([string]$Name, [string]$Default)

  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ($null -ne $value) {
    return $value
  }

  return $Default
}

function Resolve-Tool {
  param([string]$Name, [string[]]$Candidates = @())

  $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($command) {
    return $command.Source
  }

  foreach ($candidate in $Candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Invoke-InDirectory {
  param([string]$Directory, [string]$FilePath, [string[]]$Arguments)

  Push-Location $Directory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$FilePath exited with code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Get-EnvFileValue {
  param([string]$File, [string]$Key)

  if (!(Test-Path $File)) {
    return $null
  }

  $pattern = "^" + [regex]::Escape($Key) + "=(.*)$"
  foreach ($line in Get-Content $File) {
    if ($line -match $pattern) {
      return $Matches[1]
    }
  }

  return $null
}

function Set-EnvFileValue {
  param([string]$File, [string]$Key, [string]$Value)

  if (!(Test-Path $File)) {
    New-Item -ItemType File -Path $File -Force | Out-Null
  }

  $content = Get-Content -Raw -Path $File
  if ($null -eq $content) {
    $content = ""
  }

  $line = "$Key=$Value"
  $pattern = "(?m)^" + [regex]::Escape($Key) + "=.*$"

  if ([regex]::IsMatch($content, $pattern)) {
    $content = [regex]::Replace(
      $content,
      $pattern,
      [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $line }
    )
  } else {
    if ($content.Length -gt 0 -and !$content.EndsWith("`n")) {
      $content += "`r`n"
    }
    $content += "$line`r`n"
  }

  Set-Content -Path $File -Value $content -NoNewline
}

function Resolve-BackendSetting {
  param([string]$File, [string]$Key, [string]$Default)

  $fromEnv = [Environment]::GetEnvironmentVariable($Key, "Process")
  if ($null -ne $fromEnv) {
    return $fromEnv
  }

  $current = Get-EnvFileValue $File $Key
  if ($Key -eq "DB_CONNECTION" -and $current -eq "sqlite") {
    return $Default
  }

  if ($null -ne $current) {
    if ($Key -eq "DB_PASSWORD" -or $current -ne "") {
      return $current
    }
  }

  return $Default
}

function Test-PortAvailable {
  param([string]$HostName, [int]$Port)

  try {
    $addresses = [System.Net.Dns]::GetHostAddresses($HostName)
    $address = $addresses | Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork } | Select-Object -First 1
    if (!$address) {
      $address = $addresses | Select-Object -First 1
    }

    $listener = [System.Net.Sockets.TcpListener]::new($address, $Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
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

function Select-FreePort {
  param(
    [string]$Name,
    [string]$HostName,
    [int]$Port,
    [string]$OverrideName,
    [bool]$WasSet
  )

  if (Test-PortAvailable $HostName $Port) {
    return $Port
  }

  if ($WasSet -or (Get-ScriptEnv "STRICT_PORTS" "0") -eq "1") {
    throw "$Name port $HostName`:$Port is already in use. Stop the running service or use $OverrideName=<another-port> npm run dev."
  }

  for ($candidate = $Port + 1; $candidate -le $Port + 100; $candidate++) {
    if (Test-PortAvailable $HostName $candidate) {
      Write-Host "$Name port $HostName`:$Port is already in use. Using $HostName`:$candidate instead."
      return $candidate
    }
  }

  throw "$Name port $HostName`:$Port is already in use and no free nearby port was found."
}

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

function Get-TrackedServices {
  if (!(Test-Path $PidFile)) {
    return $null
  }

  try {
    $tracked = Get-Content -Raw $PidFile | ConvertFrom-Json
    if (
      $tracked.backendPid -and
      $tracked.frontendPid -and
      (Test-ProcessRunning ([int]$tracked.backendPid)) -and
      (Test-ProcessRunning ([int]$tracked.frontendPid))
    ) {
      return $tracked
    }
  } catch {
    return $null
  }

  return $null
}

function Start-Xampp {
  if ($StartXampp -ne "1") {
    return
  }

  if ((Test-TcpListening "127.0.0.1" 80) -and (Test-TcpListening "127.0.0.1" 3306)) {
    Write-Host "XAMPP Apache and MySQL already appear to be running."
    return
  }

  $startCommand = Get-ScriptEnv "XAMPP_START_CMD" (Join-Path $XamppDir "xampp_start.exe")
  if (!(Test-Path $startCommand)) {
    Write-Host "XAMPP was not found at $startCommand. Skipping XAMPP startup."
    return
  }

  Write-Host "Starting XAMPP Apache and MySQL..."
  Start-Process -FilePath $startCommand -WorkingDirectory $XamppDir -WindowStyle Minimized | Out-Null

  if (!(Wait-ForTcp "127.0.0.1" 3306 60)) {
    throw "MySQL did not start on 127.0.0.1:3306. Open XAMPP Control Panel and start MySQL, then run npm run dev again."
  }
}

function Ensure-Backend {
  $script:PhpPath = Resolve-Tool "php.exe" @((Join-Path $XamppDir "php\php.exe"))
  if (!$script:PhpPath) {
    throw "Missing PHP. Install XAMPP or add PHP to PATH."
  }

  if (!(Test-Path (Join-Path $BackendDir "vendor"))) {
    $composer = Resolve-Tool "composer.bat"
    if (!$composer) {
      $composer = Resolve-Tool "composer"
    }
    if (!$composer) {
      throw "Missing Composer. Install Composer, then run npm run dev again."
    }

    Write-Host "Installing backend dependencies..."
    Invoke-InDirectory $BackendDir $composer @("install")
  }

  $backendEnv = Join-Path $BackendDir ".env"
  if (!(Test-Path $backendEnv)) {
    Write-Host "Creating backend/.env from backend/.env.example..."
    Copy-Item (Join-Path $BackendDir ".env.example") $backendEnv
  }

  if ([string]::IsNullOrWhiteSpace((Get-EnvFileValue $backendEnv "APP_KEY"))) {
    Write-Host "Generating Laravel application key..."
    Invoke-InDirectory $BackendDir $script:PhpPath @("artisan", "key:generate", "--ansi")
  }
}

function Ensure-Frontend {
  $npm = Resolve-Tool "npm.cmd"
  if (!$npm) {
    $npm = Resolve-Tool "npm"
  }
  if (!$npm) {
    throw "Missing npm. Install Node.js, then run npm run dev again."
  }

  if (!(Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies..."
    Invoke-InDirectory $FrontendDir $npm @("install")
  }

  $frontendEnv = Join-Path $FrontendDir ".env.local"
  if (!(Test-Path $frontendEnv)) {
    Write-Host "Creating frontend/.env.local from frontend/.env.example..."
    Copy-Item (Join-Path $FrontendDir ".env.example") $frontendEnv
  }
}

function Sync-BackendEnv {
  $backendEnv = Join-Path $BackendDir ".env"

  Set-EnvFileValue $backendEnv "APP_URL" "http://$BackendHost`:$BackendPort"
  Set-EnvFileValue $backendEnv "CORS_ALLOWED_ORIGINS" "http://localhost:3000,http://127.0.0.1:3000,http://localhost:$FrontendPort,http://$FrontendHost`:$FrontendPort"
  Set-EnvFileValue $backendEnv "SANCTUM_STATEFUL_DOMAINS" "localhost,localhost:3000,localhost:$FrontendPort,localhost:$BackendPort,127.0.0.1,127.0.0.1:3000,$FrontendHost`:$FrontendPort,$BackendHost`:$BackendPort,::1"

  Set-EnvFileValue $backendEnv "DB_CONNECTION" (Resolve-BackendSetting $backendEnv "DB_CONNECTION" "mysql")
  Set-EnvFileValue $backendEnv "DB_HOST" (Resolve-BackendSetting $backendEnv "DB_HOST" "127.0.0.1")
  Set-EnvFileValue $backendEnv "DB_PORT" (Resolve-BackendSetting $backendEnv "DB_PORT" "3306")
  Set-EnvFileValue $backendEnv "DB_DATABASE" (Resolve-BackendSetting $backendEnv "DB_DATABASE" "immoflow")
  Set-EnvFileValue $backendEnv "DB_USERNAME" (Resolve-BackendSetting $backendEnv "DB_USERNAME" "root")
  Set-EnvFileValue $backendEnv "DB_PASSWORD" (Resolve-BackendSetting $backendEnv "DB_PASSWORD" "")
}

function Sync-FrontendEnv {
  $frontendEnv = Join-Path $FrontendDir ".env.local"

  Set-EnvFileValue $frontendEnv "NEXT_PUBLIC_API_BASE_URL" "http://$BackendHost`:$BackendPort"
  Set-EnvFileValue $frontendEnv "NEXTAUTH_URL" "http://$FrontendHost`:$FrontendPort"
}

function With-TemporaryEnv {
  param([hashtable]$Values, [scriptblock]$Body)

  $oldValues = @{}
  foreach ($key in $Values.Keys) {
    $oldValues[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
    [Environment]::SetEnvironmentVariable($key, [string]$Values[$key], "Process")
  }

  try {
    & $Body
  } finally {
    foreach ($key in $Values.Keys) {
      [Environment]::SetEnvironmentVariable($key, $oldValues[$key], "Process")
    }
  }
}

function Prepare-Database {
  if ((Get-ScriptEnv "PREPARE_DATABASE" "1") -ne "1") {
    return
  }

  $backendEnv = Join-Path $BackendDir ".env"
  $dbConnection = Get-EnvFileValue $backendEnv "DB_CONNECTION"
  if ($dbConnection -ne "mysql") {
    return
  }

  $dbSettings = @{
    DB_HOST = Get-EnvFileValue $backendEnv "DB_HOST"
    DB_PORT = Get-EnvFileValue $backendEnv "DB_PORT"
    DB_DATABASE = Get-EnvFileValue $backendEnv "DB_DATABASE"
    DB_USERNAME = Get-EnvFileValue $backendEnv "DB_USERNAME"
    DB_PASSWORD = Get-EnvFileValue $backendEnv "DB_PASSWORD"
  }

  $createDatabaseCode = @'
$host = getenv("DB_HOST") ?: "127.0.0.1";
$port = getenv("DB_PORT") ?: "3306";
$database = getenv("DB_DATABASE") ?: "immoflow";
$username = getenv("DB_USERNAME") ?: "root";
$password = getenv("DB_PASSWORD");

try {
    $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $quotedDatabase = str_replace("`", "``", $database);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$quotedDatabase}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch (Throwable $e) {
    fwrite(STDERR, "Could not prepare MySQL database: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
'@

  Write-Host "Preparing MySQL database..."
  With-TemporaryEnv $dbSettings {
    & $script:PhpPath -r $createDatabaseCode
    if ($LASTEXITCODE -ne 0) {
      throw "Could not prepare MySQL database."
    }
  }

  if ((Get-ScriptEnv "RUN_MIGRATIONS" "1") -eq "1") {
    Write-Host "Running Laravel migrations..."
    Invoke-InDirectory $BackendDir $script:PhpPath @("artisan", "migrate", "--force")
  }
}

function Start-ServiceProcess {
  param([string]$Name, [string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory)

  Write-Host "Starting $Name..."
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -PassThru -NoNewWindow
  $script:StartedProcessIds += $process.Id
  return $process
}

function Cleanup-StartedProcesses {
  if ($StartedProcessIds.Count -gt 0) {
    Write-Host ""
    Write-Host "Stopping ImmoFlow services..."
    foreach ($processId in $StartedProcessIds) {
      Stop-ProcessTree ([int]$processId)
    }
  }

  if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
}

$tracked = Get-TrackedServices
if ($tracked) {
  $BackendPort = [int]$tracked.backendPort
  $FrontendPort = [int]$tracked.frontendPort
  Sync-BackendEnv
  Sync-FrontendEnv

  Write-Host ""
  Write-Host "ImmoFlow is already running:"
  Write-Host "  Backend:  http://$BackendHost`:$BackendPort"
  Write-Host "  Frontend: http://$FrontendHost`:$FrontendPort"
  Write-Host ""
  exit 0
}

Start-Xampp
Ensure-Backend
Ensure-Frontend

$BackendPort = Select-FreePort "Backend" $BackendHost $BackendPort "BACKEND_PORT" $BackendPortWasSet
$FrontendPort = Select-FreePort "Frontend" $FrontendHost $FrontendPort "FRONTEND_PORT" $FrontendPortWasSet

Sync-BackendEnv
Sync-FrontendEnv
Invoke-InDirectory $BackendDir $script:PhpPath @("artisan", "config:clear")
Prepare-Database

Write-Host ""
Write-Host "ImmoFlow is starting:"
Write-Host "  Backend:  http://$BackendHost`:$BackendPort"
Write-Host "  Frontend: http://$FrontendHost`:$FrontendPort"
Write-Host ""
Write-Host "  phpMyAdmin: http://127.0.0.1/phpmyadmin/"
Write-Host ""

$npmPath = Resolve-Tool "npm.cmd"
if (!$npmPath) {
  $npmPath = Resolve-Tool "npm"
}
$backendProcess = $null
$frontendProcess = $null

try {
  $backendProcess = Start-ServiceProcess "Laravel API" $script:PhpPath @("artisan", "serve", "--host=$BackendHost", "--port=$BackendPort") $BackendDir

  With-TemporaryEnv @{
    NEXT_PUBLIC_API_BASE_URL = "http://$BackendHost`:$BackendPort"
    NEXTAUTH_URL = "http://$FrontendHost`:$FrontendPort"
  } {
    $script:frontendProcess = Start-ServiceProcess "Next.js frontend" $npmPath @("run", "dev", "--", "--hostname", $FrontendHost, "--port", [string]$FrontendPort) $FrontendDir
  }

  @{
    backendPid = $backendProcess.Id
    frontendPid = $script:frontendProcess.Id
    backendPort = $BackendPort
    frontendPort = $FrontendPort
    startedAt = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content -Path $PidFile

  while (
    (Test-ProcessRunning $backendProcess.Id) -and
    (Test-ProcessRunning $script:frontendProcess.Id)
  ) {
    Start-Sleep -Seconds 1
  }
} finally {
  Cleanup-StartedProcesses
}
