from fastapi import APIRouter, HTTPException, Depends
from models.organization import Organization
from services.firestore import db
from services.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/organizations/me", response_model=Organization)
def get_my_organization(user: dict = Depends(get_current_user)):
    """Get the current user's organization (single-user model)."""
    try:
        # In single-user model, organization_id == user_id
        org_doc = db.collection('organizations').document(user["uid"]).get()
        
        if not org_doc.exists:
            # Auto-create organization for new user
            org_data = {
                'uid': user["uid"],
                'name': user.get("email", "My Organization"),
                'email': user.get("email", ""),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'settings': {
                    'hipaa_compliant': True,
                    'data_retention_days': 2555  # 7 years for HIPAA
                }
            }
            db.collection('organizations').document(user["uid"]).set(org_data)
            org_data['id'] = user["uid"]
            return Organization(**org_data)
        
        org_data = org_doc.to_dict()
        org_data['id'] = org_doc.id
        return Organization(**org_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/organizations/me", response_model=Organization)
def update_my_organization(updates: dict, user: dict = Depends(get_current_user)):
    """Update the current user's organization settings."""
    try:
        org_ref = db.collection('organizations').document(user["uid"])
        
        # Ensure organization exists
        if not org_ref.get().exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Add update timestamp
        updates['updated_at'] = datetime.utcnow()
        
        # Prevent updating critical fields
        protected_fields = ['uid', 'created_at', 'id']
        for field in protected_fields:
            updates.pop(field, None)
        
        org_ref.update(updates)
        
        # Return updated organization
        org_data = org_ref.get().to_dict()
        org_data['id'] = user["uid"]
        return Organization(**org_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
