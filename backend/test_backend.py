import os
import sys

# Add current folder to sys.path so imports resolve
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Force UTF-8 output encoding to handle emojis on Windows console
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from database import Base, engine, SessionLocal
from models.user import User
from models.workspace import Workspace
from routers.auth import get_password_hash, verify_password, create_access_token
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from services.pdf_service import PDFService
from services.context_service import ResearchAssistant

def run_tests():
    print("=== STARTING BACKEND INTEGRATION TESTS ===")

    # 1. Initialize Tables
    print("1. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Test User creation & auth password hashing
        print("2. Testing User creation & password hashing...")
        hashed = get_password_hash("testpassword")
        assert verify_password("testpassword", hashed), "Password verification failed"
        assert not verify_password("wrongpassword", hashed), "False password approved"
        print("   - Hashing verified successfully.")

        # Cleanup past test user
        test_user = db.query(User).filter(User.username == "testuser").first()
        if test_user:
            db.delete(test_user)
            db.commit()

        test_user = User(username="testuser", email="test@user.com", password_hash=hashed)
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"   - Test User created: id={test_user.id}")

        # 3. JWT token creation
        print("3. Testing JWT generation...")
        token = create_access_token({"sub": test_user.username})
        assert token is not None, "Token generation failed"
        print("   - Token generated successfully.")

        # 4. Workspace creation
        print("4. Testing Workspace creation...")
        workspace = Workspace(name="AI Safety & Alignment", description="Workspace for AI security papers", user_id=test_user.id)
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
        print(f"   - Workspace created: id={workspace.id}, name={workspace.name}")

        # 5. Embedding service testing
        print("5. Testing Embedding Service...")
        embed_service = EmbeddingService()
        vec = embed_service.get_embedding("Deep learning and artificial intelligence systems")
        assert len(vec) == 384, f"Expected 384 dimensions, got {len(vec)}"
        print(f"   - Embedding generated: length={len(vec)}")

        # 6. Vector service testing
        print("6. Testing Vector Service indexing and similarity query...")
        vector_db = VectorService()
        vector_db.add_chunks(
            workspace_id=workspace.id,
            source_type="test",
            item_id=99,
            chunks=["Neural networks learn layers of representations.", "Attention mechanisms revolutionized neural machine translation."],
            embeddings=[
                embed_service.get_embedding("Neural networks learn layers of representations."),
                embed_service.get_embedding("Attention mechanisms revolutionized neural machine translation.")
            ]
        )

        query_vec = embed_service.get_embedding("representation learning in network systems")
        matches = vector_db.search_workspace(workspace.id, query_vec, limit=1)
        assert len(matches) > 0, "No vector match found"
        print(f"   - Match found: '{matches[0]}'")

        # 7. PDF mock extraction & chunking
        print("7. Testing PDF Service chunking...")
        pdf_util = PDFService()
        chunks = pdf_util.chunk_text(
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " * 10,
            chunk_size=100,
            overlap=20
        )
        assert len(chunks) > 1, f"Expected multiple chunks, got {len(chunks)}"
        print(f"   - Chunking split text into {len(chunks)} fragments.")

        # 8. Research Assistant agent flow
        print("8. Testing Agent (ResearchAssistant) context build & response generation...")
        agent = ResearchAssistant(db)
        context = agent.create_research_context(workspace.id, "layer learning")
        assert len(context) > 0, "Agent context was empty"
        print("   - Agent context compiled successfully.")

        response = agent.generate_research_response(workspace.id, "What do neural networks learn?")
        assert response is not None, "Agent response was None"
        print(f"   - Agent response generated (first 100 chars): '{response[:100]}...'")

        # Clean up workspace & user
        db.delete(workspace)
        db.delete(test_user)
        db.commit()
        print("   - Database cleaned up successfully.")

        print("=== ALL BACKEND INTEGRATION TESTS PASSED ===")

    except Exception as e:
        print(f"[FAIL] TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
