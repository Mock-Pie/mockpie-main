# Redis Cache Tests

This directory contains tests for the Redis caching functionality in the MockPie application.

## Overview

The Redis caching is primarily used for the following operations:

1. **Token Management**:
   - Storing access tokens
   - Storing refresh tokens
   - Validating tokens during authentication
   - Revoking tokens during logout

2. **APIs That Use Redis Cache**:
   - `/auth/login` - Caches user tokens
   - `/auth/register` - Caches user tokens after registration
   - `/auth/refresh` - Validates cached tokens and generates new ones
   - `/auth/logout` - Removes cached tokens
   - `/auth/me` - Uses cached tokens for validation
   - `/health` - Checks Redis connection status

## Running the Tests

To run the Redis cache tests, use the following command from the project root:

```bash
# Navigate to the backend directory
cd backend

# Install test dependencies if not already installed
pip install pytest pytest-mock

# Run the tests
pytest tests/test_redis_cache.py -v
```

## Test Coverage

The tests cover:

1. Redis client singleton pattern
2. Token storage in Redis
3. Token validation using Redis
4. Token revocation (logout)
5. Login functionality with Redis
6. Token refresh with Redis validation
7. Current user retrieval with Redis validation
8. Health endpoint Redis check
9. Error handling and fallbacks when Redis is unavailable

## Mocking

The tests use pytest's mocking capabilities to mock:
- Redis client
- Database sessions
- JWT token operations

This allows testing the Redis functionality without requiring an actual Redis server to be running.
