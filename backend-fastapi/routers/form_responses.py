from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.form_response import FormResponse
from services.firestore import db
from services.auth import get_current_user

router = APIRouter()

@router.post("/responses/", response_model=FormResponse)
def create_response(response: FormResponse, user: dict = Depends(get_current_user)):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            raise HTTPException(status_code=400, detail="User does not have an organization")
        organization_id = org_docs[0].id

        response.submitted_by = user["uid"]
        response.organization_id = organization_id
        response_dict = response.dict(exclude_unset=True)
        doc_ref = db.collection('form_responses').add(response_dict)
        created_response = response.copy(update={"id": doc_ref[1].id})
        return created_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/responses/", response_model=List[FormResponse])
def list_responses(
    form_id: Optional[str] = None,
    page: Optional[int] = 1,
    page_size: Optional[int] = 20,
    search: Optional[str] = None,
    form: Optional[str] = None,
    status: Optional[str] = None,
    patient: Optional[str] = None,
    reviewed: Optional[str] = None,
    ordering: Optional[str] = "-submitted_at",
    user: dict = Depends(get_current_user)
):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            return [] # No organization, no responses
        organization_id = org_docs[0].id

        responses = []
        # Start with base query
        query = db.collection('form_responses').where("organization_id", "==", organization_id)
        
        # Apply filters if provided
        if form_id:
            query = query.where("form_id", "==", form_id)
        if form:
            query = query.where("form_id", "==", form)
            
        # Get all matching documents
        docs = query.stream()
        for doc in docs:
            response_data = doc.to_dict()
            response_data["id"] = doc.id
            responses.append(FormResponse(**response_data))
            
        # TODO: Implement pagination, search, and ordering
        return responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/responses/{response_id}", response_model=FormResponse)
def get_response(response_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = db.collection('form_responses').document(response_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Response not found")
        response_data = doc.to_dict()
        response_data["id"] = doc.id
        return FormResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/responses/{response_id}", response_model=FormResponse)
def update_response(response_id: str, response: FormResponse, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('form_responses').document(response_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Response not found")
        
        response_dict = response.dict(exclude_unset=True)
        doc_ref.update(response_dict)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/responses/{response_id}", status_code=204)
def delete_response(response_id: str, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('form_responses').document(response_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Response not found")
        
        doc_ref.delete()
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
