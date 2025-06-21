#!/usr/bin/env python3
"""
Test script for video upload API
"""
import requests
import sys
import os

# Configuration
BASE_URL = "http://localhost:8081"
TEST_EMAIL = "test@example.com"  # Change this to your test email
TEST_PASSWORD = "testpassword123"  # Change this to your test password

def test_login():
    """Test login and return access token"""
    print("🔐 Testing login...")
    
    login_data = {
        'email': TEST_EMAIL,
        'password': TEST_PASSWORD
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', data=login_data)
        response.raise_for_status()
        
        tokens = response.json()
        print("✅ Login successful!")
        print(f"Access token: {tokens['access_token'][:50]}...")
        return tokens['access_token']
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Login failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

def test_upload(access_token, video_file_path=None):
    """Test video upload"""
    print("📹 Testing video upload...")
    
    # Create a dummy video file if none provided
    if video_file_path is None or not os.path.exists(video_file_path):
        print("Creating dummy video file...")
        dummy_file = "test_video.txt"
        with open(dummy_file, 'w') as f:
            f.write("This is a test file pretending to be a video")
        video_file_path = dummy_file
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        with open(video_file_path, 'rb') as video_file:
            files = {'file': video_file}
            data = {'title': 'Test Upload Video'}
            
            response = requests.post(
                f'{BASE_URL}/presentations/upload',
                headers=headers,
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Upload successful!")
                print(f"Presentation ID: {result.get('presentation_id')}")
                print(f"Title: {result.get('title')}")
                print(f"File URL: {result.get('file_url')}")
                print(f"File size: {result.get('file_size')} bytes")
            else:
                print(f"❌ Upload failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
    
    # Clean up dummy file
    if video_file_path == "test_video.txt":
        os.remove(video_file_path)

def test_list_presentations(access_token):
    """Test listing user's presentations"""
    print("📋 Testing presentations list...")
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(f'{BASE_URL}/presentations/', headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("✅ List successful!")
        print(f"Total presentations: {result.get('total', 0)}")
        
        for video in result.get('videos', []):
            print(f"  - {video['title']} (ID: {video['id']})")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ List failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")

def main():
    print("🚀 Starting API tests...\n")
    
    # Test login
    access_token = test_login()
    if not access_token:
        print("❌ Cannot proceed without access token")
        return
    
    print()
    
    # Test upload
    video_file = sys.argv[1] if len(sys.argv) > 1 else None
    test_upload(access_token, video_file)
    
    print()
    
    # Test list
    test_list_presentations(access_token)
    
    print("\n🎉 Tests completed!")

if __name__ == "__main__":
    main()
