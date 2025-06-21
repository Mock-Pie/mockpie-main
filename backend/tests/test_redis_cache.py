import pytest
import jwt
from datetime import timedelta
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import HTTPException, status
from redis import Redis
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.utils.redis_client import RedisClient
from backend.app.models.user.user import User
from backend.app.utils.token_handler import TokenHandler
from backend.app.controllers.authentication.user_login import LoginUser
from backend.app.controllers.authentication.user_registration import RegisterUser
from backend.config import settings

# Create test client
client = TestClient(app)

# Mock user data
test_user = {
    "email": "test@example.com",
    "username": "testuser",
    "phone_number": "1234567890",
    "password": "securepassword",
    "password_confirmation": "securepassword",
    "gender": "male"
}

# Fixtures
@pytest.fixture
def mock_redis():
    """Mock Redis client for testing"""
    redis_client = MagicMock(spec=RedisClient)
    # Setup mock methods
    redis_client.set_access_token = MagicMock()
    redis_client.set_refresh_token = MagicMock()
    redis_client.validate_access_token = MagicMock(return_value=True)
    redis_client.validate_refresh_token = MagicMock(return_value=True)
    redis_client.get_access_token = MagicMock(return_value="fake_access_token")
    redis_client.get_refresh_token = MagicMock(return_value="fake_refresh_token")
    redis_client.revoke_tokens = MagicMock()
    # Mock the Redis connection
    redis_client.redis = MagicMock(spec=Redis)
    redis_client.redis.ping = MagicMock(return_value=True)
    return redis_client

@pytest.fixture
def mock_db():
    """Mock database session for testing"""
    db = MagicMock(spec=Session)
    
    # Create a mock user
    user = MagicMock(spec=User)
    user.id = 1
    user.email = test_user["email"]
    user.username = test_user["username"]
    user.phone_number = test_user["phone_number"]
    user.gender = test_user["gender"]
    user.created_at = "2023-01-01T00:00:00"
    user.updated_at = "2023-01-01T00:00:00"
    user.verify_password = MagicMock(return_value=True)
    
    # Configure the db.query().filter().first() chain
    query_mock = MagicMock()
    filter_mock = MagicMock()
    filter_mock.first.return_value = user
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock
    
    # Configure db.commit and db.refresh
    db.commit = MagicMock()
    db.refresh = MagicMock()
    db.add = MagicMock()
    
    return db, user

# Tests for Redis client functionality
def test_redis_singleton_pattern():
    """Test that RedisClient follows the singleton pattern"""
    redis1 = RedisClient()
    redis2 = RedisClient()
    assert redis1 is redis2

# Tests for token handling with Redis
def test_token_storage_in_redis(mock_redis):
    """Test storing tokens in Redis"""
    user_id = 1
    access_token = "test_access_token"
    refresh_token = "test_refresh_token"
    access_expires = timedelta(minutes=15)
    refresh_expires = timedelta(days=7)
    
    # Call the method
    TokenHandler.store_tokens_in_redis(
        user_id, access_token, refresh_token, 
        access_expires, refresh_expires, redis=mock_redis
    )
    
    # Assert that Redis methods were called with correct arguments
    mock_redis.set_access_token.assert_called_once_with(user_id, access_token, access_expires)
    mock_redis.set_refresh_token.assert_called_once_with(user_id, refresh_token, refresh_expires)

def test_token_validation_in_redis(mock_redis):
    """Test validating tokens in Redis"""
    # Configure the mock
    mock_redis.validate_access_token.return_value = True
    
    # Test validation
    result = mock_redis.validate_access_token(1, "test_token")
    assert result is True
    
    # Configure mock for failure case
    mock_redis.validate_access_token.return_value = False
    
    # Test validation failure
    result = mock_redis.validate_access_token(1, "invalid_token")
    assert result is False

def test_token_revocation_in_redis(mock_redis):
    """Test revoking tokens in Redis"""
    user_id = 1
    
    # Revoke tokens
    TokenHandler.revoke_tokens(user_id, redis=mock_redis)
    
    # Assert Redis method was called
    mock_redis.revoke_tokens.assert_called_once_with(user_id)

# Tests for auth endpoints that use Redis
@patch('backend.app.controllers.authentication.user_login.TokenHandler.create_access_token')
@patch('backend.app.controllers.authentication.user_login.TokenHandler.store_tokens_in_redis')
def test_login_with_redis(mock_store_tokens, mock_create_token, mock_db, mock_redis):
    """Test login endpoint with Redis caching"""
    db, user = mock_db
    
    # Mock token creation
    mock_create_token.side_effect = ["fake_access_token", "fake_refresh_token"]
    
    # Call login method
    result = LoginUser.login_user(
        email=test_user["email"],
        password=test_user["password"],
        db=db,
        redis=mock_redis
    )
    
    # Assert token storage was called
    assert mock_store_tokens.called
    
    # Verify response structure
    assert "access_token" in result
    assert "refresh_token" in result
    assert "user" in result
    assert result["user"]["email"] == test_user["email"]

@patch('backend.app.controllers.authentication.user_login.jwt.decode')
def test_refresh_token_with_redis(mock_jwt_decode, mock_db, mock_redis):
    """Test refresh token endpoint with Redis validation"""
    db, user = mock_db
    
    # Mock JWT decode
    mock_jwt_decode.return_value = {
        "sub": test_user["email"],
        "refresh": True
    }
    
    # Configure Redis validation
    mock_redis.validate_refresh_token.return_value = True
    
    # Call refresh token method
    with patch('backend.app.controllers.authentication.user_login.TokenHandler.create_access_token', 
               return_value="new_access_token"):
        result = LoginUser.refresh_token(
            refresh_token="old_refresh_token",
            db=db,
            redis=mock_redis
        )
    
    # Assert Redis validation was called
    mock_redis.validate_refresh_token.assert_called_once()
    
    # Assert new token was stored
    mock_redis.set_access_token.assert_called_once()
    
    # Verify response
    assert result["access_token"] == "new_access_token"

@patch('backend.app.utils.token_handler.TokenHandler.decode_token')
def test_get_current_user_with_redis(mock_decode_token, mock_db, mock_redis):
    """Test getting current user with Redis token validation"""
    db, user = mock_db
    
    # Mock token decode
    mock_decode_token.return_value = {"sub": test_user["email"]}
    
    # Call get_current_user
    result_user = TokenHandler.get_current_user(
        token="test_token",
        db=db,
        redis=mock_redis
    )
    
    # Assert Redis validation was called
    mock_redis.validate_access_token.assert_called_once()
    
    # Verify user was returned
    assert result_user is user

def test_logout_with_redis(mock_redis):
    """Test logout endpoint with Redis token revocation"""
    user_id = 1
    
    # Call revoke_tokens
    TokenHandler.revoke_tokens(user_id, redis=mock_redis)
    
    # Assert Redis revocation was called
    mock_redis.revoke_tokens.assert_called_once_with(user_id)

# Integration test
@patch('backend.app.main.get_redis_client')
@patch('backend.app.main.get_db')
def test_health_endpoint(mock_get_db, mock_get_redis, mock_redis):
    """Test health endpoint with Redis check"""
    # Configure mocks
    mock_get_redis.return_value = mock_redis
    
    # Call health endpoint
    response = client.get("/health")
    
    # Verify response
    assert response.status_code == 200
    assert response.json()["redis"] == "connected"
    
    # Test Redis failure case
    mock_redis.redis.ping.side_effect = Exception("Redis connection error")
    
    # Call health endpoint again
    response = client.get("/health")
    
    # Verify error response
    assert response.status_code == 200
    assert "error" in response.json()["redis"]

# Error handling tests
@patch('backend.app.controllers.authentication.user_login.TokenHandler.create_access_token')
def test_login_redis_failure_fallback(mock_create_token, mock_db):
    """Test login endpoint falls back when Redis fails"""
    db, user = mock_db
    
    # Mock token creation
    mock_create_token.side_effect = ["fake_access_token", "fake_refresh_token"]
    
    # Mock Redis failure
    with patch('backend.app.controllers.authentication.user_login.TokenHandler.store_tokens_in_redis', 
               side_effect=Exception("Redis connection error")):
        # Login should still work without Redis
        result = LoginUser.login_user(
            email=test_user["email"],
            password=test_user["password"],
            db=db,
            redis=None  # No Redis
        )
    
    # Verify response still contains tokens
    assert "access_token" in result
    assert "refresh_token" in result
