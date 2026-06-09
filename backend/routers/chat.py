from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.conversation import ConversationCreate, ConversationOut
from routers.auth import get_current_user
from models.user import User
from models.workspace import Workspace
from models.conversation import Conversation
from services.context_service import ResearchAssistant

router = APIRouter(tags=["AI Chat"])

@router.get("/workspaces/{workspace_id}/chat", response_model=list[ConversationOut])
def get_chat_history(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")

    conversations = (
        db.query(Conversation)
        .filter(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.timestamp.asc())
        .all()
    )
    return conversations

@router.post("/chat")
def chat_with_assistant(chat_in: ConversationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == chat_in.workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")

    assistant = ResearchAssistant(db)
    answer = assistant.generate_research_response(chat_in.workspace_id, chat_in.question)
    return {"answer": answer}
