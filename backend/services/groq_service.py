import os
from groq import Groq

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.client = None
        if self.api_key and "your_groq_api_key_here" not in self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception:
                self.client = None
        self.model = "llama-3.3-70b-versatile"

    def is_available(self) -> bool:
        return self.client is not None

    def chat_completion(self, messages: list[dict], system_prompt: str = None) -> str:
        if not self.is_available():
            # User feedback fallback mock if key not set
            return (
                "🤖 **[ResearchHub Assistant - Simulation Mode]**\n\n"
                "To activate live Llama 3.3 agent analysis, please update the `GROQ_API_KEY` in your backend `.env` file.\n\n"
                "**Simulated Context Response:**\n"
                f"You asked a question in this workspace. The assistant is prepared to analyze your papers, summarize PDFs, "
                f"and extract methodology, findings, and research gaps. Received message: \"{messages[-1]['content']}\""
            )

        payload = []
        if system_prompt:
            payload.append({"role": "system", "content": system_prompt})
        
        # Format messages properly for the API
        for msg in messages:
            payload.append({"role": msg["role"], "content": msg["content"]})

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=payload,
                temperature=0.3,
                max_tokens=2048
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"❌ **Error communicating with Groq API**: {str(e)}\n\nPlease double-check your API key and connection."
