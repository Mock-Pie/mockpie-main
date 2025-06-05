from fastapi import Request
from backend.app.utils.redis_client import RedisClient

def get_redis_client(request: Request) -> RedisClient:
    """
    Dependency function to get the Redis client from the request state.
    
    If Redis client is not available in the request state (e.g., if the middleware failed),
    it falls back to creating a new Redis client.
    
    Args:
        request: The FastAPI request object
        
    Returns:
        RedisClient: An instance of the Redis client
    """
    if hasattr(request.state, 'redis'):
        return request.state.redis
    
    # Fallback to creating a new client if middleware didn't set it
    return RedisClient()
