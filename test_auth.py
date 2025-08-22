#!/usr/bin/env python3
"""
Test script for the Deal Detector authentication system
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_endpoints():
    """Test the authentication endpoints"""
    print("🧪 Testing Deal Detector Authentication System")
    print("=" * 50)
    
    # Test 1: Check if server is running
    print("1. Testing server connectivity...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("   ✅ Server is running and accessible")
        else:
            print(f"   ❌ Server responded with status {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Server is not accessible: {e}")
        return
    
    # Test 2: Check OpenAPI schema
    print("\n2. Testing API schema...")
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            schema = response.json()
            print("   ✅ OpenAPI schema accessible")
            
            # Check if auth endpoints exist
            paths = schema.get("paths", {})
            auth_endpoints = [path for path in paths.keys() if "/auth/" in path]
            print(f"   📋 Auth endpoints found: {auth_endpoints}")
        else:
            print(f"   ❌ Schema not accessible: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error accessing schema: {e}")
    
    # Test 3: Test Google auth endpoint structure
    print("\n3. Testing Google auth endpoint...")
    try:
        # This should fail since we don't have a valid Google token,
        # but it should show us the endpoint is working
        response = requests.post(
            f"{BASE_URL}/auth/google",
            json={"id_token": "invalid_token_for_testing"},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 422:
            print("   ✅ Google auth endpoint is accessible (validation working)")
        elif response.status_code == 400:
            print("   ✅ Google auth endpoint is accessible (token validation working)")
        elif response.status_code == 401:
            print("   ✅ Google auth endpoint is working perfectly (token validation working)")
            print("      ℹ️  Correctly rejected invalid test token")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code}")
            print(f"      Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error testing Google auth: {e}")
    
    # Test 4: Test protected endpoint without token
    print("\n4. Testing protected endpoint without token...")
    try:
        response = requests.get(f"{BASE_URL}/auth/me")
        if response.status_code == 401 or response.status_code == 403:
            print("   ✅ Protected endpoint correctly requires authentication")
            print("      ℹ️  Properly secured - no access without valid token")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code}")
            print(f"      Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error testing protected endpoint: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication system test completed!")
    print("\nNext steps:")
    print("1. Test with a real Google ID token in the mobile app")
    print("2. Verify JWT token creation and validation")
    print("3. Test user creation in the database")
    print("4. Test Gmail connection flow")

if __name__ == "__main__":
    test_auth_endpoints()
