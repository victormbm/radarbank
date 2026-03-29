param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$AppUrl,

  [string]$Region = "southamerica-east1",
  [string]$Repo = "radar-bank",
  [string]$Service = "radar-bank",
  [string]$CronJobName = "radar-bank-ingest-6h",

  # Optional in args. If omitted, script reads from env vars with same names.
  [string]$DatabaseUrl,
  [string]$JwtSecret,
  [string]$AdminApiKey,
  [string]$CronSecret,
  [string]$UpstashUrl,
  [string]$UpstashToken
)

$ErrorActionPreference = "Stop"
# Avoid terminating on non-zero exits from native commands like gcloud describe.
$PSNativeCommandUseErrorActionPreference = $false

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Command '$Name' not found. Install it and run again."
  }
}

function Ensure-ActiveGcloudAuth {
  $active = gcloud auth list --filter=status:ACTIVE --format="value(account)"
  if (-not $active) {
    throw "No active gcloud account. Run: gcloud auth login"
  }
}

function Ensure-ApiEnabled {
  param([string]$Api)
  $enabled = gcloud services list --enabled --format="value(config.name)" | Select-String -Pattern "^$Api$"
  if (-not $enabled) {
    Write-Host "[GCP] Enabling API: $Api"
    gcloud services enable $Api --project=$ProjectId | Out-Null
  }
}

function Ensure-ArtifactRepo {
  $existingRepos = gcloud artifacts repositories list --location=$Region --project=$ProjectId --format="value(name)"
  $repoExists = $existingRepos | Where-Object { $_ -match "(^|/)$Repo$" }
  if (-not $repoExists) {
    Write-Host "[GCP] Creating Artifact Registry repo '$Repo'"
    gcloud artifacts repositories create $Repo `
      --repository-format=docker `
      --location=$Region `
      --description="Radar Bank Docker images" `
      --project=$ProjectId | Out-Null
  }
}

function Ensure-Secret {
  param([string]$Name)
  $existingSecrets = gcloud secrets list --project=$ProjectId --format="value(name)"
  $secretExists = $existingSecrets | Where-Object { $_ -match "(^|/)$Name$" }
  if (-not $secretExists) {
    Write-Host "[GCP] Creating secret: $Name"
    gcloud secrets create $Name --replication-policy=automatic --project=$ProjectId | Out-Null
  }
}

function Add-SecretVersion {
  param(
    [string]$Name,
    [string]$Value
  )
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return
  }

  $tmpFile = New-TemporaryFile
  try {
    Set-Content -Path $tmpFile -Value $Value -NoNewline
    gcloud secrets versions add $Name --data-file=$tmpFile --project=$ProjectId | Out-Null
    Write-Host "[GCP] Added new version to secret: $Name"
  } finally {
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
  }
}

function Get-SecretLatestValue {
  param([string]$Name)

  try {
    $value = gcloud secrets versions access latest --secret=$Name --project=$ProjectId 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }
  } catch {
    return $null
  }

  return $null
}

function Upsert-SchedulerJob {
  param(
    [string]$JobName,
    [string]$TargetUrl,
    [string]$Secret
  )

  if ([string]::IsNullOrWhiteSpace($Secret)) {
    Write-Host "[WARN] CRON secret empty. Skipping Cloud Scheduler setup."
    return
  }

  $schedule = "0 */6 * * *"
  $headers = "Authorization=Bearer $Secret"
  $timeZone = "America/Sao_Paulo"

  $existingJobs = gcloud scheduler jobs list --location=$Region --project=$ProjectId --format="value(name)"
  $jobExists = $existingJobs | Where-Object { $_ -match "(^|/)$JobName$" }
  if ($jobExists) {
    Write-Host "[GCP] Updating Cloud Scheduler job: $JobName"
    gcloud scheduler jobs update http $JobName `
      --location=$Region `
      --schedule="$schedule" `
      --time-zone="$timeZone" `
      --uri="$TargetUrl" `
      --http-method=POST `
      --update-headers="$headers" `
      --attempt-deadline=300s `
      --min-backoff=30s `
      --max-backoff=600s `
      --max-doublings=5 `
      --max-retry-attempts=3 `
      --project=$ProjectId | Out-Null
  } else {
    Write-Host "[GCP] Creating Cloud Scheduler job: $JobName"
    gcloud scheduler jobs create http $JobName `
      --location=$Region `
      --schedule="$schedule" `
      --time-zone="$timeZone" `
      --uri="$TargetUrl" `
      --http-method=POST `
      --headers="$headers" `
      --attempt-deadline=300s `
      --min-backoff=30s `
      --max-backoff=600s `
      --max-doublings=5 `
      --max-retry-attempts=3 `
      --project=$ProjectId | Out-Null
  }
}

Require-Command "gcloud"
Ensure-ActiveGcloudAuth

$DatabaseUrl = if ($DatabaseUrl) { $DatabaseUrl } else { $env:DATABASE_URL }
$JwtSecret = if ($JwtSecret) { $JwtSecret } else { $env:JWT_SECRET }
$AdminApiKey = if ($AdminApiKey) { $AdminApiKey } else { $env:ADMIN_API_KEY }
$CronSecret = if ($CronSecret) { $CronSecret } else { $env:CRON_SECRET }
$UpstashUrl = if ($UpstashUrl) { $UpstashUrl } else { $env:UPSTASH_REDIS_REST_URL }
$UpstashToken = if ($UpstashToken) { $UpstashToken } else { $env:UPSTASH_REDIS_REST_TOKEN }

# Fallback para segredo já existente no Secret Manager (evita pular scheduler sem necessidade)
if ([string]::IsNullOrWhiteSpace($CronSecret)) {
  $CronSecret = Get-SecretLatestValue -Name "radar-bank-cron-secret"
  if (-not [string]::IsNullOrWhiteSpace($CronSecret)) {
    Write-Host "[GCP] Reusing existing CRON secret from Secret Manager"
  }
}

Write-Host "[1/7] Setting active project"
gcloud config set project $ProjectId | Out-Null

Write-Host "[2/7] Enabling required APIs"
$apis = @(
  "run.googleapis.com",
  "cloudbuild.googleapis.com",
  "artifactregistry.googleapis.com",
  "secretmanager.googleapis.com",
  "cloudscheduler.googleapis.com",
  "logging.googleapis.com"
)
foreach ($api in $apis) {
  Ensure-ApiEnabled -Api $api
}

Write-Host "[3/7] Ensuring Artifact Registry"
Ensure-ArtifactRepo

Write-Host "[4/7] Ensuring secrets"
$secretNames = @(
  "radar-bank-database-url",
  "radar-bank-jwt-secret",
  "radar-bank-admin-api-key",
  "radar-bank-cron-secret",
  "radar-bank-redis-url",
  "radar-bank-redis-token"
)
foreach ($name in $secretNames) {
  Ensure-Secret -Name $name
}

Write-Host "[5/7] Adding secret versions (if values provided)"
Add-SecretVersion -Name "radar-bank-database-url" -Value $DatabaseUrl
Add-SecretVersion -Name "radar-bank-jwt-secret" -Value $JwtSecret
Add-SecretVersion -Name "radar-bank-admin-api-key" -Value $AdminApiKey
Add-SecretVersion -Name "radar-bank-cron-secret" -Value $CronSecret
Add-SecretVersion -Name "radar-bank-redis-url" -Value $UpstashUrl
Add-SecretVersion -Name "radar-bank-redis-token" -Value $UpstashToken

Write-Host "[6/7] Deploying via Cloud Build"
$substitutions = "_REGION=$Region,_REPO=$Repo,_SERVICE=$Service,_APP_URL=$AppUrl"
gcloud builds submit `
  --config=cloudbuild.yaml `
  --substitutions="$substitutions" `
  --project=$ProjectId

$serviceUrl = gcloud run services describe $Service --region=$Region --format="value(status.url)" --project=$ProjectId
if (-not $serviceUrl) {
  throw "Could not fetch Cloud Run service URL after deploy."
}

Write-Host "[7/7] Configuring Cloud Scheduler"
$cronTarget = "$serviceUrl/api/ingest/cron"
Upsert-SchedulerJob -JobName $CronJobName -TargetUrl $cronTarget -Secret $CronSecret

Write-Host ""
Write-Host "Deploy complete" -ForegroundColor Green
Write-Host "Cloud Run URL: $serviceUrl"
Write-Host "Cron endpoint: $cronTarget"
Write-Host ""
Write-Host "Next: run smoke test with scripts/smoke-test-prod.ps1"
