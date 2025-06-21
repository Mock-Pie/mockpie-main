# Start development environment
Write-Host "Starting development environment..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml up -d

Write-Host "`nAccess your application at:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8081" -ForegroundColor White
Write-Host "- Backend Docs: http://localhost:8081/docs" -ForegroundColor White
