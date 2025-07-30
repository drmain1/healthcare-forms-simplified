#!/usr/bin/env python3
"""Test Firestore connection and credentials setup."""

import os
import sys
from pathlib import Path
from datetime import datetime

def test_firestore_connection():
    """Test the Firestore connection with current configuration."""
    
    print("=" * 60)
    print("FIRESTORE CONNECTION TEST")
    print("=" * 60)
    print()
    
    # Check for credentials file
    cred_path = Path(__file__).parent / "healthcare-forms-v2-credentials.json"
    print(f"1. Checking for credentials file...")
    print(f"   Looking at: {cred_path}")
    
    if cred_path.exists():
        print("   ✓ Credentials file found!")
    else:
        print("   ✗ Credentials file NOT found!")
        print()
        print("   To fix this:")
        print("   1. Go to Google Cloud Console")
        print("   2. Select project: healthcare-forms-v2")
        print("   3. Go to IAM & Admin > Service Accounts")
        print("   4. Create a service account or use existing one")
        print("   5. Create a JSON key and download it")
        print("   6. Save it as: healthcare-forms-v2-credentials.json")
        print("   7. Place it in the backend-fastapi directory")
        print()
        
    # Check environment variable
    print("2. Checking GOOGLE_APPLICATION_CREDENTIALS env var...")
    env_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if env_creds:
        print(f"   Current value: {env_creds}")
        if os.path.exists(env_creds):
            print("   ✓ File exists at this path")
        else:
            print("   ✗ File does NOT exist at this path")
    else:
        print("   ✗ Not set")
    
    print()
    print("3. Testing Firestore connection...")
    
    try:
        # Set credentials path if file exists
        if cred_path.exists():
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(cred_path)
            
        from google.cloud import firestore
        
        # Initialize client
        db = firestore.Client(project='healthcare-forms-v2')
        print("   ✓ Firestore client initialized!")
        
        # Try to read a collection (this will fail if no permissions)
        print()
        print("4. Testing read access...")
        try:
            # Just try to get the organizations collection reference
            orgs_ref = db.collection('organizations')
            # Try to get one document
            docs = orgs_ref.limit(1).get()
            print("   ✓ Successfully connected to Firestore!")
            print(f"   Found {len(list(docs))} organization(s)")
        except Exception as e:
            print(f"   ⚠ Connected but read failed: {str(e)}")
            print("   This might be normal if no data exists yet")
            
        # Test write access by creating a test document
        print()
        print("5. Testing write access...")
        try:
            test_ref = db.collection('_test_connection').document('test')
            test_ref.set({
                'timestamp': datetime.utcnow(),
                'test': True
            })
            print("   ✓ Write test successful!")
            
            # Clean up
            test_ref.delete()
            print("   ✓ Cleanup successful!")
        except Exception as e:
            print(f"   ✗ Write test failed: {str(e)}")
            
    except Exception as e:
        print(f"   ✗ Failed to connect: {str(e)}")
        print()
        print("   Common issues:")
        print("   - Missing credentials file")
        print("   - Invalid project ID")
        print("   - Firestore not enabled in GCP project")
        print("   - Service account lacks necessary permissions")
        
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if cred_path.exists():
        print("✓ Credentials file is in place")
    else:
        print("✗ Need to add credentials file")
        
    print()
    print("Next steps:")
    print("1. Ensure credentials file is in place")
    print("2. Run this test again to verify connection")
    print("3. Then we can fix the field mapping issues")

if __name__ == "__main__":
    test_firestore_connection()