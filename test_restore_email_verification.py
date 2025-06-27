#!/usr/bin/env python3
"""
Test script to verify email verification is maintained during account restoration
This script tests the complete flow: delete account -> restore account -> login
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def test_complete_restore_flow():
    """Test the complete restore account flow with email verification"""
    print("=" * 60)
    print("TESTING COMPLETE RESTORE ACCOUNT FLOW")
    print("=" * 60)
    
    # Step 1: Create a test account (if needed)
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
            user_data = response.json()
            print(f"User ID: {user_data.get('user', {}).get('id')}")
        elif response.status_code == 400:
            print("ℹ️  Account already exists, proceeding...")
        else:
            print(f"❌ FAILED: Could not create account - {response.status_code}")
            return
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return
    
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
            print("✅ SUCCESS: Login successful")
            print(f"Access token: {access_token[:20]}...")
        else:
            print(f"❌ FAILED: Login failed - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            return
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return
    
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
            return
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return
    
    # Step 4: Send restore OTP
    print("\n4. Sending restore account OTP...")
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
            return
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return
    
    # Step 5: Wait for user to provide OTP
    print("\n5. Waiting for OTP input...")
    print("Please check your email and enter the OTP code:")
    otp_code = input("Enter 6-digit OTP: ").strip()
    
    if not otp_code or len(otp_code) != 6:
        print("❌ Invalid OTP format")
        return
    
    # Step 6: Restore account with OTP
    print("\n6. Restoring account with OTP...")
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
        else:
            print(f"❌ FAILED: Could not restore account - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            return
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return
    
    # Step 7: Try to login with restored account
    print("\n7. Testing login with restored account...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            login_result = response.json()
            print("✅ SUCCESS: Login successful after restoration!")
            print("Email verification is working correctly!")
            print(f"User: {login_result.get('user', {}).get('email')}")
        else:
            print(f"❌ FAILED: Login failed after restoration - {response.status_code}")
            error_data = response.json()
            print(f"Error: {error_data.get('detail', 'Unknown error')}")
            
            if "email not verified" in error_data.get('detail', '').lower():
                print("❌ ISSUE: Email verification was lost during restoration")
            else:
                print("❌ ISSUE: Unknown login problem after restoration")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_email_verification_preservation():
    """Test that email verification status is preserved during OTP setting"""
    print("\n" + "=" * 60)
    print("TESTING EMAIL VERIFICATION PRESERVATION")
    print("=" * 60)
    
    # This test would require database access to verify the email_verified_at field
    # For now, we'll document the expected behavior
    print("\nExpected behavior:")
    print("1. When sending restore OTP, email_verified_at should NOT be cleared")
    print("2. When restoring account, email_verified_at should be preserved")
    print("3. User should be able to login immediately after restoration")
    print("4. No 'Email address not verified' error should occur")

if __name__ == "__main__":
    print(f"Testing Email Verification in Restore Account Flow")
    print(f"Test email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_complete_restore_flow()
    test_email_verification_preservation()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60) 