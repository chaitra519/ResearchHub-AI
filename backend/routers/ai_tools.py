from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.workspace import Workspace
from models.paper import Paper
from models.document import Document
from routers.auth import get_current_user
from services.groq_service import GroqService

router = APIRouter(tags=["AI Tools"])
groq_service = GroqService()

class ToolRequest(BaseModel):
    paper_id: Optional[int] = None
    workspace_id: Optional[int] = None

class ReviewRequest(BaseModel):
    workspace_id: int

@router.post("/generate-summary")
def generate_summary(req: ToolRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content_to_summarize = ""
    title = ""

    if req.paper_id:
        paper = db.query(Paper).filter(Paper.id == req.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        # Verify workspace ownership
        workspace = db.query(Workspace).filter(Workspace.id == paper.workspace_id, Workspace.user_id == current_user.id).first()
        if not workspace:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        title = paper.title
        content_to_summarize = f"Title: {paper.title}\nAuthors: {paper.authors or 'Unknown'}\nAbstract: {paper.abstract or 'No Abstract'}"
    
    elif req.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == req.workspace_id, Workspace.user_id == current_user.id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        title = f"Workspace: {workspace.name}"
        papers = db.query(Paper).filter(Paper.workspace_id == req.workspace_id).all()
        documents = db.query(Document).filter(Document.workspace_id == req.workspace_id).all()
        
        if not papers and not documents:
            raise HTTPException(status_code=400, detail="Workspace has no papers or documents to summarize")
        
        for p in papers:
            content_to_summarize += f"- Paper: {p.title} | Authors: {p.authors or 'Unknown'}\n  Abstract: {p.abstract[:300]}...\n\n"
        for d in documents:
            content_to_summarize += f"- Document: {d.filename}\n  Summary: {d.summary or d.content[:300]}...\n\n"
    
    else:
        raise HTTPException(status_code=400, detail="Either paper_id or workspace_id is required")

    prompt = (
        "You are an expert academic annotator. Write a comprehensive, detailed executive summary of the provided text.\n"
        "Format it in Markdown with the following clear headers:\n"
        f"# Detailed Summary of {title}\n\n"
        "## 1. Primary Objectives & Focus\n"
        "Explain the core goals, hypotheses, and scope of this work.\n\n"
        "## 2. Methodology & Experimental Setup\n"
        "Describe the technical framework, algorithms, models, datasets, or designs utilized.\n\n"
        "## 3. Key Findings & Contributions\n"
        "Detail the empirical results, theorems proved, or architectural gains.\n\n"
        "## 4. Academic Relevance\n"
        "Explain how this connects to current literature and why it matters."
    )

    result = groq_service.chat_completion(
        messages=[{"role": "user", "content": f"Content:\n{content_to_summarize}"}],
        system_prompt=prompt
    )
    return {"result": result}

@router.post("/extract-insights")
def extract_insights(req: ToolRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content_to_analyze = ""
    title = ""

    if req.paper_id:
        paper = db.query(Paper).filter(Paper.id == req.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        workspace = db.query(Workspace).filter(Workspace.id == paper.workspace_id, Workspace.user_id == current_user.id).first()
        if not workspace:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        title = paper.title
        content_to_analyze = f"Title: {paper.title}\nAbstract: {paper.abstract or 'No Abstract'}"
    
    elif req.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == req.workspace_id, Workspace.user_id == current_user.id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        title = f"Workspace: {workspace.name}"
        papers = db.query(Paper).filter(Paper.workspace_id == req.workspace_id).all()
        documents = db.query(Document).filter(Document.workspace_id == req.workspace_id).all()
        
        if not papers and not documents:
            raise HTTPException(status_code=400, detail="Workspace has no papers or documents for analysis")
        
        for p in papers:
            content_to_analyze += f"Paper Title: {p.title}\nAbstract: {p.abstract or 'No Abstract'}\n\n"
        for d in documents:
            content_to_analyze += f"Document Title: {d.filename}\nSummary: {d.summary or d.content[:400]}...\n\n"
            
    else:
        raise HTTPException(status_code=400, detail="Either paper_id or workspace_id is required")

    prompt = (
        "You are an elite academic editor. Review the research details provided and extract critical scientific insights.\n"
        "Avoid generic filler. Format using Markdown with headings and bold text:\n"
        f"# Key Insights for {title}\n\n"
        "### 💡 Methodological Innovation\n"
        "What are the novel designs, mathematical formulations, or model architectures introduced?\n\n"
        "### 📊 Main Data Points & Findings\n"
        "What are the numerical or experimental proofs and theoretical bounds established?\n\n"
        "### ⚠️ Crucial Gaps & Limitations\n"
        "What assumptions are made? What benchmarks are missing? Where do they fail?"
    )

    result = groq_service.chat_completion(
        messages=[{"role": "user", "content": f"Content:\n{content_to_analyze}"}],
        system_prompt=prompt
    )
    return {"result": result}

@router.post("/generate-review")
def generate_review(req: ReviewRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(Workspace).filter(Workspace.id == req.workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    papers = db.query(Paper).filter(Paper.workspace_id == req.workspace_id).all()
    documents = db.query(Document).filter(Document.workspace_id == req.workspace_id).all()

    if not papers and not documents:
        raise HTTPException(status_code=400, detail="Workspace must contain papers or uploaded PDFs to generate a literature review")

    workspace_data = ""
    for idx, p in enumerate(papers):
        workspace_data += f"[Paper {idx+1}]\nTitle: {p.title}\nAuthors: {p.authors or 'Unknown'}\nAbstract: {p.abstract or 'No abstract'}\n\n"
    for idx, d in enumerate(documents):
        workspace_data += f"[Document {idx+1}]\nFilename: {d.filename}\nSummary: {d.summary or d.content[:500]}...\n\n"

    prompt = (
        "You are a Senior Academic Researcher and Peer Reviewer.\n"
        "Your task is to synthesize the provided collection of papers and documents into a structured, cohesive, publication-quality Literature Review.\n"
        "Integrate discussions and contrast the papers dynamically, referencing them by title and author. Do not list them one by one.\n\n"
        "Structure the generated Literature Review as follows:\n\n"
        f"# Literature Review & Research Synthesis: {workspace.name}\n\n"
        "## Abstract\n"
        "A 150-word synthesis abstract summarizing the scope and main conclusions of the literature.\n\n"
        "## 1. Introduction & Domain Context\n"
        "Provide a high-level background of the domain and explain the academic significance of the current study corpus.\n\n"
        "## 2. Methodological Comparison\n"
        "Compare and contrast the models, experiments, datasets, and frameworks utilized. Focus on pros/cons of their styles.\n\n"
        "## 3. Main Theoretical & Practical Themes\n"
        "Synthesize findings across the corpus. Where do the papers agree? Where are the major contradictions or differences in outcomes?\n\n"
        "## 4. Identified Gaps & Open Research Directions\n"
        "Outline at least three critical areas the studies have collectively left unaddressed. Explain how a new research project could target these gaps.\n\n"
        "## 5. Conclusion\n"
        "Synthesize the state of the art based on the workspace corpus."
    )

    result = groq_service.chat_completion(
        messages=[{"role": "user", "content": f"Workspace Papers Data:\n{workspace_data}"}],
        system_prompt=prompt
    )
    return {"result": result}









