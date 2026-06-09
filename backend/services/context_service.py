from sqlalchemy.orm import Session
from models.paper import Paper
from models.conversation import Conversation
from services.groq_service import GroqService
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

class ResearchAssistant:
    def __init__(self, db: Session):
        self.db = db
        self.groq_service = GroqService()
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()

    def create_research_context(self, workspace_id: int, query_text: str) -> str:
        # 1. Fetch relevant vector search chunks
        query_emb = self.embedding_service.get_embedding(query_text)
        vector_chunks = self.vector_service.search_workspace(workspace_id, query_emb, limit=5)

        # 2. Fetch all workspace papers metadata to give LLM high-level awareness
        papers = self.db.query(Paper).filter(Paper.workspace_id == workspace_id).all()
        
        # 3. Synthesize context layout
        context = "### Current Workspace Research Context ###\n\n"
        
        if papers:
            context += "Papers imported in workspace:\n"
            for idx, p in enumerate(papers):
                authors_str = p.authors if p.authors else "Unknown Authors"
                abstract_str = p.abstract[:200] + "..." if p.abstract else "[No Abstract]"
                context += f"- Paper {idx+1}: \"{p.title}\" by {authors_str}\n  Snippet: {abstract_str}\n"
        else:
            context += "No research papers have been imported to this workspace yet.\n"

        if vector_chunks:
            context += "\nRelevant excerpts from PDF documents & papers (ordered by relevance):\n"
            for idx, chunk in enumerate(vector_chunks):
                context += f"\n[Excerpt {idx+1}]\n{chunk}\n"
        else:
            context += "\nNo matching semantic excerpts found in files.\n"

        return context

    def generate_research_response(self, workspace_id: int, question: str) -> str:
        # Assemble semantic context
        context = self.create_research_context(workspace_id, question)

        # Retrieve recent conversation history (limit to last 5 query/responses)
        history_records = (
            self.db.query(Conversation)
            .filter(Conversation.workspace_id == workspace_id)
            .order_by(Conversation.timestamp.desc())
            .limit(5)
            .all()
        )
        # Sort chronologically
        history_records.reverse()

        messages = []
        for record in history_records:
            messages.append({"role": "user", "content": record.question})
            messages.append({"role": "assistant", "content": record.answer})

        # Append current user question
        messages.append({"role": "user", "content": question})

        system_prompt = (
            "You are ResearchAssistant, an expert agentic AI system designed to help scientists, engineers, "
            "and researchers query literature, summarize details, and structure papers.\n\n"
            "Use the provided workspace context (papers and matching PDF excerpts) to answer the questions. "
            "Maintain an academic, objective tone. Always cite details using paper titles or authors when applicable.\n"
            "If the context doesn't contain the answer, you can draw from your broader scientific knowledge, but clearly state that you are doing so.\n\n"
            f"{context}"
        )

        # Call the LLM
        answer = self.groq_service.chat_completion(messages, system_prompt=system_prompt)

        # Save to conversation history database
        self.maintain_conversation_history(workspace_id, question, answer)

        return answer

    def maintain_conversation_history(self, workspace_id: int, question: str, answer: str) -> Conversation:
        conversation = Conversation(
            workspace_id=workspace_id,
            question=question,
            answer=answer
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
