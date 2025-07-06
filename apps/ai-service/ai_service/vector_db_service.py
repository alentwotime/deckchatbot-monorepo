"""
Vector Database Service using ChromaDB

This module provides vector database functionality for enhanced knowledge retrieval
and contextual responses as recommended in the research report.
"""

import os
import json
from typing import List, Dict, Any, Optional
import uuid

# Try to import chromadb, but provide a fallback if it's not available
try:
    # Monkey patch for ChromaDB telemetry issue
    import chromadb
    import chromadb.telemetry.posthog
    CHROMADB_AVAILABLE = True
except ImportError:
    print("Warning: chromadb not available. Using stub implementation.")
    CHROMADB_AVAILABLE = False

# Only apply monkey patch if chromadb is available
if CHROMADB_AVAILABLE:
    # Override the problematic capture method to fix "capture() takes 1 positional argument but 3 were given" error
    original_capture = chromadb.telemetry.posthog.capture
    def safe_capture(*args, **kwargs):
        try:
            if len(args) == 1:
                return original_capture(*args, **kwargs)
            # If more arguments are provided, adjust to match the expected signature
            return original_capture(args[0])
        except Exception:
            # Silently fail if telemetry capture fails
            return None

    chromadb.telemetry.posthog.capture = safe_capture

    from chromadb.config import Settings

# Try to import sentence_transformers, but provide a fallback if it's not available
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    print("Warning: sentence_transformers not available. Using stub implementation.")
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class VectorDBService:
    """Service for managing vector embeddings and semantic search."""

    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.is_available = CHROMADB_AVAILABLE and SENTENCE_TRANSFORMERS_AVAILABLE

        if not self.is_available:
            print("VectorDBService is running in stub mode due to missing dependencies.")
            self.client = None
            self.embedding_model = None
            self.deck_knowledge_collection = None
            self.conversation_history_collection = None
            self.blueprint_analysis_collection = None
            return

        # Only initialize if dependencies are available
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

        # Initialize collections
        self.deck_knowledge_collection = self._get_or_create_collection("deck_knowledge")
        self.conversation_history_collection = self._get_or_create_collection("conversation_history")
        self.blueprint_analysis_collection = self._get_or_create_collection("blueprint_analysis")

    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection."""
        if not self.is_available:
            return None

        try:
            return self.client.get_collection(name=name)
        except ValueError:
            return self.client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )

    async def add_deck_knowledge(self, content: str, metadata: Dict[str, Any]) -> str:
        """
        Add deck design knowledge to the vector database.

        Args:
            content (str): The knowledge content
            metadata (Dict[str, Any]): Associated metadata

        Returns:
            str: Document ID
        """
        doc_id = str(uuid.uuid4())

        if not self.is_available:
            print(f"Skipping add_deck_knowledge in stub mode: {content[:50]}...")
            return doc_id

        # Generate embedding
        embedding = self.embedding_model.encode(content).tolist()

        # Add to collection
        self.deck_knowledge_collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id]
        )

        return doc_id

    async def search_deck_knowledge(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant deck knowledge based on query.

        Args:
            query (str): Search query
            n_results (int): Number of results to return

        Returns:
            List[Dict[str, Any]]: Search results with content and metadata
        """
        if not self.is_available:
            print(f"Skipping search_deck_knowledge in stub mode: {query}")
            return []

        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Search collection
        results = self.deck_knowledge_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        formatted_results = []
        for i in range(len(results["documents"][0])):
            formatted_results.append({
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "similarity_score": 1 - results["distances"][0][i]  # Convert distance to similarity
            })

        return formatted_results

    async def store_conversation_context(self, user_id: str, conversation_data: Dict[str, Any]) -> str:
        """
        Store conversation context for future reference.

        Args:
            user_id (str): User identifier
            conversation_data (Dict[str, Any]): Conversation data

        Returns:
            str: Context ID
        """
        context_id = str(uuid.uuid4())

        if not self.is_available:
            print(f"Skipping store_conversation_context in stub mode")
            return context_id

        # Create searchable content from conversation
        content = f"User: {conversation_data.get('user_message', '')} Assistant: {conversation_data.get('assistant_response', '')}"

        # Generate embedding
        embedding = self.embedding_model.encode(content).tolist()

        # Add metadata
        metadata = {
            "user_id": user_id,
            "timestamp": conversation_data.get("timestamp"),
            "stage": conversation_data.get("stage", "unknown"),
            "context_type": "conversation"
        }
        metadata.update(conversation_data.get("metadata", {}))

        # Store in collection
        self.conversation_history_collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata],
            ids=[context_id]
        )

        return context_id

    async def get_conversation_context(self, user_id: str, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve relevant conversation context for a user.

        Args:
            user_id (str): User identifier
            query (str): Current query to find relevant context
            n_results (int): Number of context items to return

        Returns:
            List[Dict[str, Any]]: Relevant conversation context
        """
        if not self.is_available:
            print(f"Skipping get_conversation_context in stub mode: {query}")
            return []

        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Search with user filter
        results = self.conversation_history_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results * 2,  # Get more results to filter by user
            include=["documents", "metadatas", "distances"],
            where={"user_id": user_id}
        )

        # Format and filter results
        formatted_results = []
        for i in range(len(results["documents"][0])):
            if len(formatted_results) >= n_results:
                break

            formatted_results.append({
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "similarity_score": 1 - results["distances"][0][i]
            })

        return formatted_results

    async def store_blueprint_analysis(self, analysis_data: Dict[str, Any]) -> str:
        """
        Store blueprint analysis results for future reference.

        Args:
            analysis_data (Dict[str, Any]): Blueprint analysis data

        Returns:
            str: Analysis ID
        """
        analysis_id = str(uuid.uuid4())

        if not self.is_available:
            print(f"Skipping store_blueprint_analysis in stub mode")
            return analysis_id

        # Create searchable content
        content = f"Blueprint Analysis: {analysis_data.get('description', '')} Dimensions: {analysis_data.get('dimensions', '')} Materials: {analysis_data.get('materials', '')}"

        # Generate embedding
        embedding = self.embedding_model.encode(content).tolist()

        # Prepare metadata
        metadata = {
            "analysis_type": "blueprint",
            "timestamp": analysis_data.get("timestamp"),
            "file_name": analysis_data.get("file_name"),
            "user_id": analysis_data.get("user_id")
        }
        metadata.update(analysis_data.get("metadata", {}))

        # Store in collection
        self.blueprint_analysis_collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata],
            ids=[analysis_id]
        )

        return analysis_id

    async def search_similar_blueprints(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar blueprint analyses.

        Args:
            query (str): Search query (description, dimensions, etc.)
            n_results (int): Number of results to return

        Returns:
            List[Dict[str, Any]]: Similar blueprint analyses
        """
        if not self.is_available:
            print(f"Skipping search_similar_blueprints in stub mode: {query}")
            return []

        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Search collection
        results = self.blueprint_analysis_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        formatted_results = []
        for i in range(len(results["documents"][0])):
            formatted_results.append({
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "similarity_score": 1 - results["distances"][0][i]
            })

        return formatted_results

    async def initialize_default_knowledge(self):
        """Initialize the database with default deck design knowledge."""
        if not self.is_available:
            print("Skipping initialize_default_knowledge in stub mode")
            return

        default_knowledge = [
            {
                "content": "Standard deck joist spacing is typically 16 inches on center for residential decks. This provides adequate support for most decking materials.",
                "metadata": {"category": "structural", "topic": "joists", "importance": "high"}
            },
            {
                "content": "Deck railing height must be at least 36 inches for decks less than 30 inches above grade, and 42 inches for higher decks according to most building codes.",
                "metadata": {"category": "safety", "topic": "railings", "importance": "critical"}
            },
            {
                "content": "Pressure-treated lumber is the most common material for deck framing due to its resistance to moisture and insects.",
                "metadata": {"category": "materials", "topic": "lumber", "importance": "medium"}
            },
            {
                "content": "Deck footings should extend below the frost line in your area to prevent heaving and structural damage.",
                "metadata": {"category": "foundation", "topic": "footings", "importance": "high"}
            },
            {
                "content": "Composite decking requires less maintenance than wood but may have specific installation requirements for expansion gaps.",
                "metadata": {"category": "materials", "topic": "composite", "importance": "medium"}
            }
        ]

        for knowledge in default_knowledge:
            await self.add_deck_knowledge(knowledge["content"], knowledge["metadata"])

    def get_collection_stats(self) -> Dict[str, int]:
        """Get statistics about the vector database collections."""
        if not self.is_available:
            return {
                "deck_knowledge_count": 0,
                "conversation_history_count": 0,
                "blueprint_analysis_count": 0,
                "status": "unavailable"
            }

        return {
            "deck_knowledge_count": self.deck_knowledge_collection.count(),
            "conversation_history_count": self.conversation_history_collection.count(),
            "blueprint_analysis_count": self.blueprint_analysis_collection.count(),
            "status": "available"
        }

    async def reset_collections(self):
        """Reset all collections (use with caution)."""
        if not self.is_available:
            print("Skipping reset_collections in stub mode")
            return

        self.client.reset()
        self.deck_knowledge_collection = self._get_or_create_collection("deck_knowledge")
        self.conversation_history_collection = self._get_or_create_collection("conversation_history")
        self.blueprint_analysis_collection = self._get_or_create_collection("blueprint_analysis")


# Global instance for easy access
vector_db_service = VectorDBService()


async def enhance_query_with_context(query: str, user_id: str = None) -> Dict[str, Any]:
    """
    Enhance a query with relevant context from the vector database.

    Args:
        query (str): The user query
        user_id (str, optional): User identifier for personalized context

    Returns:
        Dict[str, Any]: Enhanced query with context
    """
    # Check if vector_db_service is available
    if not vector_db_service.is_available:
        print(f"Skipping enhance_query_with_context in stub mode: {query}")
        return {
            "original_query": query,
            "relevant_knowledge": [],
            "conversation_context": [],
            "similar_blueprints": [],
            "enhanced_context": f"Note: Vector database is not available. Query: {query}"
        }

    # Search for relevant knowledge
    knowledge_results = await vector_db_service.search_deck_knowledge(query, n_results=3)

    # Get conversation context if user_id provided
    conversation_context = []
    if user_id:
        conversation_context = await vector_db_service.get_conversation_context(user_id, query, n_results=2)

    # Search for similar blueprints
    blueprint_context = await vector_db_service.search_similar_blueprints(query, n_results=2)

    return {
        "original_query": query,
        "relevant_knowledge": knowledge_results,
        "conversation_context": conversation_context,
        "similar_blueprints": blueprint_context,
        "enhanced_context": _format_context_for_prompt(knowledge_results, conversation_context, blueprint_context)
    }


def _format_context_for_prompt(knowledge_results: List[Dict], conversation_context: List[Dict], 
                              blueprint_context: List[Dict]) -> str:
    """Format context information for use in AI prompts."""
    context_parts = []

    if knowledge_results:
        context_parts.append("Relevant Knowledge:")
        for result in knowledge_results[:2]:  # Limit to top 2 results
            context_parts.append(f"- {result['content']}")

    if conversation_context:
        context_parts.append("\nPrevious Conversation Context:")
        for context in conversation_context[:1]:  # Limit to most recent
            context_parts.append(f"- {context['content']}")

    if blueprint_context:
        context_parts.append("\nSimilar Blueprint Analyses:")
        for context in blueprint_context[:1]:  # Limit to most similar
            context_parts.append(f"- {context['content']}")

    return "\n".join(context_parts)
