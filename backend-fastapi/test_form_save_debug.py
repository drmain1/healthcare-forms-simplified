#!/usr/bin/env python3
"""Debug form saving to identify exact error."""

import os
import sys
from pathlib import Path
from datetime import datetime
from pprint import pprint

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_form_save_directly():
    """Test form saving directly using the backend code."""
    
    print("=" * 60)
    print("DIRECT FORM SAVE TEST")
    print("=" * 60)
    print()
    
    # Import backend modules
    from services.firestore import db
    from models.form import FormCreate
    
    # Create a test user dict (simulating authenticated user)
    test_user = {
        "uid": "test-user-123",
        "email": "test@example.com"
    }
    
    # Create form data matching what frontend sends
    form_data = {
        "title": "Test Form Direct Save",
        "description": "Testing direct save to Firestore",
        "surveyjs_schema": {
            "title": "Test Survey",
            "pages": [{
                "name": "page1",
                "elements": [{
                    "type": "text",
                    "name": "test_field",
                    "title": "Test Field"
                }]
            }]
        },
        "status": "draft",
        "contains_phi": True,
        "encryption_required": True
    }
    
    print("1. Testing FormCreate model validation...")
    try:
        form_create = FormCreate(**form_data)
        print("   ✓ Form data validates correctly")
        print(f"   Fields: {list(form_create.model_dump().keys())}")
    except Exception as e:
        print(f"   ✗ Validation failed: {e}")
        return
        
    print()
    print("2. Checking/creating organization...")
    try:
        org_ref = db.collection('organizations').document(test_user['uid'])
        org_doc = org_ref.get()
        
        if not org_doc.exists:
            print("   Creating organization...")
            org_data = {
                'uid': test_user['uid'],
                'name': test_user.get("email", "Test Organization"),
                'email': test_user.get("email", ""),
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
        else:
            print("   ✓ Organization exists")
    except Exception as e:
        print(f"   ✗ Organization check failed: {e}")
        return
        
    print()
    print("3. Attempting to save form...")
    try:
        # Prepare form data for Firestore
        form_dict = form_create.model_dump(exclude_unset=True, exclude={'category'})
        form_dict['organization_id'] = test_user['uid']
        form_dict['created_by'] = test_user['uid']
        form_dict['created_at'] = datetime.utcnow()
        form_dict['updated_at'] = datetime.utcnow()
        form_dict['updated_by'] = test_user['uid']
        
        print("   Form data to save:")
        for key, value in form_dict.items():
            if key == 'surveyjs_schema':
                print(f"     {key}: <survey definition>")
            else:
                print(f"     {key}: {value}")
        
        # Save to Firestore
        doc_ref = db.collection('forms').add(form_dict)
        print(f"   ✓ Form saved successfully!")
        print(f"   Document ID: {doc_ref[1].id}")
        
        # Try to read it back
        print()
        print("4. Reading form back...")
        saved_form = doc_ref[1].get()
        if saved_form.exists:
            print("   ✓ Form retrieved successfully")
            data = saved_form.to_dict()
            print(f"   Fields in saved form: {list(data.keys())}")
        else:
            print("   ✗ Could not read form back")
            
    except Exception as e:
        print(f"   ✗ Form save failed: {type(e).__name__}: {e}")
        import traceback
        print()
        print("   Full traceback:")
        traceback.print_exc()
        
    print()
    print("=" * 60)
    print("CHECKING FIRESTORE RULES REQUIREMENTS")
    print("=" * 60)
    
    print("\nFrom firestore.rules, forms need:")
    print("- organization_id (must equal user UID)")
    print("- created_by (must equal user UID)")
    print("- created_at (must be current time)")
    print("- name (REQUIRED by rules)")
    print("- definition (REQUIRED by rules)")
    
    print("\nCurrent backend sends:")
    print("- title (NOT 'name')")
    print("- surveyjs_schema (NOT 'definition')")
    print("\nThis is likely the issue!")

if __name__ == "__main__":
    test_form_save_directly()