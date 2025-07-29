import firebase_admin
from firebase_admin import credentials, auth
import os
from pathlib import Path

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    # Use service account credentials
    cred_path = Path(__file__).parent.parent / "healthcare-forms-v2-credentials.json"
    if cred_path.exists():
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred, {
            'projectId': 'healthcare-forms-v2',
        })
    else:
        # Fallback to default credentials
        firebase_admin.initialize_app()

def verify_id_token(id_token: str):
    """
    Verify a Firebase ID token and return the decoded token
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid ID token: {str(e)}")