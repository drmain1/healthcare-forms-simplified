from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.form import Form, FormCreate, FormUpdate, FormListResponse
from models.share_link import ShareLink, ShareLinkCreate
from services.firebase_admin import db  # Use the unified Firestore client
from services.auth import get_current_user
from datetime import datetime, timezone, timedelta
import secrets
import hashlib

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

@router.put("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.put("/forms/{form_id}/", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.patch("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.patch("/forms/{form_id}/", response_model=Form, response_model_by_alias=False)
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

@router.delete("/forms/{form_id}", status_code=204, include_in_schema=False)
@router.delete("/forms/{form_id}/", status_code=204)
def delete_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        doc_ref.delete()
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forms/{form_id}/create_share_link/", response_model=ShareLink, response_model_by_alias=False)
def create_share_link(form_id: str, settings: ShareLinkCreate, user: dict = Depends(get_current_user)):
    try:
        # Verify form exists and user has access
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        if form_data.get('organization_id') != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate unique share token
        share_token = secrets.token_urlsafe(32)
        
        # Create share link data
        share_link_data = {
            'form_id': form_id,
            'organization_id': user["uid"],
            'created_by': user["uid"],
            'created_at': datetime.now(timezone.utc),
            'is_active': True,
            'response_count': 0,
            'share_token': share_token,
            'require_password': settings.require_password,
            'max_responses': settings.max_responses
        }
        
        # Set expiration if specified
        if settings.expires_in_days:
            share_link_data['expires_at'] = datetime.now(timezone.utc) + timedelta(days=settings.expires_in_days)
        
        # Hash password if provided
        if settings.require_password and settings.password:
            share_link_data['password_hash'] = hashlib.sha256(settings.password.encode()).hexdigest()
        
        # Add to Firestore
        doc_ref = db.collection('share_links').add(share_link_data)
        
        # Create response with proper URL
        share_link_data['_id'] = doc_ref[1].id
        # In production, this should use the actual domain
        share_link_data['share_url'] = f"http://localhost:3000/forms/{form_id}/fill/{share_token}"
        
        return ShareLink(**share_link_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}/share_links/", response_model=List[ShareLink], response_model_by_alias=False)
def get_share_links(form_id: str, user: dict = Depends(get_current_user)):
    try:
        # Verify form exists and user has access
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        if form_data.get('organization_id') != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all share links for this form
        share_links = []
        docs = db.collection('share_links').where("form_id", "==", form_id).where("is_active", "==", True).stream()
        
        for doc in docs:
            link_data = doc.to_dict()
            link_data["_id"] = doc.id
            # Reconstruct share URL
            share_token = link_data.get('share_token', '')
            link_data['share_url'] = f"http://localhost:3000/forms/{form_id}/fill/{share_token}"
            share_links.append(ShareLink(**link_data))
        
        return share_links
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}/fill/{share_token}/", response_model=Form, response_model_by_alias=False)
def get_form_by_share_token(form_id: str, share_token: str):
    """Public endpoint to get form by share token - no authentication required"""
    try:
        # Find share link by token
        share_link_docs = db.collection('share_links').where("share_token", "==", share_token).where("form_id", "==", form_id).limit(1).stream()
        
        share_link_doc = None
        for doc in share_link_docs:
            share_link_doc = doc
            break
            
        if not share_link_doc:
            raise HTTPException(status_code=404, detail="Invalid share link")
        
        share_link_data = share_link_doc.to_dict()
        
        # Check if link is active
        if not share_link_data.get('is_active', False):
            raise HTTPException(status_code=403, detail="This link is no longer active")
        
        # Check expiration
        expires_at = share_link_data.get('expires_at')
        if expires_at and expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="This link has expired")
        
        # Check response limit
        max_responses = share_link_data.get('max_responses')
        response_count = share_link_data.get('response_count', 0)
        if max_responses and response_count >= max_responses:
            raise HTTPException(status_code=403, detail="Response limit reached for this link")
        
        # Get the form
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        form_data["_id"] = form_doc.id
        
        return Form(**form_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
