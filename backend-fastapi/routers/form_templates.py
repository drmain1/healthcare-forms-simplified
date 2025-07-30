from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.form_template import FormTemplate
from services.firebase_admin import db
from services.auth import get_current_user

router = APIRouter()

@router.post("/form-templates/", response_model=FormTemplate)
def create_form_template(form_template: FormTemplate, user: dict = Depends(get_current_user)):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            raise HTTPException(status_code=400, detail="User does not have an organization")
        organization_id = org_docs[0].id

        form_template.organization_id = organization_id
        form_template_dict = form_template.dict(exclude_unset=True)
        doc_ref = db.collection('form_templates').add(form_template_dict)
        created_form_template = form_template.copy(update={"id": doc_ref[1].id})
        return created_form_template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/form-templates/", response_model=List[FormTemplate])
def list_form_templates(user: dict = Depends(get_current_user)):
    try:
        # Get the user's organization
        org_docs = list(db.collection('organizations').where("owner_uid", "==", user["uid"]).limit(1).stream())
        if not org_docs:
            return [] # No organization, no templates
        organization_id = org_docs[0].id

        form_templates = []
        docs = db.collection('form_templates').where("organization_id", "==", organization_id).stream()
        for doc in docs:
            form_template_data = doc.to_dict()
            form_template_data["id"] = doc.id
            form_templates.append(FormTemplate(**form_template_data))
        return form_templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/form-templates/{template_id}", response_model=FormTemplate)
def get_form_template(template_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = db.collection('form_templates').document(template_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form template not found")
        form_template_data = doc.to_dict()
        form_template_data["id"] = doc.id
        return FormTemplate(**form_template_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/form-templates/{template_id}", response_model=FormTemplate)
def update_form_template(template_id: str, form_template: FormTemplate, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('form_templates').document(template_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        form_template_dict = form_template.dict(exclude_unset=True)
        doc_ref.update(form_template_dict)
        return form_template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/form-templates/{template_id}", status_code=204)
def delete_form_template(template_id: str, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('form_templates').document(template_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form template not found")
        
        doc_ref.delete()
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
