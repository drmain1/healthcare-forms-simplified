#!/usr/bin/env python3
"""
Test script to directly query Firestore and check form_responses collection
"""

from google.cloud import firestore
import os
import json
from datetime import datetime, timedelta

# Set up credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'backend-go/healthcare-forms-v2-firebase-adminsdk.json'

# Initialize Firestore client
db = firestore.Client(project='healthcare-forms-v2')

print("=== Checking form_responses collection ===\n")

# Get recent form responses
responses_ref = db.collection('form_responses')
recent_responses = responses_ref.order_by('submitted_at', direction=firestore.Query.DESCENDING).limit(5).get()

print(f"Found {len(recent_responses)} recent responses:\n")

for doc in recent_responses:
    data = doc.to_dict()
    print(f"ID: {doc.id}")
    print(f"  Organization: {data.get('organization', 'NOT SET')}")
    print(f"  Form ID: {data.get('form', 'NOT SET')}")
    print(f"  Submitted By: {data.get('submitted_by', 'NOT SET')}")
    print(f"  Submitted At: {data.get('submitted_at', 'NOT SET')}")
    print(f"  Data Keys: {list(data.get('data', {}).keys()) if data.get('data') else 'NO DATA'}")
    print()

print("\n=== Checking share_links collection ===\n")

# Check share links
share_links_ref = db.collection('share_links')
active_links = share_links_ref.where('is_active', '==', True).limit(3).get()

print(f"Found {len(active_links)} active share links:\n")

for doc in active_links:
    data = doc.to_dict()
    print(f"ID: {doc.id}")
    print(f"  Form ID: {data.get('form_id', 'NOT SET')}")
    print(f"  Organization: {data.get('organization', 'NOT SET')}")
    print(f"  Share Token: {data.get('share_token', 'NOT SET')[:20]}..." if data.get('share_token') else 'NOT SET')
    print(f"  Response Count: {data.get('response_count', 0)}")
    print()

print("\n=== Checking organizations collection ===\n")

# Check organizations
orgs_ref = db.collection('organizations')
orgs = orgs_ref.limit(3).get()

print(f"Found {len(orgs)} organizations:\n")

for doc in orgs:
    data = doc.to_dict()
    print(f"ID: {doc.id}")
    print(f"  Name: {data.get('name', 'NOT SET')}")
    print(f"  UID: {data.get('uid', 'NOT SET')}")
    print()