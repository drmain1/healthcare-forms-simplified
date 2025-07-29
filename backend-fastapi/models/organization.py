from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class Organization(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    owner_uid: str  # The Firebase UID of the user who owns this organization
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
