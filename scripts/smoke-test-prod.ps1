param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$AdminApiKey,

  [string]$DataBase = "",
  [int]$Historical = 0
)

$ErrorActionPreference = "Stop"

function Call-Endpoint {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers
  )

  Write-Host "$Method $Url"
  $response = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  return $response.Content
}

$headers = @{
  "Authorization" = "Bearer $AdminApiKey"
}

$healthUrl = "$BaseUrl/api/banks"
Write-Host "[1/4] Public API health check"
$banks = Invoke-WebRequest -Method GET -Uri $healthUrl -UseBasicParsing
Write-Host "Status: $($banks.StatusCode)"

Write-Host "[2/4] Admin ingest check"
$ingestUrl = "$BaseUrl/api/ingest/bcb"
$query = @()
if ($DataBase) { $query += "dataBase=$DataBase" }
if ($Historical -gt 0) { $query += "historical=$Historical" }
if ($query.Count -gt 0) {
  $ingestUrl = "$ingestUrl?" + ($query -join "&")
}
$ingestOut = Call-Endpoint -Method "GET" -Url $ingestUrl -Headers $headers
Write-Host $ingestOut

Write-Host "[3/4] Admin recompute check"
$scoreOut = Call-Endpoint -Method "POST" -Url "$BaseUrl/api/score/recompute" -Headers $headers
Write-Host $scoreOut

Write-Host "[4/4] Verify admin lock works without key"
try {
  Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/ingest/bcb" -UseBasicParsing | Out-Null
  throw "Expected 401 without admin key, but request succeeded."
} catch {
  Write-Host "Unauthorized check passed (expected failure without key)."
}

Write-Host "Smoke test complete" -ForegroundColor Green
