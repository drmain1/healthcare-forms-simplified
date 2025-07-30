from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional, Dict, Any
from models.form_response import FormResponse
from services.firebase_admin import db
from services.auth import get_current_user
from datetime import datetime, timezone
from pydantic import BaseModel

class PublicFormSubmission(BaseModel):
    form_id: str
    share_token: str
    response_data: Dict[str, Any]

router = APIRouter()

@router.post("/responses/", response_model=FormResponse)
def create_response(response: FormResponse, user: dict = Depends(get_current_user)):
    try:
        # In single-user model, organization_id == user_id
        organization_id = user["uid"]

        response.submitted_by = user["uid"]
        response.organization_id = organization_id
        response_dict = response.dict(exclude_unset=True)
        doc_ref = db.collection('form_responses').add(response_dict)
        created_response = response.copy(update={"id": doc_ref[1].id})
        return created_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PaginatedResponse(BaseModel):
    count: int
    next: Optional[str] = None
    previous: Optional[str] = None
    results: List[Dict[str, Any]]  # Return as dicts for proper serialization

@router.get("/responses/", response_model=PaginatedResponse)
def list_responses(
    form_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    form: Optional[str] = None,
    status: Optional[str] = None,
    patient: Optional[str] = None,
    reviewed: Optional[str] = None,
    ordering: str = "-submitted_at",
    user: dict = Depends(get_current_user)
):
    try:
        print(f"List responses called with params: page={page}, page_size={page_size}, form={form}, status={status}")
        
        # In single-user model, organization_id == user_id
        organization_id = user["uid"]
        print(f"Organization ID: {organization_id}")

        responses = []
        # Start with base query
        query = db.collection('form_responses').where('organization_id', '==', organization_id)
        
        # Apply filters if provided
        if form_id:
            query = query.where('form_id', '==', form_id)
        if form:
            query = query.where('form_id', '==', form)
            
        # Get all matching documents
        docs = query.stream()
        for doc in docs:
            response_data = doc.to_dict()
            response_data["id"] = doc.id
            response_data["_id"] = doc.id  # Also set _id for alias
            
            # Get form title for display
            if response_data.get('form_id'):
                form_doc = db.collection('forms').document(response_data['form_id']).get()
                if form_doc.exists:
                    form_data = form_doc.to_dict()
                    response_data['form_title'] = form_data.get('title', 'Untitled Form')
            
            # Debug log
            print(f"Response data before creating FormResponse: {response_data.get('id')}, form_id: {response_data.get('form_id')}")
            responses.append(FormResponse(**response_data))
            
        # Sort by submission date (newest first)
        def get_sort_date(response):
            if hasattr(response, 'submitted_at') and response.submitted_at:
                # Ensure timezone awareness
                if response.submitted_at.tzinfo is None:
                    return response.submitted_at.replace(tzinfo=timezone.utc)
                return response.submitted_at
            return datetime.min.replace(tzinfo=timezone.utc)
        
        responses.sort(key=get_sort_date, reverse=True)
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_responses = responses[start_idx:end_idx]
        
        # Return paginated response with properly serialized data
        return PaginatedResponse(
            count=len(responses),
            next=None,  # Simplified pagination
            previous=None,
            results=[r.model_dump(by_alias=True) for r in paginated_responses]
        )
    except Exception as e:
        print(f"Error in list_responses: {str(e)}")
        import traceback
        traceback.print_exc()
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

@router.post("/responses/submit_public/", response_model=FormResponse)
def submit_public_response(submission: PublicFormSubmission):
    """Public endpoint for form submission via share link - no authentication required"""
    try:
        print(f"Received submission: form_id={submission.form_id}, share_token={submission.share_token}")
        
        # Validate share link - using proper Firestore syntax
        share_link_docs = db.collection('share_links')\
            .where('share_token', '==', submission.share_token)\
            .where('form_id', '==', submission.form_id)\
            .limit(1).stream()
        
        share_link_doc = None
        share_link_id = None
        for doc in share_link_docs:
            share_link_doc = doc
            share_link_id = doc.id
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
        
        # Get form details to get organization_id
        form_doc = db.collection('forms').document(submission.form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        
        # Create response document
        response_data = {
            'form_id': submission.form_id,
            'organization_id': form_data.get('organization_id'),
            'response_data': submission.response_data,
            'submitted_at': datetime.now(timezone.utc),
            'submitted_via': 'share_link',
            'share_link_id': share_link_id,
            'status': 'submitted',
            'reviewed': False
        }
        
        # Add to Firestore
        doc_ref = db.collection('form_responses').add(response_data)
        
        # Update share link response count
        db.collection('share_links').document(share_link_id).update({
            'response_count': response_count + 1
        })
        
        # Return created response
        response_data['id'] = doc_ref[1].id
        # Add required fields that FormResponse model expects
        response_data['submitted_by'] = 'anonymous'  # Public submission
        response_data['created_at'] = response_data.get('submitted_at', datetime.now(timezone.utc))
        response_data['updated_at'] = response_data.get('submitted_at', datetime.now(timezone.utc))
        return FormResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in submit_public_response: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
