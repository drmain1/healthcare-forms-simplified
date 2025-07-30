#!/usr/bin/env python3
"""Test the API directly to see exact error."""

import requests
import json

# Test without auth first to see raw error
print("Testing form creation endpoint...")
print("=" * 60)

# Test data matching what frontend sends
test_data = {
    "title": "Direct API Test",
    "description": "",
    "surveyjs_schema": {},
    "status": "draft",
    "contains_phi": True,
    "encryption_required": True,
    "allow_anonymous": False,
    "require_authentication": True,
    "auto_save": True,
    "allow_partial_submission": True
}

# Test 1: Without auth
print("\n1. Testing without authentication...")
response = requests.post(
    "http://localhost:8000/api/v1/forms/",
    json=test_data,
    headers={"Content-Type": "application/json"}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}...")

# Test 2: With fake auth token
print("\n2. Testing with invalid auth token...")
response = requests.post(
    "http://localhost:8000/api/v1/forms/",
    json=test_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-token"
    }
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}...")

# Test 3: Check if it's a field validation issue
print("\n3. Testing minimal data...")
minimal_data = {
    "title": "Minimal Test",
    "surveyjs_schema": {"pages": []}
}
response = requests.post(
    "http://localhost:8000/api/v1/forms/",
    json=minimal_data,
    headers={"Content-Type": "application/json"}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}...")