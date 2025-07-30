from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Optional
from services.firebase_admin import verify_id_token
from services.firebase_admin import db
from datetime import datetime

router = APIRouter()

class FirebaseLoginRequest(BaseModel):
    idToken: str
    displayName: Optional[str] = None
    email: Optional[str] = None
    photoURL: Optional[str] = None

class LoginResponse(BaseModel):
    user: Dict
    token: str
    refreshToken: Optional[str] = None

@router.post("/auth/firebase-login/", response_model=LoginResponse)
def firebase_login(request: FirebaseLoginRequest):
    """
    Authenticate a user with Firebase ID token
    """
    try:
        # Verify the Firebase ID token
        decoded_token = verify_id_token(request.idToken)
        uid = decoded_token['uid']
        
        # Get or create user in Firestore
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            # Update last login
            user_ref.update({'last_login': datetime.utcnow().isoformat()})
        else:
            # Create new user
            user_data = {
                'uid': uid,
                'email': request.email or decoded_token.get('email'),
                'display_name': request.displayName or decoded_token.get('name'),
                'photo_url': request.photoURL or decoded_token.get('picture'),
                'created_at': datetime.utcnow().isoformat(),
                'last_login': datetime.utcnow().isoformat()
            }
            user_ref.set(user_data)
            
            # Check if user has an organization
            org_docs = list(db.collection('organizations').where("owner_uid", "==", uid).limit(1).stream())
            if not org_docs:
                # Create default organization for new user
                org_data = {
                    'name': f"{user_data.get('display_name', 'User')}'s Organization",
                    'owner_uid': uid,
                    'created_at': datetime.utcnow().isoformat()
                }
                db.collection('organizations').add(org_data)
        
        # Return user data with token
        return LoginResponse(
            user={
                'uid': uid,
                'email': user_data.get('email'),
                'displayName': user_data.get('display_name'),
                'photoURL': user_data.get('photo_url')
            },
            token=request.idToken,
            refreshToken=None  # Firebase handles refresh tokens on client side
        )
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.get("/auth/build-info/")
def get_build_info():
    """
    Return build information for the frontend
    """
    return {
        "version": "1.0.0",
        "environment": "development",
        "api_version": "v1"
    }