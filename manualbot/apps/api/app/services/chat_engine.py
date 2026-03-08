"""RAG chat engine - retrieval augmented generation with citations."""
import time
import uuid
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.chat import Citation, ChatResponse

logger = get_logger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are a helpful AI assistant for {bot_name}. You answer questions based ONLY on the provided documentation context.

{custom_prompt}

IMPORTANT RULES:
1. Only answer based on the provided context below.
2. If the answer is not found in the context, say clearly: "I couldn't find information about that in the available documentation."
3. Always cite your sources by referencing the document name and page number when available.
4. Be concise and accurate.
5. Do not make up information or use knowledge outside the provided context.

Context from documentation:
{context}
"""

SYSTEM_PROMPT_RELAXED = """You are a helpful AI assistant for {bot_name}. You primarily answer questions based on the provided documentation context, but can also use general knowledge when relevant.

{custom_prompt}

Context from documentation:
{context}
"""


class ChatEngine:
    """RAG-based chat engine with citations."""

    def __init__(self):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )

    async def chat(
        self,
        message: str,
        bot_id: str,
        org_id: str,
        bot_name: str,
        system_prompt: Optional[str],
        strict_mode: bool,
        citation_mode: bool,
        fallback_message: str,
        chat_model: Optional[str],
        temperature: float,
        max_tokens: int,
        conversation_history: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Process a chat message with RAG.
        Returns answer, citations, sources, and metadata.
        """
        start_time = time.time()

        # Get query embedding
        from app.services.embeddings import get_embedding_provider
        embedding_provider = get_embedding_provider()
        query_vector = await embedding_provider.embed_query(message)

        # Retrieve relevant chunks
        from app.services.vector_store import get_vector_store
        vector_store = get_vector_store()
        search_results = await vector_store.search(
            query_vector=query_vector,
            bot_id=bot_id,
            org_id=org_id,
            top_k=settings.MAX_CHUNKS_PER_QUERY,
        )

        # Build context and citations
        context_parts = []
        citations = []
        sources = set()

        for i, result in enumerate(search_results):
            payload = result.payload
            text = payload.get("text", "")
            file_name = payload.get("file_name", "Unknown")
            page_number = payload.get("page_number")
            doc_id = payload.get("document_id", "")
            chunk_id = str(result.id)

            # Build context
            page_ref = f" (page {page_number})" if page_number else ""
            context_parts.append(f"[Source {i+1}: {file_name}{page_ref}]\n{text}")

            # Build citation
            if citation_mode:
                citations.append(Citation(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    file_name=file_name,
                    page_number=page_number,
                    text_snippet=text[:300] + "..." if len(text) > 300 else text,
                    score=result.score,
                ))

            sources.add(file_name)

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant documentation found."
        answer_found = len(search_results) > 0

        # Build system prompt
        custom = system_prompt or ""
        if strict_mode:
            sys_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                bot_name=bot_name,
                custom_prompt=custom,
                context=context,
            )
        else:
            sys_prompt = SYSTEM_PROMPT_RELAXED.format(
                bot_name=bot_name,
                custom_prompt=custom,
                context=context,
            )

        # Build messages
        messages = [{"role": "system", "content": sys_prompt}]

        # Add conversation history (last 6 turns)
        for turn in conversation_history[-6:]:
            messages.append(turn)

        messages.append({"role": "user", "content": message})

        # Call LLM
        model = chat_model or settings.CHAT_MODEL
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            answer = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
        except Exception as e:
            logger.error("llm_call_failed", error=str(e))
            if not answer_found:
                answer = fallback_message
            else:
                raise

        # If strict mode and no context found, use fallback
        if strict_mode and not answer_found:
            answer = fallback_message
            citations = []
            sources = set()

        latency_ms = int((time.time() - start_time) * 1000)

        # Determine confidence
        if not answer_found:
            confidence = "none"
        elif search_results and search_results[0].score > 0.7:
            confidence = "high"
        elif search_results and search_results[0].score > 0.5:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "answer": answer,
            "citations": citations,
            "sources": list(sources),
            "answer_found": answer_found,
            "confidence": confidence,
            "tokens_used": tokens_used,
            "latency_ms": latency_ms,
            "model_used": model,
        }


_chat_engine: Optional[ChatEngine] = None


def get_chat_engine() -> ChatEngine:
    """Get singleton chat engine instance."""
    global _chat_engine
    if _chat_engine is None:
        _chat_engine = ChatEngine()
    return _chat_engine
