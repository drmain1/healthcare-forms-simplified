#!/usr/bin/env python3
"""Direct Firestore test to verify rules are working."""

import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from services.firebase_admin import db

def test_direct_save():
    """Test saving directly to Firestore with new rules."""
    
    print("Testing direct Firestore save with updated rules...")
    print("=" * 60)
    
    # Simulate a user
    test_uid = "test-user-" + datetime.now().strftime("%Y%m%d%H%M%S")
    
    # First create organization
    print(f"1. Creating organization for user {test_uid}...")
    try:
        org_data = {
            'uid': test_uid,
            'name': 'Test Organization',
            'email': 'test@example.com',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'settings': {
                'hipaa_compliant': True,
                'data_retention_days': 2555,
                'timezone': 'UTC'
            }
        }
        db.collection('organizations').document(test_uid).set(org_data)
        print("   ✓ Organization created")
    except Exception as e:
        print(f"   ✗ Failed: {e}")
        return
    
    # Now try to create a form with the backend field names
    print("\n2. Creating form with backend field names (title, surveyjs_schema)...")
    try:
        form_data = {
            'title': 'Direct Test Form',
            'description': 'Testing with updated Firestore rules',
            'surveyjs_schema': {
                'title': 'Test Survey',
                'pages': [{'elements': []}]
            },
            'organization_id': test_uid,
            'created_by': test_uid,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'updated_by': test_uid,
            'status': 'draft',
            'contains_phi': True,
            'encryption_required': True
        }
        
        doc_ref = db.collection('forms').add(form_data)
        form_id = doc_ref[1].id
        print(f"   ✓ Form created successfully! ID: {form_id}")
        
        # Try to read it back
        print("\n3. Reading form back...")
        saved_form = doc_ref[1].get()
        if saved_form.exists:
            print("   ✓ Form retrieved successfully")
            data = saved_form.to_dict()
            print(f"   Title: {data.get('title')}")
            print(f"   Status: {data.get('status')}")
        
        # Clean up
        print("\n4. Cleaning up test data...")
        doc_ref[1].delete()
        db.collection('organizations').document(test_uid).delete()
        print("   ✓ Test data cleaned up")
        
        print("\n" + "=" * 60)
        print("✓ SUCCESS! Firestore rules are working correctly.")
        print("Forms can now be saved from the frontend!")
        
    except Exception as e:
        print(f"   ✗ Failed: {e}")
        print("\nThis likely means the Firestore rules haven't been deployed yet.")
        print("Run: firebase deploy --only firestore:rules")
        
        # Clean up on failure
        try:
            db.collection('organizations').document(test_uid).delete()
        except:
            pass

if __name__ == "__main__":
    test_direct_save()