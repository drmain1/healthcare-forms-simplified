from fastapi import APIRouter, HTTPException, Depends
from models.organization import Organization
from services.firestore import db
from services.auth import get_current_user

router = APIRouter()

@router.post("/organizations/", response_model=Organization)
def create_organization(organization: Organization, user: dict = Depends(get_current_user)):
    try:
        # Check if the user already has an organization
        docs = db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream()
        if any(docs):
            raise HTTPException(status_code=400, detail="User already has an organization")

        organization.owner_uid = user["uid"]
        organization_dict = organization.dict(exclude_unset=True)
        doc_ref = db.collection('organizations').add(organization_dict)
        created_organization = organization.copy(update={"id": doc_ref[1].id})
        return created_organization
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
