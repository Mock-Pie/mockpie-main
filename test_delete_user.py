#!/usr/bin/env python3
"""
Test script for delete user endpoint
This script tests the DELETE /users/ endpoint
"""

import requests
import json

def test_delete_user_endpoint():
    """Test the delete user endpoint"""
    
    # Backend URL
    base_url = "http://localhost:8081"
    endpoint = f"{base_url}/users/"
    
    print("Testing Delete User endpoint...")
    print(f"Endpoint: {endpoint}")
    print("-" * 50)
    
    # You'll need to provide a valid access token for testing
    # This should be obtained from a successful login
    access_token = input("Enter a valid access token for testing (or press Enter to skip): ").strip()
    
    if not access_token:
        print("❌ No access token provided. Skipping test.")
        print("\nTo get an access token:")
        print("1. Login to the application")
        print("2. Check localStorage for 'access_token'")
        print("3. Use that token for testing")
        return
    
    try:
        # Make the DELETE request
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.delete(endpoint, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response:")
            print(json.dumps(data, indent=2))
            print("\n⚠️  WARNING: User has been deleted!")
        elif response.status_code == 401:
            print("❌ Unauthorized: Invalid or expired token")
        elif response.status_code == 404:
            print("❌ Not Found: User not found or already deleted")
        else:
            print("❌ Error! Response:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on http://localhost:8081")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_backend_health():
    """Test if the backend is running"""
    
    try:
        response = requests.get("http://localhost:8081/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print("❌ Backend health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running")
        return False

if __name__ == "__main__":
    print("Delete User Test Script")
    print("=" * 50)
    
    # First check if backend is running
    if test_backend_health():
        test_delete_user_endpoint()
    else:
        print("\nTo start the backend server:")
        print("cd backend")
        print("uvicorn app.main:app --reload") 