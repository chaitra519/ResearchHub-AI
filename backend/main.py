from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models  # Ensures models are imported so Base metadata finds them

# Create all database tables (SQLite/PostgreSQL) on startup
Base.metadata.create_all(bind=engine)

# Import API Routers
from routers import auth, workspace, papers, chat, upload, ai_tools

app = FastAPI(
    title="ResearchHub AI API",
    description="Agentic AI-powered research paper management system backend",
    version="1.0.0"
)

# CORS configurations for local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow React dev server or production hosting
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include endpoint routes
app.include_router(auth.router)
app.include_router(workspace.router)
app.include_router(papers.router)
app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(ai_tools.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "ResearchHub AI Backend Service",
        "version": "1.0.0"
    }
