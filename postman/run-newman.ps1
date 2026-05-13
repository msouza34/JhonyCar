param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$CollectionPath = "$PSScriptRoot/JhonyCar-API.postman_collection.json",
    [string]$EnvironmentPath = "$PSScriptRoot/JhonyCar-Local.postman_environment.json",
    [string]$ReportsDir = "$PSScriptRoot/reports",
    [switch]$Insecure
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Write-Host 'newman nao encontrado no PATH.' -ForegroundColor Yellow
    Write-Host 'Instale com: npm install -g newman' -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $CollectionPath)) {
    throw "Collection nao encontrada: $CollectionPath"
}

if (-not (Test-Path $EnvironmentPath)) {
    $exampleEnvironmentPath = "$PSScriptRoot/JhonyCar-Local.postman_environment.example.json"
    if (Test-Path $exampleEnvironmentPath) {
        Copy-Item -LiteralPath $exampleEnvironmentPath -Destination $EnvironmentPath -Force
        Write-Host "Environment local criado a partir do exemplo: $EnvironmentPath" -ForegroundColor Yellow
    } else {
        throw "Environment nao encontrado: $EnvironmentPath"
    }
}

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runtimeEnvPath = Join-Path $ReportsDir "JhonyCar-Local.runtime.$timestamp.json"
$junitPath = Join-Path $ReportsDir "newman.$timestamp.junit.xml"
$jsonPath = Join-Path $ReportsDir "newman.$timestamp.report.json"
$exportEnvPath = Join-Path $ReportsDir "JhonyCar-Local.final.$timestamp.json"

$envObject = Get-Content $EnvironmentPath -Raw | ConvertFrom-Json
$baseUrlVar = $envObject.values | Where-Object { $_.key -eq 'baseUrl' } | Select-Object -First 1

if ($null -eq $baseUrlVar) {
    $envObject.values += [pscustomobject]@{ key = 'baseUrl'; value = $BaseUrl; enabled = $true }
} else {
    $baseUrlVar.value = $BaseUrl
}

$envObject | ConvertTo-Json -Depth 25 | Set-Content -Path $runtimeEnvPath -Encoding utf8

$args = @(
    'run',
    $CollectionPath,
    '-e', $runtimeEnvPath,
    '--reporters', 'cli,junit,json',
    '--reporter-junit-export', $junitPath,
    '--reporter-json-export', $jsonPath,
    '--export-environment', $exportEnvPath,
    '--color', 'on'
)

if ($Insecure) {
    $args += '--insecure'
}

Write-Host "Executando fluxo Newman em $BaseUrl..." -ForegroundColor Cyan
& newman @args
$exitCode = $LASTEXITCODE

Write-Host "Relatorio JUnit: $junitPath"
Write-Host "Relatorio JSON : $jsonPath"
Write-Host "Env final      : $exportEnvPath"

exit $exitCode
