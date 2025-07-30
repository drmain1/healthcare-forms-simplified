from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class FormResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    form_id: str = Field(..., alias="form")  # Frontend expects 'form'
    form_title: Optional[str] = None  # For display purposes
    organization_id: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None  # For display purposes
    response_data: Dict[str, Any]
    submitted_by: Optional[str] = None  # Optional for public submissions
    submitted_at: Optional[datetime] = None
    submitted_via: Optional[str] = None  # 'share_link', 'direct', etc.
    status: str = 'submitted'
    reviewed: bool = False
    completion_time_seconds: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
