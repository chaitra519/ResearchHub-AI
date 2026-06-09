import xml.etree.ElementTree as ET
from fastapi import APIRouter, Depends, HTTPException, Query
import requests
from sqlalchemy.orm import Session
from database import get_db
from models.paper import Paper
from models.workspace import Workspace
from schemas.paper import PaperCreate, PaperOut
from routers.auth import get_current_user
from models.user import User
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from services.pdf_service import PDFService

router = APIRouter(tags=["Papers"])
embedding_service = EmbeddingService()
vector_service = VectorService()
pdf_service = PDFService()

MOCK_PAPERS = [
    {
        "title": "Attention Is All You Need",
        "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
        "abstract": "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality.",
        "source": "arXiv",
        "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
        "year": "2017"
    },
    {
        "title": "Llama 3: Open and Efficient Foundation Models",
        "authors": "Meta AI Team",
        "abstract": "We introduce Llama 3, a collection of next-generation foundation models that achieve state-of-the-art results on open benchmarks. We outline the architectural refinements and scale of training, detailing alignment and safety guidelines.",
        "source": "arXiv",
        "pdf_url": "https://arxiv.org/pdf/2404.19553.pdf",
        "year": "2024"
    },
    {
        "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        "authors": "Patrick Lewis, Ethan Perez, Aleksandrina Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Sebastian Riedel, Douwe Kiela",
        "abstract": "We explore Retrieval-Augmented Generation (RAG) models which combine pre-trained parametric memory (generator) with non-parametric memory (retriever). We show that fine-tuning retriever and generator end-to-end yields superior reasoning capabilities.",
        "source": "arXiv",
        "pdf_url": "https://arxiv.org/pdf/2005.11401.pdf",
        "year": "2020"
    },
    {
        "title": "Deep Residual Learning for Image Recognition",
        "authors": "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
        "abstract": "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize.",
        "source": "arXiv",
        "pdf_url": "https://arxiv.org/pdf/1512.03385.pdf",
        "year": "2015"
    }
]

def query_openalex(query_str: str) -> list[dict]:
    if not query_str or len(query_str.strip()) < 2:
        return []

    try:
        url = f"https://api.openalex.org/works?search={requests.utils.quote(query_str)}&per_page=10"
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return []

        data = response.json()
        results = data.get("results", [])
        papers = []

        for work in results:
            title = work.get("display_name")
            if not title:
                continue

            authorships = work.get("authorships", [])
            authors_list = []
            for auth in authorships:
                author_obj = auth.get("author", {})
                name = author_obj.get("display_name")
                if name:
                    authors_list.append(name)
            authors_str = ", ".join(authors_list) if authors_list else "Unknown"

            # Reconstruct abstract from inverted index
            inverted_index = work.get("abstract_inverted_index")
            abstract = ""
            if inverted_index:
                words = {}
                for word, positions in inverted_index.items():
                    for pos in positions:
                        words[pos] = word
                sorted_pos = sorted(words.keys())
                abstract = " ".join([words[pos] for pos in sorted_pos])
            else:
                abstract = "No abstract available."

            primary_location = work.get("primary_location", {})
            source_obj = primary_location.get("source", {}) if primary_location else None
            source_name = source_obj.get("display_name") if source_obj else None
            if not source_name:
                host_venue = work.get("host_venue", {})
                source_name = host_venue.get("display_name") if host_venue else "OpenAlex"

            pdf_url = primary_location.get("pdf_url") if primary_location else ""
            if not pdf_url:
                pdf_url = work.get("doi") or ""

            year = str(work.get("publication_year", "2026"))

            papers.append({
                "title": title,
                "authors": authors_str,
                "abstract": abstract,
                "source": source_name,
                "pdf_url": pdf_url,
                "year": year
            })
        return papers
    except Exception as e:
        print(f"OpenAlex search error: {e}")
        return []

def query_arxiv(query_str: str) -> list[dict]:
    if not query_str or len(query_str.strip()) < 2:
        return []

    try:
        url = f"http://export.arxiv.org/api/query?search_query=all:{requests.utils.quote(query_str)}&max_results=10"
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return []

        root = ET.fromstring(response.content)
        papers = []
        ns = {'atom': 'http://www.w3.org/2005/Atom'}

        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            title_text = title.text.strip().replace("\n", " ") if title is not None else "Unknown Title"

            summary = entry.find('atom:summary', ns)
            summary_text = summary.text.strip().replace("\n", " ") if summary is not None else ""

            authors = []
            for author in entry.findall('atom:author', ns):
                name = author.find('atom:name', ns)
                if name is not None:
                    authors.append(name.text.strip())
            authors_str = ", ".join(authors) if authors else "Unknown"

            published = entry.find('atom:published', ns)
            year = published.text[:4] if published is not None else "2026"

            pdf_url = ""
            for link in entry.findall('atom:link', ns):
                if link.attrib.get('title') == 'pdf' or 'pdf' in link.attrib.get('href', ''):
                    pdf_url = link.attrib.get('href', '')
                    break
            if not pdf_url:
                id_uri = entry.find('atom:id', ns)
                if id_uri is not None and "abs" in id_uri.text:
                    pdf_url = id_uri.text.replace("abs", "pdf") + ".pdf"

            papers.append({
                "title": title_text,
                "authors": authors_str,
                "abstract": summary_text,
                "source": "arXiv",
                "pdf_url": pdf_url,
                "year": year
            })
        return papers
    except Exception as e:
        print(f"arXiv search error: {e}")
        return []

@router.get("/search")
def search_papers(query: str = Query("", description="Search term for literature"), current_user: User = Depends(get_current_user)):
    if not query or len(query.strip()) < 2:
        return MOCK_PAPERS

    openalex_list = query_openalex(query)
    arxiv_list = query_arxiv(query)

    combined = []
    seen = set()

    for p in openalex_list:
        norm_title = p["title"].strip().lower()
        if norm_title not in seen:
            seen.add(norm_title)
            combined.append(p)

    for p in arxiv_list:
        norm_title = p["title"].strip().lower()
        if norm_title not in seen:
            seen.add(norm_title)
            combined.append(p)

    return combined[:15] if combined else MOCK_PAPERS

@router.get("/workspaces/{workspace_id}/papers", response_model=list[PaperOut])
def get_workspace_papers(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify workspace ownership
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")
    
    return db.query(Paper).filter(Paper.workspace_id == workspace_id).all()

@router.post("/import-paper", response_model=PaperOut)
def import_paper(paper_in: PaperCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify workspace ownership
    workspace = db.query(Workspace).filter(Workspace.id == paper_in.workspace_id, Workspace.user_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")

    db_paper = Paper(
        title=paper_in.title,
        authors=paper_in.authors,
        abstract=paper_in.abstract,
        source=paper_in.source or "arXiv",
        pdf_url=paper_in.pdf_url,
        workspace_id=paper_in.workspace_id
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)

    # Generate vector embeddings of abstract and save to vector store
    if db_paper.abstract:
        # Split abstract into small chunks if needed, but abstract is usually small enough for single chunk
        chunks = pdf_service.chunk_text(db_paper.abstract, chunk_size=500, overlap=50)
        if chunks:
            embeddings = embedding_service.get_embeddings(chunks)
            vector_service.add_chunks(
                workspace_id=db_paper.workspace_id,
                source_type="paper",
                item_id=db_paper.id,
                chunks=chunks,
                embeddings=embeddings
            )

    return db_paper
