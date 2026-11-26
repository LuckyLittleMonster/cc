<#
.SYNOPSIS
  Connect this machine to the agentbus server on the LAN and keep it connected across logons.
.DESCRIPTION
  Finds the server by UDP broadcast (the server must prove it holds the token), saves the
  URL to ~/.agentbus.json, and registers a logon task that re-discovers the server, so a
  changed server IP heals itself. No admin rights needed.
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Token <token printed by setup-server.ps1>
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Uninstall
#>
param(
  [string]$Token,
  [int]$Port = 7788,
  [int]$WaitSec = 30,
  [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
$TaskName = 'agentbus-client'
$Js = Join-Path $PSScriptRoot 'agentbus.js'
$Config = Join-Path $HOME '.agentbus.json'
$Log = Join-Path $HOME '.agentbus-client.log'
$LogonWaitSec = 300

if ($Uninstall) {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }
  Write-Host "Removed task $TaskName. $Config was kept."
  return
}

$node = (Get-Command node -ErrorAction Stop).Source
$major = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($major -lt 18) { throw "Node 18+ is required, found $(& $node --version)." }

if (-not $Token -and (Test-Path $Config)) { $Token = (Get-Content $Config -Raw | ConvertFrom-Json).token }
if (-not $Token) {
  throw 'Pass -Token. setup-server.ps1 prints it on the server machine; it is also in ~/.agentbus.json there.'
}

Write-Host "Looking for the agentbus server on the LAN (up to $WaitSec s)..."
& $node $Js discover --token $Token --port $Port --wait $WaitSec --config $Config
if ($LASTEXITCODE -ne 0) { throw 'Discovery failed; see the message above.' }

$user = "$env:USERDOMAIN\$env:USERNAME"
$taskArgs = "--headless `"$node`" `"$Js`" discover --port $Port --wait $LogonWaitSec --config `"$Config`" --log `"$Log`""
$action = New-ScheduledTaskAction -Execute (Join-Path $env:WINDIR 'System32\conhost.exe') -Argument $taskArgs
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
  -Settings $settings -Description 'agentbus client: re-discover the LAN bus at logon' -Force | Out-Null

& $node $Js agents --config $Config
if ($LASTEXITCODE -ne 0) { throw 'Found the server but could not talk to it; check the server firewall (TCP).' }
Write-Host ''
Write-Host "Connected. Logon task '$TaskName' re-discovers the server at every logon (log: $Log)."
Write-Host 'Agents on this machine can now use the agentbus skill.'
