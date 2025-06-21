# Script to test Redis functionality in the application

Write-Host "========== Testing Redis Functionality ==========" -ForegroundColor Cyan

# Test 1: Health check endpoint
Write-Host "`n1. Testing /health endpoint..." -ForegroundColor Green
$healthResponse = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method Get
$healthResponse | ConvertTo-Json -Depth 5

# Test 2: Redis specific test endpoint
Write-Host "`n2. Testing /api/redis-test endpoint..." -ForegroundColor Green
$redisTestResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/redis-test" -Method Get
$redisTestResponse | ConvertTo-Json -Depth 5

# Test 3: Testing login with Redis
Write-Host "`n3. Testing login with Redis..." -ForegroundColor Green
$loginData = @{
    email = "testuser_499233720@example.com"
    password = "password123"
}
$loginResponse = try {
    Invoke-RestMethod -Uri "http://localhost:8081/auth/login" -Method Post -Body $loginData -ContentType "application/x-www-form-urlencoded"
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
    $null
}

if ($loginResponse) {
    $loginResponse | ConvertTo-Json -Depth 5

    $accessToken = $loginResponse.access_token
    $refreshToken = $loginResponse.refresh_token

    if ($accessToken -and $refreshToken) {
        Write-Host "`nTokens successfully retrieved from login" -ForegroundColor Green
        
        # Test 4: Testing token refresh
        Write-Host "`n4. Testing token refresh..." -ForegroundColor Green
        $refreshData = @{
            refresh_token = $refreshToken
        }
        $refreshResponse = try {
            Invoke-RestMethod -Uri "http://localhost:8081/auth/refresh" -Method Post -Body $refreshData -ContentType "application/x-www-form-urlencoded"
        } catch {
            Write-Host "Token refresh failed: $_" -ForegroundColor Red
            $null
        }
        
        if ($refreshResponse) {
            $refreshResponse | ConvertTo-Json -Depth 5
        }
        
        # Test 5: Testing authenticated endpoint
        Write-Host "`n5. Testing authenticated endpoint (/auth/me)..." -ForegroundColor Green
        $meResponse = try {
            Invoke-RestMethod -Uri "http://localhost:8081/auth/me" -Method Get -Headers @{
                "Authorization" = "Bearer $accessToken"
            }
        } catch {
            Write-Host "Auth/me failed: $_" -ForegroundColor Red
            $null
        }
        
        if ($meResponse) {
            $meResponse | ConvertTo-Json -Depth 5
        }
        
        # Test 6: Testing logout
        Write-Host "`n6. Testing logout..." -ForegroundColor Green
        $logoutResponse = try {
            Invoke-RestMethod -Uri "http://localhost:8081/auth/logout" -Method Post -Headers @{
                "Authorization" = "Bearer $accessToken"
            }
        } catch {
            Write-Host "Logout failed: $_" -ForegroundColor Red
            $null
        }
        
        if ($logoutResponse) {
            $logoutResponse | ConvertTo-Json -Depth 5
        }
            
        # Test 7: Verify token is invalidated after logout
        Write-Host "`n7. Verifying token is invalidated after logout..." -ForegroundColor Green
        try {
            $invalidTokenResponse = Invoke-RestMethod -Uri "http://localhost:8081/auth/me" -Method Get -Headers @{
                "Authorization" = "Bearer $accessToken"
            }
            Write-Host "Token is still valid! This is unexpected." -ForegroundColor Red
            $invalidTokenResponse | ConvertTo-Json -Depth 5
        } catch {
            Write-Host "Token successfully invalidated. Expected 401 Unauthorized: $_" -ForegroundColor Green
        }
    } else {
        Write-Host "Failed to retrieve tokens from login response" -ForegroundColor Red
    }
} else {
    Write-Host "Login test skipped due to failure" -ForegroundColor Yellow
}

# Test 8: Testing registration
Write-Host "`n8. Testing registration..." -ForegroundColor Green
$registerData = @{
    email = "testuser_$(Get-Random)@example.com"
    username = "testuser_$(Get-Random)"
    phone_number = "23457898765"
    password = "password123"
    password_confirmation = "password123"
    gender = "male"
}
$registerResponse = try {
    Invoke-RestMethod -Uri "http://localhost:8081/auth/register" -Method Post -Body $registerData -ContentType "application/x-www-form-urlencoded"
} catch {
    Write-Host "Registration failed: $_" -ForegroundColor Red
    $null
}

if ($registerResponse) {
    $registerResponse | ConvertTo-Json -Depth 5
    Write-Host "Registration test passed." -ForegroundColor Green
} else {
    Write-Host "Registration test failed." -ForegroundColor Red
}

Write-Host "`n========== Redis Test Complete ==========" -ForegroundColor Cyan
