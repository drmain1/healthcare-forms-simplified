#!/usr/bin/env python3
"""
Script to set up initial user documents for existing Firebase Auth users.
This ensures users have proper organization associations for multi-tenant access.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / "backend-fastapi"))

from google.cloud import firestore
from firebase_admin import auth, credentials, initialize_app

# Initialize Firebase Admin
cred_path = Path(__file__).parent.parent / "backend-fastapi" / "healthcare-forms-v2-credentials.json"
if cred_path.exists():
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(cred_path)
    cred = credentials.Certificate(str(cred_path))
    initialize_app(cred)
else:
    print("Error: Service account credentials not found")
    sys.exit(1)

# Initialize Firestore
db = firestore.Client(project='healthcare-forms-v2')

def setup_users():
    """Create user documents for existing Firebase Auth users."""
    
    print("Setting up user documents...")
    
    # Get all organizations
    orgs = list(db.collection('organizations').stream())
    if not orgs:
        print("No organizations found. Creating default organization...")
        
        # Create default organization
        org_data = {
            'name': 'Default Healthcare Organization',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'settings': {
                'hipaa_compliant': True,
                'data_retention_days': 2555  # 7 years for HIPAA
            }
        }
        org_ref = db.collection('organizations').add(org_data)
        org_id = org_ref[1].id
        print(f"Created organization: {org_id}")
    else:
        # Use first organization as default
        org_id = orgs[0].id
        print(f"Using existing organization: {org_id}")
    
    # List all Firebase Auth users
    page = auth.list_users()
    user_count = 0
    
    while page:
        for user in page.users:
            # Check if user document already exists
            user_doc = db.collection('users').document(user.uid).get()
            
            if not user_doc.exists:
                # Create user document
                user_data = {
                    'uid': user.uid,
                    'email': user.email,
                    'display_name': user.display_name or user.email,
                    'organization_id': org_id,
                    'role': 'admin' if user_count == 0 else 'user',  # First user is admin
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'last_login': None,
                    'is_active': True
                }
                
                db.collection('users').document(user.uid).set(user_data)
                print(f"Created user document for: {user.email} (role: {user_data['role']})")
                user_count += 1
            else:
                # Update existing user document to ensure organization_id exists
                existing_data = user_doc.to_dict()
                if 'organization_id' not in existing_data:
                    db.collection('users').document(user.uid).update({
                        'organization_id': org_id,
                        'updated_at': datetime.utcnow()
                    })
                    print(f"Updated user document for: {user.email}")
        
        # Get next page
        page = page.get_next_page()
    
    print(f"\nProcessed {user_count} users")
    
    # Update organization owner if needed
    if orgs and user_count > 0:
        first_user = list(db.collection('users').where('role', '==', 'admin').limit(1).stream())
        if first_user:
            db.collection('organizations').document(org_id).update({
                'owner_uid': first_user[0].id,
                'updated_at': datetime.utcnow()
            })
            print(f"Set organization owner to: {first_user[0].to_dict()['email']}")

def verify_setup():
    """Verify the setup is correct."""
    print("\nVerifying setup...")
    
    # Check users
    users = list(db.collection('users').stream())
    print(f"Total users in Firestore: {len(users)}")
    
    for user in users:
        data = user.to_dict()
        print(f"- {data['email']}: org={data.get('organization_id', 'MISSING')}, role={data.get('role', 'MISSING')}")
    
    # Check organizations
    orgs = list(db.collection('organizations').stream())
    print(f"\nTotal organizations: {len(orgs)}")
    
    for org in orgs:
        data = org.to_dict()
        print(f"- {org.id}: {data['name']}")

if __name__ == "__main__":
    setup_users()
    verify_setup()
    print("\nSetup complete!")