$ErrorActionPreference = 'Stop'

# Compute tomorrow's date (local server time)
$tomorrow = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')

# API endpoint
$apiUrl = 'http://localhost/koletrash/backend/api/generate_tasks_from_predefined.php'

# Payload: generate exactly for tomorrow (start=end)
$payload = @{ start_date = $tomorrow; end_date = $tomorrow; overwrite = $false } | ConvertTo-Json

# Prepare log directory/file
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$logDir = Join-Path $scriptDir 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir ("predefined_gen_" + (Get-Date).ToString('yyyy-MM-dd') + '.log')

function Write-Log($msg) {
  $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  "[$ts] $msg" | Tee-Object -FilePath $logFile -Append
}

try {
  Write-Log "Starting predefined schedule generation for $tomorrow"

  $response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 600

  if ($null -eq $response) { throw "Empty response from API" }

  if ($response.success -ne $true) {
    $msg = if ($response.message) { $response.message } else { 'Unknown error' }
    throw "API reported failure: $msg"
  }

  $total = $response.total_generated
  $skipped = $response.skipped_duplicates
  Write-Log "Success. Generated=$total, SkippedDuplicates=$skipped, Overwrite=$($response.overwrite)"

  if ($response.generated_tasks) {
    $summary = ($response.generated_tasks | ForEach-Object { "- $($_.date) $($_.time) [$($_.cluster_id)] $($_.barangay_name)" }) -join [Environment]::NewLine
    if ($summary) { Write-Log "Details:\n$summary" }
  }

} catch {
  Write-Log ("ERROR: " + $_.Exception.Message)
  if ($_.ErrorDetails) { Write-Log ("DETAILS: " + $_.ErrorDetails) }
  exit 1
}

exit 0

























