# Run Redis cache tests
Write-Host "Running Redis cache tests..." -ForegroundColor Cyan
Set-Location $PSScriptRoot\..\
python -m pytest tests/test_redis_cache.py -v
