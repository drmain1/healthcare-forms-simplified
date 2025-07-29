from google.cloud import firestore
import os
from pathlib import Path

# Set up credentials path
cred_path = Path(__file__).parent.parent / "healthcare-forms-v2-credentials.json"
if cred_path.exists():
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(cred_path)

# Initialize Firestore client with project ID
db = firestore.Client(project='healthcare-forms-v2')
