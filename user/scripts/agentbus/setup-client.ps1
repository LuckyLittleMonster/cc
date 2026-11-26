<#
.SYNOPSIS
  Connect this machine to the agentbus server on the LAN, make sessions listen, and run a worker.
.DESCRIPTION
  1. Finds the server by UDP broadcast (the server must prove it holds the token) and saves
     the URL to ~/.agentbus.json; a logon task re-discovers it so a changed server IP heals itself.
  2. Adds a SessionStart hook to ~/.claude/settings.json that tells every Claude Code session
     to listen for mail with Monitor (skip with -NoSessionHook).
  3. With -WorkerDirs, registers a logon task that runs any task no session picked up within
     30 s with `claude -p` in bypassPermissions mode, in the dir the task was addressed to.
  No admin rights needed. Re-running is safe.
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Token <token> -WorkerDirs "$HOME/git/r2agi"
.EXAMPLE
  & "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Uninstall
#>
param(
  [string]$Token,
  [string[]]$WorkerDirs = @(),
  [int]$Port = 7788,
  [int]$WaitSec = 30,
  [switch]$NoSessionHook,
  [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
$ClientTask = 'agentbus-client'
$WorkerTask = 'agentbus-worker'
$Js = Join-Path $PSScriptRoot 'agentbus.js'
$Config = Join-Path $HOME '.agentbus.json'
$ClientLog = Join-Path $HOME '.agentbus-client.log'
$WorkerLog = Join-Path $HOME '.agentbus-worker.log'
$LogonWaitSec = 300
$Conhost = Join-Path $env:WINDIR 'System32\conhost.exe'
$User = "$env:USERDOMAIN\$env:USERNAME"

function Remove-Task($name) {
  if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false
  }
}

function Stop-BusWorker {
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like '*agentbus.js*worker*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}

function Register-LogonTask($name, $nodeArgs, $description, $limit) {
  $action = New-ScheduledTaskAction -Execute $Conhost -Argument "--headless $nodeArgs"
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $User
  $principal = New-ScheduledTaskPrincipal -UserId $User -LogonType Interactive -RunLevel Limited
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit $limit
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Description $description -Force | Out-Null
}

$node = (Get-Command node -ErrorAction Stop).Source

if ($Uninstall) {
  Remove-Task $ClientTask
  Remove-Task $WorkerTask
  Stop-BusWorker
  & $node $Js install-hook --remove | Out-Null
  Write-Host "Removed tasks $ClientTask, $WorkerTask and the SessionStart hook. $Config was kept."
  return
}

$major = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($major -lt 18) { throw "Node 18+ is required, found $(& $node --version)." }

if (-not $Token -and (Test-Path $Config)) { $Token = (Get-Content $Config -Raw | ConvertFrom-Json).token }
if (-not $Token) {
  throw 'Pass -Token. setup-server.ps1 prints it on the server machine; it is also in ~/.agentbus.json there.'
}

Write-Host "Looking for the agentbus server on the LAN (up to $WaitSec s)..."
& $node $Js discover --token $Token --port $Port --wait $WaitSec --config $Config
if ($LASTEXITCODE -ne 0) { throw 'Discovery failed; see the message above.' }

Register-LogonTask $ClientTask "`"$node`" `"$Js`" discover --port $Port --wait $LogonWaitSec --config `"$Config`" --log `"$ClientLog`"" `
  'agentbus client: re-discover the LAN bus at logon' (New-TimeSpan -Minutes 10)

if (-not $NoSessionHook) {
  & $node $Js install-hook
  if ($LASTEXITCODE -ne 0) { throw 'Could not add the SessionStart hook; see the message above.' }
}

Stop-BusWorker
if ($WorkerDirs.Count -gt 0) {
  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) { throw 'The worker needs the claude CLI on PATH.' }
  $dirArgs = foreach ($d in $WorkerDirs) {
    if (-not (Test-Path $d -PathType Container)) { throw "Worker dir does not exist: $d" }
    "--dir `"$((Resolve-Path $d).Path)`""
  }
  Register-LogonTask $WorkerTask "`"$node`" `"$Js`" worker $($dirArgs -join ' ') --claude `"$claude`" --config `"$Config`" --log `"$WorkerLog`"" `
    'agentbus worker: run unclaimed bus tasks with claude -p' ([TimeSpan]::Zero)
  Start-ScheduledTask -TaskName $WorkerTask
} else {
  Remove-Task $WorkerTask
}

& $node $Js agents --config $Config
if ($LASTEXITCODE -ne 0) { throw 'Found the server but could not talk to it; check the server firewall (TCP).' }
Write-Host ''
Write-Host "Connected. '$ClientTask' re-discovers the server at every logon (log: $ClientLog)."
if (-not $NoSessionHook) { Write-Host 'New Claude Code sessions will listen for mail (restart open sessions to pick it up).' }
if ($WorkerDirs.Count -gt 0) {
  Write-Host "Worker '$WorkerTask' runs unclaimed tasks for: $($WorkerDirs -join ', ') (log: $WorkerLog)."
} else {
  Write-Host 'No worker: tasks wait in the inbox until a session reads them. Add one with -WorkerDirs <dir>.'
}
