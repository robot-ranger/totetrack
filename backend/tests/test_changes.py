#!/usr/bin/env python3
"""
Test script to verify that all users can see all totes
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def login(email, password):
    """Login and get access token"""
    response = requests.post(f"{BASE_URL}/auth/token", data={
        "username": email,
        "password": password
    })
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        print(f"Failed to login as {email}: {response.status_code} - {response.text}")
        return None

def get_totes(headers):
    """Get all totes for the authenticated user"""
    response = requests.get(f"{BASE_URL}/totes", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get totes: {response.status_code} - {response.text}")
        return []

def main():
    print("Testing tote visibility changes...")
    print("=" * 50)
    
    # Test users
    users = [
        ("admin@example.com", "password"),
        ("theodore.weerts@gmail.com", "password")
    ]
    
    for email, password in users:
        print(f"\nTesting user: {email}")
        print("-" * 30)
        
        # Login
        headers = login(email, password)
        if not headers:
            continue
            
        # Get totes
        totes = get_totes(headers)
        print(f"Found {len(totes)} totes:")
        
        for tote in totes:
            print(f"  - {tote['name']} (ID: {tote['id']}, Location: {tote.get('location', 'N/A')})")
            print(f"    Owner ID: {tote.get('user_id', 'N/A')}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    main()