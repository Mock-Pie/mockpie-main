# This script will start your application with detailed logging
# and retry with a clean database if needed
$ErrorActionPreference = "Stop"

Write-Host "Checking backend status..." -ForegroundColor Cyan

# Create or clear environment variables file
$envFile = "D:\3b3znew\mockpie\mockpie-main\backend\.env"
$envBackup = "D:\3b3znew\mockpie\mockpie-main\backend\.env.backup"

if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
app_name=mockpie
app_url=localhost:8081
debug=True
database_url=postgresql://postgres:postgres@localhost:5432/postgres
postgres_user=postgres
postgres_password=postgres
postgres_db=postgres
secret_key="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
algorithm="HS256"
access_token_expire_minutes=30
refresh_token_expire_days=7
"@ | Out-File -FilePath $envFile -Encoding utf8
}

# Check if Postgres is running locally
try {
    Write-Host "Checking PostgreSQL connection..." -ForegroundColor Cyan
    $null = Invoke-Expression "psql -U postgres -c '\l'" 2>&1
    Write-Host "PostgreSQL is running." -ForegroundColor Green
}
catch {
    Write-Host "PostgreSQL is not running or not accessible. Starting with Docker..." -ForegroundColor Yellow
    docker-compose up -d db
    Start-Sleep -Seconds 5
}

# Start FastAPI application
Write-Host "Starting FastAPI backend..." -ForegroundColor Cyan
try {
    cd D:\3b3znew\mockpie\mockpie-main\backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8081 --log-level debug
}
catch {
    Write-Host "Error running the application: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
