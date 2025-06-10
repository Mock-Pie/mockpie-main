#!/bin/bash
# Script to test Redis functionality in the application

echo "========== Testing Redis Functionality =========="

# Test 1: Health check endpoint
echo -e "\n1. Testing /health endpoint..."
curl -s http://localhost:8081/health | python -m json.tool

# Test 2: Redis specific test endpoint
echo -e "\n2. Testing /api/redis-test endpoint..."
curl -s http://localhost:8081/api/redis-test | python -m json.tool

# Test 3: Testing login with Redis
echo -e "\n3. Testing login with Redis..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=password123")
echo $LOGIN_RESPONSE | python -m json.tool

# Extract tokens from login response
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin).get('refresh_token', ''))")

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
  echo -e "\nTokens successfully retrieved from login"
  
  # Test 4: Testing token refresh
  echo -e "\n4. Testing token refresh..."
  curl -s -X POST http://localhost:8081/auth/refresh \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "refresh_token=$REFRESH_TOKEN" | python -m json.tool
  
  # Test 5: Testing authenticated endpoint
  echo -e "\n5. Testing authenticated endpoint (/auth/me)..."
  curl -s -X GET http://localhost:8081/auth/me \
    -H "Authorization: Bearer $ACCESS_TOKEN" | python -m json.tool
  
  # Test 6: Testing logout
  echo -e "\n6. Testing logout..."
  curl -s -X POST http://localhost:8081/auth/logout \
    -H "Authorization: Bearer $ACCESS_TOKEN" | python -m json.tool
    
  # Test 7: Verify token is invalidated after logout
  echo -e "\n7. Verifying token is invalidated after logout..."
  curl -s -X GET http://localhost:8081/auth/me \
    -H "Authorization: Bearer $ACCESS_TOKEN" | python -m json.tool
else
  echo "Failed to retrieve tokens from login response"
fi

echo -e "\n========== Redis Test Complete =========="
