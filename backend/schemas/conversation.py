from pydantic import BaseModel
from datetime import datetime

class ConversationCreate(BaseModel):
    workspace_id: int
    question: str

class ConversationOut(BaseModel):
    id: int
    workspace_id: int
    question: str
    answer: str
    timestamp: datetime

    class Config:
        from_attributes = True
