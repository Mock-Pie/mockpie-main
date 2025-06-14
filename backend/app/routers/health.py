from fastapi import APIRouter, status, Depends
from datetime import datetime, timedelta

from backend.app.utils.redis_client import RedisClient
from backend.app.utils.redis_dependency import get_redis_client

router = APIRouter(tags=["health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(redis: RedisClient = Depends(get_redis_client)):
    """Health check endpoint that also verifies Redis connection"""
    redis_status = {
        "status": "unknown",
        "message": ""
    }
    
    try:
        # Try to ping Redis
        if redis.redis.ping():
            redis_status["status"] = "connected"
            redis_status["message"] = "Redis connection is healthy"
            
            # Test basic Redis operations
            test_key = "health_check_test"
            test_value = f"test_{datetime.now().isoformat()}"
            
            # Try to set a value
            redis.redis.setex(test_key, 30, test_value)  # Expires in 30 seconds
            
            # Try to get the value back
            retrieved_value = redis.redis.get(test_key)
            
            if retrieved_value == test_value:
                redis_status["read_write_test"] = "passed"
            else:
                redis_status["read_write_test"] = "failed"
                redis_status["message"] += ", but read/write test failed"
                
        else:
            redis_status["status"] = "error"
            redis_status["message"] = "Ping failed without raising exception"
    except Exception as e:
        redis_status["status"] = "error"
        redis_status["message"] = f"Redis error: {str(e)}"
    
    return {
        "status": "ok",
        "redis": redis_status,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/redis-test", status_code=status.HTTP_200_OK)
async def test_redis_cache(redis: RedisClient = Depends(get_redis_client)):
    """
    Test endpoint for Redis caching functionality.
    This endpoint demonstrates the basic Redis operations used in the application.
    """
    test_results = {}
    
    # Test 1: Basic set and get
    try:
        test_key = "test_key"
        test_value = f"test_value_{datetime.now().isoformat()}"
        
        # Set a value with 1-minute expiration
        redis.redis.setex(test_key, 60, test_value)
        
        # Get the value back
        retrieved_value = redis.redis.get(test_key)
        
        test_results["basic_set_get"] = {
            "status": "success" if retrieved_value == test_value else "failed",
            "expected": test_value,
            "actual": retrieved_value
        }
    except Exception as e:
        test_results["basic_set_get"] = {
            "status": "error",
            "message": str(e)
        }
    
    # Test 2: Token storage
    try:
        test_user_id = 999999  # Use a high number to avoid conflicts
        test_token = f"test_token_{datetime.now().isoformat()}"
        expires = timedelta(minutes=5)
        
        # Store token
        redis.set_access_token(test_user_id, test_token, expires)
        
        # Retrieve token
        retrieved_token = redis.get_access_token(test_user_id)
        
        # Validate token
        validation_result = redis.validate_access_token(test_user_id, test_token)
        
        test_results["token_storage"] = {
            "status": "success" if retrieved_token == test_token and validation_result else "failed",
            "token_retrieved": retrieved_token == test_token,
            "token_validated": validation_result
        }
        
        # Clean up
        redis.revoke_tokens(test_user_id)
        
        # Verify cleanup
        retrieved_token_after_revoke = redis.get_access_token(test_user_id)
        test_results["token_revocation"] = {
            "status": "success" if retrieved_token_after_revoke is None else "failed",
            "token_after_revoke": retrieved_token_after_revoke
        }
    except Exception as e:
        test_results["token_storage"] = {
            "status": "error",
            "message": str(e)
        }
    
    return {
        "redis_test_results": test_results,
        "timestamp": datetime.now().isoformat()
    }
