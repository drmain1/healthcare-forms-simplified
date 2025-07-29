from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class Form(BaseModel):
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

    model_config = ConfigDict(populate_by_name=True)
