from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ShareLinkBase(BaseModel):
    form_id: str
    expires_at: Optional[datetime] = None
    max_responses: Optional[int] = None
    require_password: bool = False
    password_hash: Optional[str] = None
    is_active: bool = True
    response_count: int = 0

class ShareLinkCreate(BaseModel):
    expires_in_days: Optional[int] = 30
    max_responses: Optional[int] = None
    require_password: bool = False
    password: Optional[str] = None

class ShareLink(ShareLinkBase):
    id: str = Field(alias="_id")
    share_url: str
    created_at: datetime
    created_by: str
    organization_id: str
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }