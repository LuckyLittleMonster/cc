<#
.SYNOPSIS
  Make this machine the agentbus server: token, firewall, logon task, start now.
.DESCRIPTION
  Run once in an elevated PowerShell (the firewall needs admin). Re-running is safe and
  keeps the existing token, so clients stay valid.
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-server.ps1"
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-server.ps1" -Uninstall
#>
param(
  [int]$Port = 7788,
  [string]$DataDir = (Join-Path $HOME '.agentbus-data'),
  [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
$TaskName = 'agentbus-server'
$RulePrefix = 'agentbus'
$Js = Join-Path $PSScriptRoot 'agentbus.js'
$Config = Join-Path $HOME '.agentbus.json'
$Log = Join-Path $DataDir 'server.log'

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-BusServer {
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like '*agentbus.js*serve*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}

if (-not (Test-Admin)) {
  throw 'Run this in an elevated PowerShell (Run as administrator); the firewall rules need it.'
}

if ($Uninstall) {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }
  Get-NetFirewallRule -DisplayName "$RulePrefix *" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  Stop-BusServer
  Write-Host "Removed task $TaskName and firewall rules. Data in $DataDir and $Config were kept."
  return
}

$node = (Get-Command node -ErrorAction Stop).Source
$major = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($major -lt 18) { throw "Node 18+ is required, found $(& $node --version)." }
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

$existing = if (Test-Path $Config) { Get-Content $Config -Raw | ConvertFrom-Json } else { $null }
$token = if ($existing -and $existing.token) { $existing.token } else { (& $node $Js token).Trim() }
& $node $Js init --url "http://127.0.0.1:$Port" --token $token --config $Config | Out-Null

# A Block rule for node.exe (left by a cancelled Windows prompt) beats any Allow rule.
$blocking = Get-NetFirewallApplicationFilter -Program $node -ErrorAction SilentlyContinue |
  Get-NetFirewallRule | Where-Object { $_.Direction -eq 'Inbound' -and $_.Action -eq 'Block' -and $_.Enabled -eq 'True' }
if ($blocking) {
  Write-Warning ("Inbound Block rules exist for node.exe and will stop LAN clients: " +
    ($blocking.DisplayName -join ', ') + ". Remove them in 'Windows Defender Firewall with Advanced Security'.")
}

# LocalSubnet instead of the Private profile: home Wi-Fi is often classified Public.
Get-NetFirewallRule -DisplayName "$RulePrefix *" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
foreach ($proto in 'TCP', 'UDP') {
  New-NetFirewallRule -DisplayName "$RulePrefix $proto $Port" -Direction Inbound -Protocol $proto `
    -LocalPort $Port -RemoteAddress LocalSubnet -Program $node -Action Allow | Out-Null
}

$user = "$env:USERDOMAIN\$env:USERNAME"
$taskArgs = "--headless `"$node`" `"$Js`" serve --port $Port --data `"$DataDir`" --config `"$Config`" --log `"$Log`""
$action = New-ScheduledTaskAction -Execute (Join-Path $env:WINDIR 'System32\conhost.exe') -Argument $taskArgs
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
  -Settings $settings -Description 'agentbus server (LAN message bus for agents)' -Force | Out-Null

Stop-BusServer
Start-ScheduledTask -TaskName $TaskName

$healthy = $false
foreach ($i in 1..20) {
  Start-Sleep -Milliseconds 500
  try { $healthy = (Invoke-RestMethod "http://127.0.0.1:$Port/health" -TimeoutSec 2).ok } catch { }
  if ($healthy) { break }
}
if (-not $healthy) { throw "Server did not come up on port $Port. See $Log" }

$probe = Join-Path ([IO.Path]::GetTempPath()) "agentbus-probe-$PID.json"
& $node $Js discover --token $token --port $Port --config $probe | Out-Null
$discovered = $LASTEXITCODE -eq 0
Remove-Item $probe -ErrorAction SilentlyContinue
if (-not $discovered) { Write-Warning "HTTP is up but UDP discovery did not answer. See $Log" }

$ips = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' }).IPAddress
Write-Host ''
Write-Host "agentbus server is running and will start at every logon of $user."
Write-Host "  LAN addresses : $($ips -join ', ')  (port $Port, TCP + UDP)"
Write-Host "  log           : $Log"
Write-Host "  token         : $token"
Write-Host ''
Write-Host 'On every other machine, have its agent run:'
Write-Host "  cd ~/git/cc; git pull; 'y' | node scripts/install/install.js --layers user"
Write-Host "  & `"`$HOME/.claude/scripts/agentbus/setup-client.ps1`" -Token $token"
