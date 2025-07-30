from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.form import Form, FormCreate, FormUpdate, FormListResponse
from services.firebase_admin import db  # Use the unified Firestore client
from services.auth import get_current_user
from datetime import datetime, timezone  # Import timezone

router = APIRouter()

@router.post("/forms/", response_model=Form, response_model_by_alias=False)
def create_form(form_data: FormCreate, user: dict = Depends(get_current_user)):
    try:
        # In single-user model, organization_id == user_id
        organization_id = user["uid"]
        
        # Check if organization exists, create if not
        org_doc = db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            # Auto-create organization for new user
            org_data = {
                'uid': user["uid"],
                'name': user.get("email", "My Organization"),
                'email': user.get("email", ""),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'settings': {
                    'hipaa_compliant': True,
                    'data_retention_days': 2555  # 7 years for HIPAA
                }
            }
            db.collection('organizations').document(organization_id).set(org_data)

        # Create the form with required fields
        form_dict = form_data.dict(exclude_unset=True, exclude={'category'})  # Exclude category for now
        form_dict['created_by'] = user["uid"]
        form_dict['organization_id'] = organization_id
        form_dict['created_at'] = datetime.now(timezone.utc)
        form_dict['updated_at'] = datetime.now(timezone.utc)
        form_dict['updated_by'] = user["uid"]
        
        # Add to Firestore
        doc_ref = db.collection('forms').add(form_dict)
        
        # Create response with proper ID field
        form_dict['_id'] = doc_ref[1].id  # Use _id as expected by the Form model alias
        
        # Debug logging
        print(f"Created form with ID: {doc_ref[1].id}")
        print(f"Form dict: {form_dict}")
        
        created_form = Form(**form_dict)
        print(f"Form response: {created_form.model_dump()}")
        
        return created_form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/", response_model=FormListResponse, response_model_by_alias=False)
def list_forms(user: dict = Depends(get_current_user)):
    try:
        organization_id = user["uid"]
        
        forms = []
        docs = db.collection('forms').where("organization_id", "==", organization_id).stream()
        
        for doc in docs:
            form_data = doc.to_dict()
            form_data["_id"] = doc.id
            forms.append(Form(**form_data))
        
        return {"count": len(forms), "results": forms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.get("/forms/{form_id}/", response_model=Form, response_model_by_alias=False)
def get_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = db.collection('forms').document(form_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        form_data = doc.to_dict()
        form_data["_id"] = doc.id  # Use _id for the alias
        return Form(**form_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/forms/{form_id}", response_model=Form, response_model_by_alias=False)
def update_form(form_id: str, form_update: FormUpdate, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        # Get existing form data
        existing_form = doc.to_dict()
        
        # Update only provided fields
        update_dict = form_update.dict(exclude_unset=True, exclude={'category'})
        update_dict['updated_at'] = datetime.now(timezone.utc)
        update_dict['updated_by'] = user["uid"]
        
        doc_ref.update(update_dict)
        
        # Return updated form
        existing_form.update(update_dict)
        existing_form['_id'] = form_id  # Use _id for the alias
        return Form(**existing_form)
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
