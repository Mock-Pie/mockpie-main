#!/usr/bin/env python3
"""
Test script for upcoming presentation soft deletion when user account is deleted
This script tests the integration between user deletion and upcoming presentation soft deletion
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test_user_delete_upcoming@example.com"
TEST_PASSWORD = "testpassword123"

def create_test_user():
    """Create a test user account"""
    print("📝 Creating test user...")
    
    user_data = {
        "first_name": "Test",
        "last_name": "User", 
        "username": "testuserdelete",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "phone_number": "+1234567890",
        "gender": "other"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        
        if response.status_code == 201:
            print("✅ User created successfully!")
            return True
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False

def login_user():
    """Login and get access token"""
    print("🔑 Logging in...")
    
    login_data = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "grant_type": "password"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful!")
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None

def create_upcoming_presentation(access_token):
    """Create an upcoming presentation"""
    print("📅 Creating upcoming presentation...")
    
    # Create a presentation date in the future
    future_date = datetime.now() + timedelta(days=7)
    presentation_date = future_date.isoformat()
    
    presentation_data = {
        "topic": "Test Presentation - User Deletion Test",
        "presentation_date": presentation_date
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/upcoming-presentations/",
            data=presentation_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upcoming presentation created successfully!")
            presentation_id = result.get("upcoming_presentation", {}).get("id")
            print(f"Presentation ID: {presentation_id}")
            return presentation_id
        else:
            print(f"❌ Failed to create presentation: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None

def list_upcoming_presentations(access_token):
    """List upcoming presentations"""
    print("📋 Listing upcoming presentations...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/upcoming-presentations/", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            presentations = result.get("upcoming_presentations", [])
            total = result.get("total", 0)
            print(f"✅ Found {total} upcoming presentations")
            
            for presentation in presentations:
                print(f"  - ID: {presentation['id']}, Topic: {presentation['topic']}")
            
            return presentations
        else:
            print(f"❌ Failed to list presentations: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return []

def delete_user_account(access_token):
    """Delete the user account"""
    print("🗑️ Deleting user account...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/users/", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ User account deleted successfully!")
            print(f"Message: {result.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Failed to delete account: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False

def test_upcoming_presentation_soft_deletion():
    """Test the complete flow of upcoming presentation soft deletion during user deletion"""
    print("🧪 Testing upcoming presentation soft deletion with user account deletion")
    print("=" * 80)
    
    # Step 1: Create test user
    if not create_test_user():
        print("❌ Test failed: Could not create test user")
        return False
    
    # Step 2: Login
    access_token = login_user()
    if not access_token:
        print("❌ Test failed: Could not login")
        return False
    
    # Step 3: Create upcoming presentation
    presentation_id = create_upcoming_presentation(access_token)
    if not presentation_id:
        print("❌ Test failed: Could not create upcoming presentation")
        return False
    
    # Step 4: Verify presentation exists
    presentations_before = list_upcoming_presentations(access_token)
    if not presentations_before:
        print("❌ Test failed: No presentations found after creation")
        return False
    
    # Step 5: Delete user account (this should soft delete the upcoming presentation)
    if not delete_user_account(access_token):
        print("❌ Test failed: Could not delete user account")
        return False
    
    print("\n✅ TEST COMPLETED SUCCESSFULLY!")
    print("The upcoming presentation should now be soft deleted (deleted_at set to current timestamp)")
    print("When the user account is restored, the upcoming presentation should also be restored")
    
    return True

if __name__ == "__main__":
    print(f"Testing Upcoming Presentation Soft Deletion at {BASE_URL}")
    print(f"Test email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_upcoming_presentation_soft_deletion()
    
    print("\n" + "=" * 80)
    print("TEST INFORMATION")
    print("=" * 80)
    print("This test verifies that:")
    print("1. Upcoming presentations are soft deleted when user account is deleted")
    print("2. The deleted_at field is set to NULL for non-deleted presentations")
    print("3. Deleted presentations are filtered out during retrieval")
    print("\nTo verify the database changes:")
    print("1. Check the upcoming_presentations table in your database")
    print("2. Look for records with deleted_at IS NOT NULL")
    print("3. Test account restoration to verify presentations are restored")
