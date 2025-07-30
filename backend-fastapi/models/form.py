from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class FormCreate(BaseModel):
    """Model for creating a new form"""
    title: str
    description: Optional[str] = None
    surveyjs_schema: Dict[str, Any]
    status: str = "draft"
    template_id: Optional[str] = None
    contains_phi: bool = False
    encryption_required: bool = False
    category: Optional[str] = None  # Frontend sends this but we don't store it yet

class FormUpdate(BaseModel):
    """Model for updating an existing form"""
    title: Optional[str] = None
    description: Optional[str] = None
    surveyjs_schema: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    template_id: Optional[str] = None
    contains_phi: Optional[bool] = None
    encryption_required: Optional[bool] = None
    category: Optional[str] = None

class Form(BaseModel):
    """Complete form model with all fields"""
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    organization_id: str
    surveyjs_schema: Dict[str, Any]
    status: str = "draft"
    created_by: str
    template_id: Optional[str] = None
    contains_phi: bool = False
    encryption_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )

class FormListResponse(BaseModel):
    """Paginated response for a list of forms"""
    count: int
    results: List[Form]
