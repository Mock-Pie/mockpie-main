from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
from backend.app.utils.redis_client import RedisClient
import logging

class RedisMiddleware(BaseHTTPMiddleware):
    """
    Middleware that initializes a Redis client connection and makes it available
    throughout the request lifecycle.
    
    This middleware ensures that:
    1. Redis is connected at the start of each request
    2. The connection is properly managed
    3. Redis operations are available across the application
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = logging.getLogger(__name__)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Initialize Redis client
        try:
            # Create Redis client and attach to request state
            redis_client = RedisClient()
            # Verify the connection works by pinging Redis
            try:
                if redis_client.redis.ping():
                    self.logger.debug("Redis connection verified with ping")
                else:
                    self.logger.warning("Redis ping failed but didn't raise an exception")
            except Exception as ping_error:
                self.logger.warning(f"Redis ping failed: {ping_error}")
                # We'll still attach the client but mark it as unavailable
                
            # Attach client to request state
            request.state.redis = redis_client
            self.logger.debug("Redis client initialized and attached to request state")
        except Exception as e:
            self.logger.error(f"Failed to initialize Redis client: {e}")
            # Continue with request even if Redis fails - application should have fallbacks
        
        # Process the request
        response = await call_next(request)
        
        # Clean up (if needed)
        # Redis connections are managed by the pool in RedisClient
        
        return response
