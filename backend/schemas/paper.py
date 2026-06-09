from pydantic import BaseModel
from typing import Optional

class PaperCreate(BaseModel):
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    source: Optional[str] = None
    pdf_url: Optional[str] = None
    workspace_id: int

class PaperOut(BaseModel):
    id: int
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    source: Optional[str] = None
    pdf_url: Optional[str] = None
    workspace_id: int

    class Config:
        from_attributes = True
