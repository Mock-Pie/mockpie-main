#!/usr/bin/env python3
"""
Test script for the OTP-based restore user API endpoints
This script tests the restore account flow with OTP verification
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test@example.com"

def test_send_restore_otp():
    """Test sending OTP for account restoration"""
    print("=" * 60)
    print("TESTING RESTORE ACCOUNT OTP FLOW")
    print("=" * 60)
    
    # Test 1: Send OTP for account restoration
    print("\n1. Testing send restore account OTP...")
    otp_data = {
        "email": TEST_EMAIL
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/restore-account-otp",
            data=otp_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: OTP sent successfully!")
            print(f"Message: {result.get('message')}")
        else:
            print("❌ FAILED: Could not send OTP")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
    
    # Test 2: Try to send OTP for non-existent deleted account
    print("\n2. Testing send OTP for non-existent deleted account...")
    invalid_data = {
        "email": "nonexistent@example.com"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/restore-account-otp",
            data=invalid_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: Correctly rejected non-existent deleted account")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 404 for non-existent account")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")

def test_restore_with_otp():
    """Test restoring account with OTP verification"""
    print("\n3. Testing restore account with OTP...")
    
    # This would require a valid OTP that was sent in the previous step
    # For testing purposes, we'll show the expected format
    restore_data = {
        "email": TEST_EMAIL,
        "otp": "123456"  # This would be the actual OTP received via email
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=restore_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ SUCCESS: Account restored successfully!")
            print(f"User ID: {user_data.get('id')}")
            print(f"Email: {user_data.get('email')}")
            print(f"Username: {user_data.get('username')}")
        elif response.status_code == 400:
            print("❌ FAILED: Invalid OTP or expired")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 200 or 400")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")

def test_restore_without_otp():
    """Test restoring account without OTP (should fail)"""
    print("\n4. Testing restore account without OTP...")
    
    restore_data = {
        "email": TEST_EMAIL
        # Missing OTP parameter
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=restore_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print("✅ SUCCESS: Correctly rejected request without OTP")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 422 for missing OTP")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")

def test_restore_with_invalid_otp():
    """Test restoring account with invalid OTP"""
    print("\n5. Testing restore account with invalid OTP...")
    
    restore_data = {
        "email": TEST_EMAIL,
        "otp": "000000"  # Invalid OTP
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=restore_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ SUCCESS: Correctly rejected invalid OTP")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
        else:
            print("❌ UNEXPECTED: Should have returned 400 for invalid OTP")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")

if __name__ == "__main__":
    print(f"Testing OTP-based Restore User API at {BASE_URL}")
    print(f"Test email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_send_restore_otp()
    test_restore_with_otp()
    test_restore_without_otp()
    test_restore_with_invalid_otp()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)
    print("\nNote: To test the complete flow:")
    print("1. First run test_send_restore_otp() to get an OTP")
    print("2. Check the email for the OTP code")
    print("3. Use that OTP in test_restore_with_otp()") 