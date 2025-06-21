# Start backend with detailed error logging
Set-Location -Path "d:\3b3znew\mockpie\mockpie-main"

# Kill any existing uvicorn processes (optional)
# Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force

# Ensure environment variables are set
$env:PYTHONPATH = "d:\3b3znew\mockpie\mockpie-main"

Write-Host "Starting FastAPI application with detailed logging..." -ForegroundColor Green
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8081 --log-level debug

# Keep the window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "Application exited with errors. Press any key to close this window..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
