from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class FormResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    form_id: str
    organization_id: str
    patient_id: Optional[str] = None
    response_data: Dict[str, Any]
    submitted_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
