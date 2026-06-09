from pydantic import BaseModel
from typing import Optional

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int

    class Config:
        from_attributes = True
