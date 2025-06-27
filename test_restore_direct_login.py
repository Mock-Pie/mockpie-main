#!/usr/bin/env python3
"""
Test script to verify direct login after account restoration with email verification
This script tests the complete flow and verifies email verification status
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_direct_login_after_restoration():
    """Test that users can login directly after account restoration"""
    print("=" * 60)
    print("TESTING DIRECT LOGIN AFTER ACCOUNT RESTORATION")
    print("=" * 60)
    
    print(f"\nTest Configuration:")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Create test account
    print("\n1. Creating test account...")
    create_account_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": TEST_EMAIL,
        "username": "testuser",
        "phone_number": "+1234567890",
        "password": TEST_PASSWORD,
        "password_confirmation": TEST_PASSWORD,
        "gender": "male"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            data=create_account_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 201:
            print("✅ SUCCESS: Test account created")
        elif response.status_code == 400:
            print("ℹ️  Account already exists, proceeding...")
        else:
            print(f"❌ FAILED: Could not create account - {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Step 2: Login to get access token
    print("\n2. Logging in to get access token...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            login_result = response.json()
            access_token = login_result.get('access_token')
            print("✅ SUCCESS: Initial login successful")
            print(f"Access token: {access_token[:20]}...")
        else:
            print(f"❌ FAILED: Initial login failed - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Step 3: Delete the account
    print("\n3. Deleting the account...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.delete(
            f"{BASE_URL}/users/",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ SUCCESS: Account deleted")
        else:
            print(f"❌ FAILED: Could not delete account - {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Step 4: Verify account is deleted (try to login)
    print("\n4. Verifying account is deleted...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 403:
            print("✅ SUCCESS: Account is properly deleted (login blocked)")
        else:
            print(f"⚠️  WARNING: Account might not be properly deleted - {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Step 5: Send restore OTP
    print("\n5. Sending restore account OTP...")
    otp_data = {
        "email": TEST_EMAIL
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/restore-account-otp",
            data=otp_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            print("✅ SUCCESS: OTP sent successfully")
            print("Please check your email for the OTP code")
        else:
            print(f"❌ FAILED: Could not send OTP - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Step 6: Wait for user to provide OTP
    print("\n6. Waiting for OTP input...")
    print("Please check your email and enter the OTP code:")
    otp_code = input("Enter 6-digit OTP: ").strip()
    
    if not otp_code or len(otp_code) != 6:
        print("❌ Invalid OTP format")
        return False
    
    # Step 7: Restore account with OTP
    print("\n7. Restoring account with OTP...")
    restore_data = {
        "email": TEST_EMAIL,
        "otp": otp_code
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/retrieve",
            data=restore_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ SUCCESS: Account restored successfully!")
            print(f"User ID: {user_data.get('id')}")
            print(f"Email: {user_data.get('email')}")
            print(f"Email verified at: {user_data.get('email_verified_at')}")
            
            # Verify email_verified_at is set
            if user_data.get('email_verified_at'):
                print("✅ SUCCESS: Email verification status is properly set")
            else:
                print("❌ FAILED: Email verification status is not set")
                return False
        else:
            print(f"❌ FAILED: Could not restore account - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Step 8: Test direct login after restoration
    print("\n8. Testing direct login after restoration...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            login_result = response.json()
            print("✅ SUCCESS: Direct login successful after restoration!")
            print("✅ SUCCESS: Email verification is working correctly!")
            print(f"User: {login_result.get('user', {}).get('email')}")
            print(f"Access token: {login_result.get('access_token', '')[:20]}...")
            return True
        else:
            print(f"❌ FAILED: Direct login failed after restoration - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            
            if "email not verified" in error_data.get('detail', '').lower():
                print("❌ ISSUE: Email verification was not properly set during restoration")
            else:
                print("❌ ISSUE: Unknown login problem after restoration")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_email_verification_logic():
    """Test the email verification logic"""
    print("\n" + "=" * 60)
    print("EMAIL VERIFICATION LOGIC TEST")
    print("=" * 60)
    
    print("\nExpected Behavior:")
    print("1. When account is restored with valid OTP:")
    print("   - email_verified_at should be set to current timestamp")
    print("   - User should be able to login immediately")
    print("   - No additional email verification should be required")
    
    print("\n2. Security aspects:")
    print("   - OTP verification proves email access")
    print("   - Setting email_verified_at is secure after OTP verification")
    print("   - User can login directly without additional steps")

if __name__ == "__main__":
    print("Testing Direct Login After Account Restoration")
    print("This test verifies that users can login immediately after account restoration")
    print("with proper email verification status.")
    
    success = test_direct_login_after_restoration()
    test_email_verification_logic()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ ALL TESTS PASSED: Direct login after restoration is working correctly!")
    else:
        print("❌ TESTS FAILED: There are issues with direct login after restoration")
    print("=" * 60) 