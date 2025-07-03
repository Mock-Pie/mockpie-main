"""
Test for deleting upcoming presentations API

This test verifies the soft delete functionality for upcoming presentations,
ensuring that presentations are properly marked as deleted and cannot be
accessed after deletion.
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Test configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test_delete_upcoming@example.com"
TEST_PASSWORD = "TestPass123!"

def test_delete_upcoming_presentation():
    """Test the delete upcoming presentation API endpoint"""
    
    print("=" * 60)
    print("TESTING DELETE UPCOMING PRESENTATION API")
    print("=" * 60)
    
    # Step 1: Register a test user
    print("\n1. Registering test user...")
    register_data = {
        "name": "Delete Test User",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    register_response = requests.post(f"{BASE_URL}/auth/register", data=register_data)
    print(f"Registration response: {register_response.status_code}")
    if register_response.status_code not in [200, 201, 409]:  # 409 if user already exists
        print(f"Registration failed: {register_response.text}")
        return False
    
    # Step 2: Login to get access token
    print("\n2. Logging in...")
    login_data = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print(f"Login response: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return False
    
    login_result = login_response.json()
    access_token = login_result.get("access_token")
    
    if not access_token:
        print("No access token received")
        return False
    
    headers = {"Authorization": f"Bearer {access_token}"}
    print("✓ Successfully logged in")
    
    # Step 3: Create an upcoming presentation
    print("\n3. Creating upcoming presentation...")
    
    # Create a future date for the presentation
    future_date = datetime.now() + timedelta(days=7)
    presentation_date = future_date.strftime("%Y-%m-%dT%H:%M:%S")
    
    create_data = {
        "topic": "Test Presentation for Deletion",
        "presentation_date": presentation_date
    }
    
    create_response = requests.post(
        f"{BASE_URL}/upcoming-presentations/",
        data=create_data,
        headers=headers
    )
    print(f"Create presentation response: {create_response.status_code}")
    
    if create_response.status_code not in [200, 201]:
        print(f"Failed to create presentation: {create_response.text}")
        return False
    
    create_result = create_response.json()
    presentation_id = create_result.get("upcoming_presentation", {}).get("id")
    
    if not presentation_id:
        print("No presentation ID received")
        print(f"Create result: {create_result}")
        return False
    
    print(f"✓ Successfully created presentation with ID: {presentation_id}")
    
    # Step 4: Verify the presentation exists in the list
    print("\n4. Verifying presentation exists...")
    
    list_response = requests.get(f"{BASE_URL}/upcoming-presentations/", headers=headers)
    print(f"List presentations response: {list_response.status_code}")
    
    if list_response.status_code != 200:
        print(f"Failed to list presentations: {list_response.text}")
        return False
    
    list_result = list_response.json()
    presentations = list_result.get("upcoming_presentations", [])
    
    # Find our created presentation
    found_presentation = None
    for p in presentations:
        if p["id"] == presentation_id:
            found_presentation = p
            break
    
    if not found_presentation:
        print(f"Created presentation not found in list. Available presentations: {presentations}")
        return False
    
    print(f"✓ Presentation found: {found_presentation['topic']}")
    
    # Step 5: Delete the upcoming presentation
    print("\n5. Deleting upcoming presentation...")
    
    delete_response = requests.delete(
        f"{BASE_URL}/upcoming-presentations/{presentation_id}",
        headers=headers
    )
    print(f"Delete response: {delete_response.status_code}")
    
    if delete_response.status_code != 200:
        print(f"Failed to delete presentation: {delete_response.text}")
        return False
    
    delete_result = delete_response.json()
    print(f"✓ Delete successful: {delete_result.get('message')}")
    
    # Step 6: Verify the presentation is no longer in the list (soft deleted)
    print("\n6. Verifying presentation is deleted...")
    
    list_after_delete_response = requests.get(f"{BASE_URL}/upcoming-presentations/", headers=headers)
    print(f"List after delete response: {list_after_delete_response.status_code}")
    
    if list_after_delete_response.status_code != 200:
        print(f"Failed to list presentations after delete: {list_after_delete_response.text}")
        return False
    
    list_after_result = list_after_delete_response.json()
    presentations_after = list_after_result.get("upcoming_presentations", [])
    
    # Verify our presentation is no longer in the list
    deleted_presentation = None
    for p in presentations_after:
        if p["id"] == presentation_id:
            deleted_presentation = p
            break
    
    if deleted_presentation:
        print(f"ERROR: Presentation still found after deletion: {deleted_presentation}")
        return False
    
    print("✓ Presentation successfully removed from list (soft deleted)")
    
    # Step 7: Try to delete the same presentation again (should fail)
    print("\n7. Testing deletion of already deleted presentation...")
    
    delete_again_response = requests.delete(
        f"{BASE_URL}/upcoming-presentations/{presentation_id}",
        headers=headers
    )
    print(f"Delete again response: {delete_again_response.status_code}")
    
    if delete_again_response.status_code != 404:
        print(f"Expected 404 for already deleted presentation, got: {delete_again_response.status_code}")
        print(f"Response: {delete_again_response.text}")
        return False
    
    print("✓ Correctly returned 404 for already deleted presentation")
    
    # Step 8: Test deleting non-existent presentation
    print("\n8. Testing deletion of non-existent presentation...")
    
    fake_id = 99999
    delete_fake_response = requests.delete(
        f"{BASE_URL}/upcoming-presentations/{fake_id}",
        headers=headers
    )
    print(f"Delete fake presentation response: {delete_fake_response.status_code}")
    
    if delete_fake_response.status_code != 404:
        print(f"Expected 404 for non-existent presentation, got: {delete_fake_response.status_code}")
        return False
    
    print("✓ Correctly returned 404 for non-existent presentation")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! ✓")
    print("Delete upcoming presentation API is working correctly")
    print("=" * 60)
    
    return True

def test_unauthorized_access():
    """Test that unauthorized users cannot delete presentations"""
    
    print("\n" + "=" * 60)
    print("TESTING UNAUTHORIZED ACCESS")
    print("=" * 60)
    
    # Try to delete without authentication
    print("\n1. Testing deletion without authentication...")
    delete_response = requests.delete(f"{BASE_URL}/upcoming-presentations/1")
    print(f"Delete without auth response: {delete_response.status_code}")
    
    if delete_response.status_code != 401:
        print(f"Expected 401 for unauthorized access, got: {delete_response.status_code}")
        return False
    
    print("✓ Correctly returned 401 for unauthorized access")
    
    # Try to delete with invalid token
    print("\n2. Testing deletion with invalid token...")
    invalid_headers = {"Authorization": "Bearer invalid_token"}
    delete_response = requests.delete(f"{BASE_URL}/upcoming-presentations/1", headers=invalid_headers)
    print(f"Delete with invalid token response: {delete_response.status_code}")
    
    if delete_response.status_code not in [401, 403]:
        print(f"Expected 401/403 for invalid token, got: {delete_response.status_code}")
        return False
    
    print("✓ Correctly rejected invalid token")
    
    print("\n✓ All unauthorized access tests passed!")
    return True

if __name__ == "__main__":
    print("Starting Delete Upcoming Presentation API Tests...")
    print(f"Testing against: {BASE_URL}")
    
    try:
        # Test the main functionality
        main_test_passed = test_delete_upcoming_presentation()
        
        # Test unauthorized access
        auth_test_passed = test_unauthorized_access()
        
        if main_test_passed and auth_test_passed:
            print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
            sys.exit(0)
        else:
            print("\n❌ SOME TESTS FAILED")
            sys.exit(1)
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {BASE_URL}")
        print("Make sure the backend server is running on localhost:8081")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        sys.exit(1)
