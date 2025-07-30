from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

class FormResponse(BaseModel):
    # Core fields matching Firestore schema
    id: Optional[str] = None
    organization_id: str = Field(..., alias="organization")  # Frontend expects 'organization'
    form_id: str = Field(..., alias="form")  # Frontend expects 'form'
    data: Dict[str, Any] = Field(..., alias="response_data")  # Firestore uses 'data', frontend expects 'response_data'
    metadata: Optional[Dict[str, Any]] = None
    submitted_by: str  # In single-user model, same as organization_id
    submitted_at: datetime
    
    # Additional fields for frontend compatibility
    form_title: Optional[str] = None  # For display purposes
    patient_name: Optional[str] = None  # Extracted from response data
    status: str = 'submitted'
    started_at: Optional[datetime] = None
    completion_time_seconds: Optional[float] = None
    reviewed: bool = False
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    
    # Session/tracking fields
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    session_id: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)
    
    @field_validator('started_at', mode='before')
    def set_started_at(cls, v, values):
        # If started_at is not provided, use submitted_at
        if v is None and 'submitted_at' in values:
            return values['submitted_at']
        return v
