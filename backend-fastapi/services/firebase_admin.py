import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from pathlib import Path
from google.auth.exceptions import DefaultCredentialsError

# --- Centralized Firebase/Firestore Initialization ---

db = None
app = None

try:
    if not firebase_admin._apps:
        # For Cloud Run, use Application Default Credentials
        # This automatically uses the service account attached to the Cloud Run service
        try:
            # Try to initialize without credentials (uses ADC)
            app = firebase_admin.initialize_app(options={
                'projectId': os.environ.get('PROJECT_ID', 'healthcare-forms-v2')
            })
        except Exception as init_error:
            # If that fails, try with explicit credentials file
            cred_path = Path(__file__).parent.parent / "healthcare-forms-v2-credentials.json"
            if cred_path.exists():
                cred = credentials.Certificate(str(cred_path))
                app = firebase_admin.initialize_app(cred)
            else:
                raise Exception(
                    f"Failed to initialize Firebase: {init_error}. "
                    "For local development, run 'gcloud auth application-default login' "
                    "or provide healthcare-forms-v2-credentials.json"
                )
    else:
        # If the app is already initialized, get the default app
        app = firebase_admin.get_app()

    # Get Firestore client from the initialized app
    db = firestore.client(app)

except Exception as e:
    # Catch any initialization error and provide a clear message
    raise RuntimeError(f"Failed to initialize Firebase Admin SDK: {e}")

# --- Exported Functions ---

def verify_id_token(id_token: str):
    """
    Verifies a Firebase ID token and returns the decoded token.
    Uses the centrally initialized auth module.
    """
    if not app:
        raise RuntimeError("Firebase Admin SDK not initialized.")
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.InvalidIdTokenError as e:
        raise ValueError(f"Invalid ID token: {e}")
    except Exception as e:
        # Catch other potential Firebase auth errors
        raise ValueError(f"Error during token verification: {e}")
