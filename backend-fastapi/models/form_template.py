from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class FormTemplate(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    organization_id: str
    category: Optional[str] = None
    description: Optional[str] = None
    surveyjs_schema: Dict[str, Any]
    fhir_mapping: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
