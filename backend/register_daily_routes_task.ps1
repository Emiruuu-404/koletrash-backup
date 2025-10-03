$ErrorActionPreference = 'Stop'

$taskName = 'Koletrash-NextDayPredefined'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$psPath = Join-Path $scriptDir 'run_generate_predefined_nextday.ps1'

if (!(Test-Path $psPath)) {
  throw "Script not found: $psPath"
}

# Use powershell to run the script
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$psPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 00:05
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Generates next-day tasks from predefined schedules and logs output.' | Out-Null
Write-Output "Registered scheduled task '$taskName' to run at 00:05 daily."

