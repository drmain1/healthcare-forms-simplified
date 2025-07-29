from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.form import Form
from services.firestore import db
from services.auth import get_current_user

router = APIRouter()

@router.post("/forms/", response_model=Form)
def create_form(form: Form, user: dict = Depends(get_current_user)):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            raise HTTPException(status_code=400, detail="User does not have an organization")
        organization_id = org_docs[0].id

        form.created_by = user["uid"]
        form.organization_id = organization_id
        form_dict = form.dict(exclude_unset=True)
        doc_ref = db.collection('forms').add(form_dict)
        created_form = form.copy(update={"id": doc_ref[1].id})
        return created_form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/", response_model=List[Form])
def list_forms(user: dict = Depends(get_current_user)):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            return [] # No organization, no forms
        organization_id = org_docs[0].id

        forms = []
        docs = db.collection('forms').where("organization_id", "==", organization_id).stream()
        for doc in docs:
            form_data = doc.to_dict()
            form_data["id"] = doc.id
            forms.append(Form(**form_data))
        return forms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}", response_model=Form)
def get_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = db.collection('forms').document(form_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        form_data = doc.to_dict()
        form_data["id"] = doc.id
        return Form(**form_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/forms/{form_id}", response_model=Form)
def update_form(form_id: str, form: Form, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_dict = form.dict(exclude_unset=True)
        doc_ref.update(form_dict)
        return form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/forms/{form_id}", status_code=204)
def delete_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        doc_ref.delete()
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
