from pydantic import BaseModel
from typing import Optional

class DocumentCreate(BaseModel):
    workspace_id: int
    filename: str
    content: str
    summary: Optional[str] = None

class DocumentOut(BaseModel):
    id: int
    workspace_id: int
    filename: str
    content: str
    summary: Optional[str] = None

    class Config:
        from_attributes = True
