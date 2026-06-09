import os
import json
import uuid
import numpy as np

class VectorService:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self.fallback_db_path = "./fallback_vector_db.json"
        self.fallback_data = []

        # Load fallback data if exists
        if os.path.exists(self.fallback_db_path):
            try:
                with open(self.fallback_db_path, "r", encoding="utf-8") as f:
                    self.fallback_data = json.load(f)
            except Exception:
                self.fallback_data = []

        try:
            import chromadb
            db_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
            self.chroma_client = chromadb.PersistentClient(path=db_path)
            self.collection = self.chroma_client.get_or_create_collection(
                name="workspace_papers",
                metadata={"hnsw:space": "cosine"}
            )
            print("ChromaDB initialized successfully.")
        except Exception as e:
            print(f"Notice: Using fallback JSON vector store (ChromaDB initialization: {e})")

    def add_chunks(self, workspace_id: int, source_type: str, item_id: int, chunks: list[str], embeddings: list[list[float]]):
        if not chunks:
            return
            
        if self.collection is not None:
            try:
                ids = [str(uuid.uuid4()) for _ in chunks]
                metadatas = [
                    {
                        "workspace_id": workspace_id,
                        "item_id": item_id,
                        "source_type": source_type
                    } for _ in chunks
                ]
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=chunks,
                    metadatas=metadatas
                )
                return
            except Exception as e:
                print(f"ChromaDB add failed: {e}. Falling back.")

        # Local fallback vector save
        for chunk, emb in zip(chunks, embeddings):
            self.fallback_data.append({
                "id": str(uuid.uuid4()),
                "workspace_id": workspace_id,
                "item_id": item_id,
                "source_type": source_type,
                "text": chunk,
                "embedding": emb
            })
        self._save_fallback()

    def _save_fallback(self):
        try:
            with open(self.fallback_db_path, "w", encoding="utf-8") as f:
                json.dump(self.fallback_data, f, indent=2)
        except Exception as e:
            print(f"Error saving vector DB JSON: {e}")

    def search_workspace(self, workspace_id: int, query_embedding: list[float], limit: int = 5) -> list[str]:
        if self.collection is not None:
            try:
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=limit,
                    where={"workspace_id": workspace_id}
                )
                if results and results.get('documents') and len(results['documents']) > 0:
                    return results['documents'][0]
                return []
            except Exception as e:
                print(f"ChromaDB query failed: {e}. Falling back.")

        # Local cosine similarity search
        workspace_items = [x for x in self.fallback_data if x["workspace_id"] == workspace_id]
        if not workspace_items:
            return []

        q_vec = np.array(query_embedding)
        scored_items = []
        for item in workspace_items:
            i_vec = np.array(item["embedding"])
            dot = np.dot(q_vec, i_vec)
            q_norm = np.linalg.norm(q_vec)
            i_norm = np.linalg.norm(i_vec)
            sim = dot / (q_norm * i_norm) if (q_norm > 0 and i_norm > 0) else 0.0
            scored_items.append((sim, item["text"]))

        # Sort similarity descending
        scored_items.sort(key=lambda x: x[0], reverse=True)
        return [text for _, text in scored_items[:limit]]
