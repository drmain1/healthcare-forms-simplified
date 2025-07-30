from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class OrganizationSettings(BaseModel):
    hipaa_compliant: bool = True
    data_retention_days: int = 2555  # 7 years for HIPAA
    timezone: str = "UTC"
    
class Organization(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    uid: str  # Same as user's Firebase UID (single-user model)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    settings: OrganizationSettings = Field(default_factory=OrganizationSettings)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
