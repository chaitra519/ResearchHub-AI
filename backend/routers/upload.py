from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.workspace import Workspace
from models.document import Document
from schemas.document import DocumentCreate, DocumentOut
from routers.auth import get_current_user
from services.pdf_service import PDFService
from services.groq_service import GroqService
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

router = APIRouter(tags=["PDF Upload & Documents"])
pdf_service = PDFService()
groq_service = GroqService()
embedding_service = EmbeddingService()
vector_service = VectorService()

@router.get("/workspaces/{workspace_id}/documents", response_model=list[DocumentOut])
def get_workspace_documents(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")
    return db.query(Document).filter(Document.workspace_id == workspace_id).all()

@router.post("/upload-pdf", response_model=DocumentOut)
async def upload_pdf(
    workspace_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        file_bytes = await file.read()
        extracted_text = pdf_service.extract_text(file_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in the PDF")

        # Generate a concise summary
        summary_prompt = (
            "You are an AI research assistant summarizing a scientific PDF document.\n"
            "Provide a brief executive summary (3-4 paragraphs) covering:\n"
            "- Background & Goals\n"
            "- Methodology & Framework\n"
            "- Principal Findings\n"
            "- Limitations & Research Gaps\n"
            "Keep the language structured, formal, and objective."
        )
        preview_text = extracted_text[:8000] # Safe token length limit for summary
        
        summary = groq_service.chat_completion(
            messages=[{"role": "user", "content": f"Document Text:\n{preview_text}"}],
            system_prompt=summary_prompt
        )

        db_doc = Document(
            workspace_id=workspace_id,
            filename=file.filename,
            content=extracted_text,
            summary=summary
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # Index text chunks in ChromaDB
        chunks = pdf_service.chunk_text(extracted_text)
        if chunks:
            embeddings = embedding_service.get_embeddings(chunks)
            vector_service.add_chunks(
                workspace_id=workspace_id,
                source_type="document",
                item_id=db_doc.id,
                chunks=chunks,
                embeddings=embeddings
            )

        return db_doc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.post("/workspaces/{workspace_id}/documents", response_model=DocumentOut)
def create_note_document(
    workspace_id: int,
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")

    summary = ""
    if doc_in.content:
        summary_prompt = "Summarize the following notes in 1-2 concise sentences."
        summary = groq_service.chat_completion(
            messages=[{"role": "user", "content": doc_in.content[:4000]}],
            system_prompt=summary_prompt
        )

    db_doc = Document(
        workspace_id=workspace_id,
        filename=doc_in.filename,
        content=doc_in.content,
        summary=summary
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    if db_doc.content:
        chunks = pdf_service.chunk_text(db_doc.content)
        if chunks:
            embeddings = embedding_service.get_embeddings(chunks)
            vector_service.add_chunks(
                workspace_id=workspace_id,
                source_type="document",
                item_id=db_doc.id,
                chunks=chunks,
                embeddings=embeddings
            )

    return db_doc

@router.put("/documents/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_doc = db.query(Document).filter(Document.id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    workspace = db.query(Workspace).filter(Workspace.id == db_doc.workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=401, detail="Unauthorized workspace access")

    db_doc.filename = doc_in.filename
    db_doc.content = doc_in.content

    if doc_in.content:
        summary_prompt = "Summarize the following notes in 1-2 concise sentences."
        db_doc.summary = groq_service.chat_completion(
            messages=[{"role": "user", "content": doc_in.content[:4000]}],
            system_prompt=summary_prompt
        )

    db.commit()
    db.refresh(db_doc)

    if db_doc.content:
        chunks = pdf_service.chunk_text(db_doc.content)
        if chunks:
            embeddings = embedding_service.get_embeddings(chunks)
            vector_service.add_chunks(
                workspace_id=db_doc.workspace_id,
                source_type="document",
                item_id=db_doc.id,
                chunks=chunks,
                embeddings=embeddings
            )

    return db_doc

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_doc = db.query(Document).filter(Document.id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    workspace = db.query(Workspace).filter(Workspace.id == db_doc.workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=401, detail="Unauthorized workspace access")

    db.delete(db_doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}
