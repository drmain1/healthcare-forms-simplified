#!/usr/bin/env python3
"""Test form saving after updating Firestore rules."""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Test form data matching frontend structure
test_form = {
    "title": "Post-Fix Test Form",
    "description": "Testing form save after Firestore rules update",
    "surveyjs_schema": {
        "title": "Patient Information Form",
        "pages": [
            {
                "name": "page1",
                "elements": [
                    {
                        "type": "text",
                        "name": "patient_name",
                        "title": "Patient Name",
                        "isRequired": True
                    },
                    {
                        "type": "text",
                        "name": "dob",
                        "title": "Date of Birth",
                        "inputType": "date",
                        "isRequired": True
                    }
                ]
            }
        ]
    },
    "status": "draft",
    "contains_phi": True,
    "encryption_required": True,
    "allow_anonymous": False,
    "require_authentication": True,
    "auto_save": True,
    "allow_partial_submission": True
}

def test_form_save(auth_token):
    """Test form save with authentication."""
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    print("Testing form creation with updated Firestore rules...")
    print("-" * 60)
    
    response = requests.post(
        f"{API_BASE_URL}/forms/",
        headers=headers,
        json=test_form
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200 or response.status_code == 201:
        form_data = response.json()
        print("✓ SUCCESS! Form created successfully")
        print(f"Form ID: {form_data.get('id', 'N/A')}")
        print(f"Title: {form_data.get('title', 'N/A')}")
        print(f"Organization ID: {form_data.get('organization_id', 'N/A')}")
        return form_data.get('id')
    else:
        print("✗ FAILED to create form")
        print(f"Response: {response.text}")
        try:
            error_detail = response.json()
            print(f"Error detail: {json.dumps(error_detail, indent=2)}")
        except:
            pass
        return None

def main():
    print("=" * 60)
    print("FORM SAVE TEST - AFTER FIRESTORE RULES FIX")
    print("=" * 60)
    print()
    
    print("To test, you need your Firebase ID token.")
    print("In the browser console (F12), run:")
    print()
    print("firebase.auth().currentUser.getIdToken().then(token => console.log(token))")
    print()
    
    auth_token = input("Paste your token here: ").strip()
    
    if not auth_token:
        print("No token provided. Exiting.")
        return
    
    print()
    form_id = test_form_save(auth_token)
    
    if form_id:
        print("\n✓ Form saving is now working!")
        print("\nYou can now:")
        print("1. Create forms in the UI")
        print("2. Edit existing forms")
        print("3. Save form responses")
    else:
        print("\n✗ Form saving still failing")
        print("\nTroubleshooting:")
        print("1. Check if backend server is running")
        print("2. Verify Firebase authentication is working")
        print("3. Check backend logs for detailed error")

if __name__ == "__main__":
    main()