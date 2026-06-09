import hashlib
import numpy as np

class EmbeddingService:
    def __init__(self):
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            # Suppress download warnings or logs, load model
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Loaded SentenceTransformer 'all-MiniLM-L6-v2' successfully.")
        except Exception as e:
            print(f"Notice: Using deterministic fallback embeddings (sentence-transformers not loaded: {e})")

    def get_embedding(self, text: str) -> list[float]:
        if self.model is not None:
            try:
                return self.model.encode(text).tolist()
            except Exception as e:
                print(f"Embedding error: {e}. Falling back.")
        
        # Deterministic 384-dimensional normalized float list
        dim = 384
        digest = hashlib.sha256(text.encode('utf-8')).digest()
        seed = int.from_bytes(digest[:4], 'big')
        rng = np.random.default_rng(seed)
        vec = rng.normal(0.0, 1.0, dim)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        if self.model is not None:
            try:
                return self.model.encode(texts).tolist()
            except Exception as e:
                print(f"Bulk embedding error: {e}. Falling back.")
        return [self.get_embedding(t) for t in texts]
