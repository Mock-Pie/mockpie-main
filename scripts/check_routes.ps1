# PowerShell script to check all registered routes in FastAPI
$url = "http://localhost:8081/openapi.json"
Write-Host "Fetching routes from $url..."

try {
    $response = Invoke-RestMethod -Uri $url -Method Get
    
    Write-Host "`nRegistered Routes:" -ForegroundColor Green
    
    foreach ($path in $response.paths.PSObject.Properties) {
        $routePath = $path.Name
        $methods = $path.Value.PSObject.Properties.Name
        
        foreach ($method in $methods) {
            $methodUpper = $method.ToUpper()
            $summary = $path.Value.$method.summary
            
            if ($summary) {
                Write-Host "${methodUpper} $routePath - $summary"
            } else {
                Write-Host "${methodUpper} $routePath"
            }
        }
    }
} catch {
    Write-Host "Error fetching routes: $_" -ForegroundColor Red
    Write-Host "Make sure your FastAPI application is running on http://localhost:8081"
}
