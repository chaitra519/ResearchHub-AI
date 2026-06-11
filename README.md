# ResearchHub AI - Agentic AI Research Paper System

ResearchHub AI is a production-ready, full-stack application designed as an Agentic AI-powered research paper management system. It allows researchers to create isolated workspaces, perform global queries across multiple literature databases (journals and preprints), drag & drop PDF papers to extract and summarize content, write and format academic notes, and converse with a specialized AI ResearchAssistant agent that retrieves relevant data directly from their workspace.

---

## 🚀 Key Features

1. **Authentication & Security**: JWT-based authentication session guards with secure password hashing via raw `bcrypt` (avoiding deprecated `passlib` version conflicts).
2. **Workspaces Manager**: Create isolated workspaces for different research projects, separating papers, notes, and agent chat histories.
3. **Global Multi-Source Literature Search**: Query the **OpenAlex API** (aggregating peer-reviewed journals, conferences, and books from major publishers globally) and the **ArXiv API** (preprints) in a unified search panel.
4. **Agentic RAG Chat**: Consult a custom `ResearchAssistant` agent powered by Groq's `llama-3.3-70b-versatile` model. The agent reads workspace documents and similarity vector matches to provide grounded answers.
5. **PDF Text Extraction & Synthesis**: Drag & drop PDF files. The backend extracts text with PyMuPDF (`fitz`), generates executive summaries with Llama 3.3, and indexes sections in vector collections.
6. **Academic Synthesizer Tools**:
   - **Summarizer**: Detailed structural academic summary (objectives, methodology, outcomes, contributions).
   - **Insight Extractor**: Innovations, proof points, and critical literature gaps.
   - **Literature Review Synthesis**: Compiles a publication-quality literature review collating the workspace's entire research corpus.
7. **Interactive Doc Space**: Markdown-enabled rich note-taking workspace allowing immediate document editing, saving, and local file downloading (.md).

---

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS + React Router + Axios + Framer Motion.
- **Backend**: FastAPI + SQLAlchemy + SQLite (Development) / PostgreSQL (Production) + JWT (jose) + raw bcrypt + PyMuPDF.
- **AI Reasoning**: Groq SDK (`llama-3.3-70b-versatile`).
- **Semantic Vector Storage**: ChromaDB + `sentence-transformers` (with custom local NumPy cosine similarity and SHA-256 seeding fallbacks to ensure zero-crash startup).

---

## 📁 Repository Structure

```
researchhub-ai/
├── backend/
│   ├── models/                 # SQLAlchemy DB Models
│   ├── schemas/                # Pydantic Schemas
│   ├── routers/                # FastAPI Routers (auth, workspace, papers, chat, upload, ai_tools)
│   ├── services/               # AI Services (groq, embedding, vector, pdf, context)
│   ├── main.py                 # FastAPI Application Start
│   ├── database.py             # Database session configurations
│   ├── test_backend.py         # Integration validation test script
│   ├── requirements.txt        # Python Packages List
│   └── .env                    # Local environment settings
│
└── frontend/
    ├── src/
    │   ├── layouts/            # Page layouts
    │   ├── store/              # React Auth Store Context
    │   ├── services/           # Axios Client Interceptor
    │   ├── pages/              # Dashboards (Home, Login, Dashboard, Workspace, DocSpace, etc.)
    │   ├── types/              # TS Interfaces
    │   └── App.tsx             # Routing configuration
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.ts
```

---

## ⚙️ Installation & Configuration

### 1. Backend Setup
Navigate into the `backend` folder:
```bash
cd backend
```

Create a `.env` file in the `backend` directory (there is an `.env` template provided):
```env
DATABASE_URL=sqlite:///./researchhub.db
JWT_SECRET=42f4c9c4db96c8bc5c14fe216892e624c9c57d2a588b50df2ff0b7a898b9584d
GROQ_API_KEY=gsk_your_groq_api_key_here
```
*(Get a free Groq API key from [console.groq.com](https://console.groq.com/))*

Install the backend Python dependencies:
```bash
pip install -r requirements.txt
```

Verify backend functionality by running the integration tests:
```bash
python test_backend.py
```

### 2. Frontend Setup
Navigate into the `frontend` folder:
```bash
cd ../frontend
```

Install the Node.js packages:
```bash
npm install
```

---

## 🏃 Running the Servers

### 1. Launch Backend
Run from the `backend` directory:
```bash
python -m uvicorn main:app --reload
```
- API Docs Swagger: `http://localhost:8000/docs`

### 2. Launch Frontend
Run from the `frontend` directory:
```bash
npm run dev
```
- Client App: `http://localhost:5173`

---

## 💡 Robust Fallback Mechanics

To make developers onboarding immediate and offline-friendly, the backend includes **zero-crash fallback mechanisms**:
- **Offline Vector Similarity**: If native ChromaDB binary dependencies fail to install, `vector_service` switches to a local JSON/NumPy vector engine that calculates cosine similarities locally.
- **Offline Embeddings**: If huggingface/sentence-transformers cannot load or download, `embedding_service` uses a SHA-256 seeded pseudo-random normalized generator to generate consistent, deterministic 384-dimensional mock embeddings.
- **AI Simulation Mode**: If no `GROQ_API_KEY` is provided in `.env`, the assistant returns helpful placeholder answers highlighting context parameters instead of crashing.