# Redis Caching Implementation

This document explains the Redis caching implementation in the MockPie application.

## Overview

Redis is now implemented as a middleware in the application, which makes it available for all routes through request state. The Redis client is provided via a dependency injection mechanism, allowing for better testability and error handling.

## Redis Usage in the Application

The Redis cache is used in the following APIs:

1. **Authentication APIs**:
   - `/auth/login` - Stores access and refresh tokens in Redis
   - `/auth/register` - Stores access and refresh tokens in Redis after registration
   - `/auth/refresh` - Validates cached tokens and generates new ones
   - `/auth/logout` - Revokes tokens from Redis
   - `/auth/me` - Uses the token validation through Redis

2. **Health Check and Diagnostic APIs**:
   - `/health` - Checks Redis connection status and basic operations
   - `/api/redis-test` - Tests various Redis operations for cache functionality

## Implementation Details

1. **Redis Middleware** (`redis_middleware.py`):
   - Initializes a Redis client for each request
   - Attaches it to the request state
   - Handles Redis connection failures gracefully

2. **Redis Dependency** (`redis_dependency.py`):
   - Provides dependency injection for Redis client
   - Retrieves Redis client from request state
   - Falls back to creating a new client if necessary

3. **Token Handler** (`token_handler.py`):
   - Updated to use Redis dependency
   - Includes fallbacks for Redis failures
   - Performs token storage, validation, and revocation

4. **Authentication Controllers** (`user_login.py`, `user_registration.py`):
   - Updated to use Redis dependency
   - Includes error handling for Redis operations
   - Ensures application works even if Redis is down

5. **Test Suite** (`test_redis_cache.py`):
   - Unit tests for Redis functionality
   - Mocks Redis client for testing
   - Tests token storage, validation, revocation

## Testing

To test the Redis functionality:

1. **Unit Tests**:
   ```bash
   cd backend
   python -m pytest tests/test_redis_cache.py -v
   ```

2. **API Tests**:
   ```bash
   # For Bash/Linux
   ./scripts/test_redis_api.sh
   
   # For PowerShell/Windows
   ./scripts/test_redis_api.ps1
   ```

3. **Manual Testing**:
   - Use the `/health` endpoint to check Redis status
   - Use the `/api/redis-test` endpoint to test specific Redis operations

## Error Handling

The Redis implementation includes robust error handling:

1. **Connection Failures**:
   - Application continues to function if Redis is unavailable
   - JWT tokens still work without Redis
   - Errors are logged but don't crash the application

2. **Operation Failures**:
   - Individual Redis operations can fail without affecting the entire request
   - Each operation is wrapped in try/except blocks

## Conclusion

The Redis caching system is now implemented as a middleware, providing a more robust and maintainable solution. The Redis client is available throughout the application via dependency injection, and all operations include proper error handling to ensure application stability even when Redis is unavailable.
