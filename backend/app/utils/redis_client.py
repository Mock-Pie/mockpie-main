import json
from redis import Redis
from redis.connection import ConnectionPool
from datetime import timedelta, datetime
from typing import Optional, Any, Dict, Union
import time

class RedisClient:
     # Singleton instance
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            # Initialize the Redis connection only once
            host = kwargs.get('host', 'redis')
            port = kwargs.get('port', 6379)
            db = kwargs.get('db', 0)
            password = kwargs.get('password', None)
            
            # Create a connection pool
            pool = ConnectionPool(
                host=host, 
                port=port, 
                db=db, 
                password=password,
                max_connections=10,
                decode_responses=True
            )
            
            # Use the connection pool
            cls._instance.redis = Redis(connection_pool=pool)
        return cls._instance
    
    def __init__(self, host='redis', port=6379, db=0, password=None):
        # This will only be called once for the singleton instance
        # The actual Redis connection is already set up in __new__
        pass
    
    def _ensure_int(self, value) -> int:
        """Safely convert SQLAlchemy Column or any value to int"""
        try:
            return int(value)
        except (TypeError, ValueError):
            raise ValueError(f"Cannot convert {value} to integer")
        
    def set_access_token(self, user_id: Union[int, Any], token: str, expires_delta: timedelta):
        """Store access token with expiration"""
        user_id_int = self._ensure_int(user_id)
        key = f"access_token:{user_id_int}"
        value = json.dumps({"token": token, "type": "access"})
        self.redis.setex(key, int(expires_delta.total_seconds()), value)
        
    def set_refresh_token(self, user_id: Union[int, Any], token: str, expires_delta: timedelta):
        """Store refresh token with expiration"""
        user_id_int = self._ensure_int(user_id)
        key = f"refresh_token:{user_id_int}"
        value = json.dumps({"token": token, "type": "refresh"})
        self.redis.setex(key, int(expires_delta.total_seconds()), value)
        
    def get_access_token(self, user_id: Union[int, Any]) -> Optional[str]:
        """Get access token for user"""
        user_id_int = self._ensure_int(user_id)
        key = f"access_token:{user_id_int}"
        data = self.redis.get(key)
        if data:
            return json.loads(data).get("token")
        return None
        
    def get_refresh_token(self, user_id: Union[int, Any]) -> Optional[str]:
        """Get refresh token for user"""
        user_id_int = self._ensure_int(user_id)
        key = f"refresh_token:{user_id_int}"
        data = self.redis.get(key)
        if data:
            return json.loads(data).get("token")
        return None
        
    def validate_access_token(self, user_id: Union[int, Any], token: str) -> bool:
        """Validate if access token matches stored token"""
        user_id_int = self._ensure_int(user_id)
        stored_token = self.get_access_token(user_id_int)
        return stored_token == token
    def validate_refresh_token(self, user_id: Union[int, Any], token: str) -> bool:
        """Validate if refresh token matches stored token"""
        user_id_int = self._ensure_int(user_id)
        stored_token = self.get_refresh_token(user_id_int)
        return stored_token == token
        
    def revoke_tokens(self, user_id: Union[int, Any]):
        """Revoke all tokens for user (logout)"""
        user_id_int = self._ensure_int(user_id)
        access_key = f"access_token:{user_id_int}"
        refresh_key = f"refresh_token:{user_id_int}"
        
        # Check if keys exist before deleting
        access_exists = self.redis.exists(access_key)
        refresh_exists = self.redis.exists(refresh_key)
        
        # Delete the tokens
        deleted_count = self.redis.delete(access_key, refresh_key)
        
        # Return the number of keys deleted (should be 0, 1, or 2)
        return deleted_count
        
    def revoke_all_tokens(self, user_id: Union[int, Any]):
        """Revoke all tokens for a user across all devices"""
        user_id_int = self._ensure_int(user_id)
        pattern = f"*:{user_id_int}"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
    
    def store_token_with_metadata(self, user_id: Union[int, Any], token: str, token_type: str, 
                                  expires_delta: timedelta, metadata: Dict[str, Any] = None):
        """Store token with additional metadata"""
        user_id_int = self._ensure_int(user_id)
        key = f"{token_type}_token:{user_id_int}"
        value = {
            "token": token,
            "type": token_type,
            "created_at": datetime.now().isoformat(),
        }
        if metadata:
            value.update(metadata)
        self.redis.setex(key, int(expires_delta.total_seconds()), json.dumps(value))
    
    def get_token_metadata(self, user_id: Union[int, Any], token_type: str) -> Optional[Dict[str, Any]]:
        """Get token with all metadata"""
        user_id_int = self._ensure_int(user_id)
        key = f"{token_type}_token:{user_id_int}"
        data = self.redis.get(key)
        return json.loads(data) if data else None
    
    def _get_redis_connection(self):
        """Get Redis connection with retry logic"""
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                if self.redis.ping():
                    return self.redis
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    raise RuntimeError(f"Failed to connect to Redis after {max_retries} attempts: {e}")
                # Wait before retrying (with exponential backoff)
                time.sleep(2 ** retry_count) 
        
        return self.redis