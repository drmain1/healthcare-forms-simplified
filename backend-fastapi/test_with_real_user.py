#!/usr/bin/env python3
"""Test with a real authenticated user to see exact Firestore rules error."""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_with_auth_token():
    """Test form save with real authentication."""
    
    print("=" * 60)
    print("AUTHENTICATED FORM SAVE TEST")
    print("=" * 60)
    print()
    
    # Get token from user
    print("To test with real authentication, we need your Firebase ID token.")
    print("In the browser console (F12), run:")
    print()
    print("firebase.auth().currentUser.getIdToken().then(token => console.log(token))")
    print()
    token = input("Paste your token here (or press Enter to skip): ").strip()
    
    if not token:
        print("\nSkipping authenticated test.")
        return
        
    # Import Firebase Admin
    from services.auth import auth
    
    print("\n1. Verifying token...")
    try:
        decoded = auth.verify_id_token(token)
        user_uid = decoded['uid']
        user_email = decoded.get('email', 'Unknown')
        print(f"   ✓ Token valid for user: {user_email} (UID: {user_uid})")
    except Exception as e:
        print(f"   ✗ Token verification failed: {e}")
        return
        
    # Now test form save with this user
    from services.firestore import db
    
    print("\n2. Checking user's organization...")
    try:
        org_ref = db.collection('organizations').document(user_uid)
        org_doc = org_ref.get()
        
        if org_doc.exists:
            print("   ✓ Organization exists")
            org_data = org_doc.to_dict()
            print(f"   Organization name: {org_data.get('name', 'N/A')}")
        else:
            print("   ✗ No organization found for this user")
            print("   Creating one now...")
            
            org_data = {
                'uid': user_uid,
                'name': user_email,
                'email': user_email,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'settings': {
                    'hipaa_compliant': True,
                    'data_retention_days': 2555,
                    'timezone': 'UTC'
                }
            }
            org_ref.set(org_data)
            print("   ✓ Organization created")
    except Exception as e:
        print(f"   ✗ Organization check failed: {e}")
        
    print("\n3. Testing form save with Firestore rules...")
    
    # Test 1: Try with current field names (should fail)
    print("\n   Test A: Using current backend field names (title, surveyjs_schema)")
    try:
        form_dict = {
            'title': 'Test Form A',
            'description': 'Testing with current field names',
            'surveyjs_schema': {'pages': [{'elements': []}]},
            'organization_id': user_uid,
            'created_by': user_uid,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'updated_by': user_uid,
            'status': 'draft'
        }
        
        doc_ref = db.collection('forms').add(form_dict)
        print("   ✓ UNEXPECTED: Form saved with current field names!")
        print(f"   Document ID: {doc_ref[1].id}")
        # Clean up
        doc_ref[1].delete()
    except Exception as e:
        print(f"   ✗ Expected failure: {e}")
        
    # Test 2: Try with Firestore rules field names
    print("\n   Test B: Using Firestore rules field names (name, definition)")
    try:
        form_dict = {
            'name': 'Test Form B',
            'definition': {'pages': [{'elements': []}]},
            'organization_id': user_uid,
            'created_by': user_uid,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'updated_by': user_uid,
            'is_active': True
        }
        
        doc_ref = db.collection('forms').add(form_dict)
        print("   ✓ Form saved with Firestore field names!")
        print(f"   Document ID: {doc_ref[1].id}")
        # Clean up
        doc_ref[1].delete()
    except Exception as e:
        print(f"   ✗ Failed with Firestore field names: {e}")
        
    print("\n" + "=" * 60)
    print("CONCLUSION")
    print("=" * 60)
    print("\nThe issue is a mismatch between:")
    print("1. Backend models use: title, surveyjs_schema")
    print("2. Firestore rules expect: name, definition")
    print("\nWe need to update either:")
    print("- The backend to use 'name' and 'definition', OR")
    print("- The Firestore rules to accept 'title' and 'surveyjs_schema'")

if __name__ == "__main__":
    test_with_auth_token()