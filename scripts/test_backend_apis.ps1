# Script to test all backend APIs
# This script will test all the API endpoints in the MockPie backend

# Configuration
$baseUrl = "http://localhost:8081"
$testEmail = "test@example.com"
$testUsername = "testuser"
$testPassword = "password123"
$testPhone = "1234567890"
$testGender = "male"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Title($title) {
    Write-ColorOutput Yellow "`n======================= $title ======================="
}

function Write-TestResult($endpoint, $status, $response) {
    if ($status -eq "Success") {
        Write-ColorOutput Green "✅ $endpoint - $status"
    }
    else {
        Write-ColorOutput Red "❌ $endpoint - $status"
    }
    
    # Pretty print the response
    if ($response) {
        try {
            $formattedResponse = $response | ConvertTo-Json -Depth 4
            Write-Output "Response: $formattedResponse"
        }
        catch {
            Write-Output "Response: $response"
        }
    }
    Write-Output "------------------------------------------------------"
}

# Store tokens
$script:accessToken = $null
$script:refreshToken = $null

# Make an API request
function Invoke-ApiRequest {
    param(
        [string]$endpoint,
        [string]$method = "GET",
        [object]$body = $null,
        [hashtable]$headers = @{},
        [switch]$useToken = $false,
        [switch]$isFormData = $false
    )
    
    $url = "$baseUrl$endpoint"
    
    # Add authorization header if token is available and useToken flag is set
    if ($useToken -and $script:accessToken) {
        $headers["Authorization"] = "Bearer $script:accessToken"
    }
    
    # Set content type
    if ($isFormData) {
        $headers["Content-Type"] = "application/x-www-form-urlencoded"
    }
    elseif (!$headers.ContainsKey("Content-Type")) {
        $headers["Content-Type"] = "application/json"
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
        }
        
        # Add body if provided
        if ($body) {
            if ($isFormData) {
                # Convert body to form data
                $formData = @{}
                foreach ($key in $body.Keys) {
                    $formData[$key] = $body[$key]
                }
                $params["Body"] = $formData
            }
            else {
                $params["Body"] = ($body | ConvertTo-Json)
            }
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Status = "Success"
            Response = $response
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        $errorDetails = $null
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorDetails = $reader.ReadToEnd() | ConvertFrom-Json
        }
        catch {
            # If we can't parse the error response, just use the exception message
        }
        
        return @{
            Status = "Error: $statusCode"
            Response = if ($errorDetails) { $errorDetails } else { $errorMessage }
        }
    }
}

# =========== Tests ==========

# Test health endpoint
function Test-Health {
    Write-Title "Testing Health Endpoint"
    $result = Invoke-ApiRequest -endpoint "/health"
    Write-TestResult "GET /health" $result.Status $result.Response
}

# Test list routes endpoint
function Test-Routes {
    Write-Title "Testing Routes Endpoint"
    $result = Invoke-ApiRequest -endpoint "/api/routes"
    Write-TestResult "GET /api/routes" $result.Status $result.Response
}

# Test Redis endpoint
function Test-Redis {
    Write-Title "Testing Redis Endpoint"
    $result = Invoke-ApiRequest -endpoint "/api/redis-test"
    Write-TestResult "GET /api/redis-test" $result.Status $result.Response
}

# Test user registration
function Test-Registration {
    Write-Title "Testing User Registration"
    $body = @{
        email = $testEmail
        username = $testUsername
        phone_number = $testPhone
        password = $testPassword
        password_confirmation = $testPassword
        gender = $testGender
    }
    
    $result = Invoke-ApiRequest -endpoint "/auth/register" -method "POST" -body $body -isFormData
    
    if ($result.Status -eq "Success") {
        # Store tokens for future tests
        $script:accessToken = $result.Response.access_token
        $script:refreshToken = $result.Response.refresh_token
        Write-Output "Tokens stored for future tests"
    }
    
    Write-TestResult "POST /auth/register" $result.Status $result.Response
}

# Test user login
function Test-Login {
    Write-Title "Testing User Login"
    $body = @{
        email = $testEmail
        password = $testPassword
    }
    
    $result = Invoke-ApiRequest -endpoint "/auth/login" -method "POST" -body $body -isFormData
    
    if ($result.Status -eq "Success") {
        # Store tokens for future tests
        $script:accessToken = $result.Response.access_token
        $script:refreshToken = $result.Response.refresh_token
        Write-Output "Tokens stored for future tests"
    }
    
    Write-TestResult "POST /auth/login" $result.Status $result.Response
}

# Test getting current user
function Test-CurrentUser {
    Write-Title "Testing Get Current User"
    $result = Invoke-ApiRequest -endpoint "/auth/me" -useToken
    Write-TestResult "GET /auth/me" $result.Status $result.Response
}

# Test token refresh
function Test-TokenRefresh {
    Write-Title "Testing Token Refresh"
    
    if (!$script:refreshToken) {
        Write-ColorOutput Red "❌ No refresh token available. Please run Test-Login first."
        return
    }
    
    $body = @{
        refresh_token = $script:refreshToken
    }
    
    $result = Invoke-ApiRequest -endpoint "/auth/refresh" -method "POST" -body $body -isFormData
    
    if ($result.Status -eq "Success" -and $result.Response.access_token) {
        $script:accessToken = $result.Response.access_token
        Write-Output "Access token updated"
    }
    
    Write-TestResult "POST /auth/refresh" $result.Status $result.Response
}

# Test logout
function Test-Logout {
    Write-Title "Testing Logout"
    
    if (!$script:accessToken) {
        Write-ColorOutput Red "❌ No access token available. Please run Test-Login first."
        return
    }
    
    $result = Invoke-ApiRequest -endpoint "/auth/logout" -method "POST" -useToken
    Write-TestResult "POST /auth/logout" $result.Status $result.Response
    
    # Verify token invalidation by trying to access protected endpoint
    Write-Output "Verifying token invalidation..."
    $verifyResult = Invoke-ApiRequest -endpoint "/auth/me" -useToken
    
    if ($verifyResult.Status -match "Error") {
        Write-ColorOutput Green "✅ Token invalidation verification successful: Cannot access protected endpoint after logout"
    }
    else {
        Write-ColorOutput Red "❌ Token invalidation verification failed: Can still access protected endpoint after logout"
    }
}

# Run all tests
function Test-All {
    # Basic endpoints
    Test-Health
    Test-Routes
    Test-Redis
    
    # Authentication flow
    try {
        # Try to register (may fail if user already exists)
        Test-Registration
    }
    catch {
        Write-ColorOutput Yellow "Registration test failed. User might already exist. Continuing with login..."
    }
    
    # Login and subsequent tests requiring authentication
    Test-Login
    
    if ($script:accessToken) {
        Test-CurrentUser
        Test-TokenRefresh
        Test-Logout
    }
    else {
        Write-ColorOutput Red "❌ Authentication failed. Skipping tests that require authentication."
    }
    
    Write-Title "All Tests Completed"
}

# Execute all tests
Test-All
