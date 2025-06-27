#!/usr/bin/env python3
"""
Test script for the restore user API endpoint
This script tests the POST /users/retrieve endpoint to restore deleted accounts
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test@example.com"

def test_restore_user():
    """Test the restore user functionality"""
    print("=" * 60)
    print("TESTING RESTORE USER API")
    print("=" * 60)
    
    # Test 1: Restore a user account
    print("\n1. Testing restore user account...")
    restore_data = {
        "email": TEST_EMAIL
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=restore_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ SUCCESS: User restored successfully!")
            print(f"User ID: {user_data.get('id')}")
            print(f"Email: {user_data.get('email')}")
            print(f"Username: {user_data.get('username')}")
            print(f"First Name: {user_data.get('first_name')}")
            print(f"Last Name: {user_data.get('last_name')}")
            print(f"Deleted At: {user_data.get('deleted_at')}")
        else:
            print("❌ FAILED: Could not restore user")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
    
    # Test 2: Try to restore with invalid email
    print("\n2. Testing restore with invalid email...")
    invalid_data = {
        "email": "nonexistent@example.com"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=invalid_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: Correctly rejected invalid email")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 404 for invalid email")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
    
    # Test 3: Try to restore with empty email
    print("\n3. Testing restore with empty email...")
    empty_data = {
        "email": ""
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=empty_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print("✅ SUCCESS: Correctly rejected empty email")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 422 for empty email")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")

def test_restore_old_account():
    """Test restoring an account that was deleted more than 30 days ago"""
    print("\n4. Testing restore of old deleted account...")
    
    # This would require a test account that was deleted more than 30 days ago
    # For now, we'll just document the expected behavior
    print("Note: This test requires a test account deleted more than 30 days ago")
    print("Expected behavior: Should return 400 with message about 30-day limit")

if __name__ == "__main__":
    print(f"Testing Restore User API at {BASE_URL}")
    print(f"Test email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_restore_user()
    test_restore_old_account()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60) 