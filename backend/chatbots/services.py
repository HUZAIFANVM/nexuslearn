from collections import OrderedDict
from datetime import datetime
# [FAISS-DISABLED] from documents.services import load_faiss_index_for_document
from documents.services import get_pinecone_vectorstore_for_document
from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from ai.llm import global_llm, streaming_llm
from database import chat_history_collection, chatbots_collection

# [FAISS-DISABLED] # FAISS cache: document_id -> vectorstore
# [FAISS-DISABLED] faiss_cache = {}

MAX_CHAIN_CACHE = 50  # Max cached chains to prevent unbounded growth

# Chain cache: chatbot_id -> ConversationalRetrievalChain (non-streaming)
chatbot_chains = OrderedDict()

# Streaming chain cache: chatbot_id -> ConversationalRetrievalChain (streaming)
streaming_chains = OrderedDict()

MAX_CHAT_HISTORY = 20  # Reduced from 50 — 20 recent pairs is sufficient for context
MAX_STORED_HISTORY = 100  # Total messages to keep in DB per user+chatbot


# [FAISS-DISABLED] def get_faiss_index(document_id: str):
# [FAISS-DISABLED]     """Get or load FAISS index for a document, with in-memory caching."""
# [FAISS-DISABLED]     if document_id not in faiss_cache:
# [FAISS-DISABLED]         result = load_faiss_index_for_document(document_id)
# [FAISS-DISABLED]         if result is not None:
# [FAISS-DISABLED]             faiss_cache[document_id] = result
# [FAISS-DISABLED]             print(f"FAISS index cached for document {document_id}")
# [FAISS-DISABLED]         return result
# [FAISS-DISABLED]     return faiss_cache[document_id]


def get_vectorstore(document_id: str):
    """Get a PineconeVectorStore for a document.

    No caching needed -- PineconeVectorStore is a stateless API wrapper.
    """
    return get_pinecone_vectorstore_for_document(document_id)


def _evict_if_full(cache: OrderedDict):
    """Evict oldest entries if cache exceeds max size."""
    while len(cache) > MAX_CHAIN_CACHE:
        cache.popitem(last=False)


def get_or_create_chain(chatbot_id: str, vectorstore, use_streaming: bool = False):
    """Get or create a ConversationalRetrievalChain, optionally with streaming."""
    cache = streaming_chains if use_streaming else chatbot_chains
    llm = streaming_llm if use_streaming else global_llm

    if chatbot_id not in cache:
        chain_kwargs = {
            "llm": llm,
            "retriever": vectorstore.as_retriever(search_kwargs={"k": 3}),
            "return_source_documents": True,
            "verbose": False,
        }
        # For streaming: use non-streaming LLM for the condense question step
        # so the callback only captures tokens from the actual answer step
        if use_streaming:
            chain_kwargs["condense_question_llm"] = global_llm
        cache[chatbot_id] = ConversationalRetrievalChain.from_llm(**chain_kwargs)
        _evict_if_full(cache)
    else:
        # Move to end (most recently used)
        cache.move_to_end(chatbot_id)
    return cache[chatbot_id]


def invalidate_chain_cache(chatbot_id: str):
    """Remove cached chains when a chatbot's document is updated."""
    chatbot_chains.pop(chatbot_id, None)
    streaming_chains.pop(chatbot_id, None)


# [FAISS-DISABLED] def invalidate_faiss_cache(document_id: str):
# [FAISS-DISABLED]     """Remove cached FAISS index when document is re-processed or deleted."""
# [FAISS-DISABLED]     faiss_cache.pop(document_id, None)


def invalidate_vectorstore_cache(document_id: str):
    """No-op for Pinecone -- no local cache to invalidate."""
    pass


def get_chat_history_pairs(chatbot_id: str, user_id: str) -> list:
    """
    Fetch the last N chat history pairs for LLM context using a single
    MongoDB aggregation pipeline. Returns list of (user_message, bot_response) tuples.
    """
    pipeline = [
        {"$match": {"chatbot_id": chatbot_id, "user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$limit": MAX_CHAT_HISTORY},
        {"$project": {"user_message": 1, "bot_response": 1, "timestamp": 1, "_id": 0}},
    ]
    results = list(chat_history_collection.aggregate(pipeline))
    # Reverse to chronological order for context
    results.reverse()
    return [(r["user_message"], r["bot_response"]) for r in results]


def save_chat_record(
    chatbot_id: str, user_id: str, user_email: str,
    user_message: str, bot_response: str
) -> str:
    """
    Save a chat record and trim old history efficiently.
    Returns the inserted record ID as string.
    """
    chat_record = {
        "chatbot_id": chatbot_id,
        "user_id": user_id,
        "user_email": user_email,
        "user_message": user_message,
        "bot_response": bot_response,
        "timestamp": datetime.utcnow(),
    }
    result = chat_history_collection.insert_one(chat_record)

    # Efficient trim: find the cutoff timestamp, then bulk delete everything older
    pipeline = [
        {"$match": {"chatbot_id": chatbot_id, "user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$skip": MAX_STORED_HISTORY},
        {"$limit": 1},
        {"$project": {"timestamp": 1}},
    ]
    cutoff = list(chat_history_collection.aggregate(pipeline))
    if cutoff:
        chat_history_collection.delete_many({
            "chatbot_id": chatbot_id,
            "user_id": user_id,
            "timestamp": {"$lte": cutoff[0]["timestamp"]},
        })

    return str(result.inserted_id)


# [FAISS-DISABLED] def preload_faiss_indexes():
# [FAISS-DISABLED]     """Pre-load FAISS indexes for all active chatbots at startup."""
# [FAISS-DISABLED]     active_chatbots = chatbots_collection.find({"is_active": True})
# [FAISS-DISABLED]     loaded = 0
# [FAISS-DISABLED]     for bot in active_chatbots:
# [FAISS-DISABLED]         doc_id = bot["document_id"]
# [FAISS-DISABLED]         if doc_id not in faiss_cache:
# [FAISS-DISABLED]             result = load_faiss_index_for_document(doc_id)
# [FAISS-DISABLED]             if result is not None:
# [FAISS-DISABLED]                 faiss_cache[doc_id] = result
# [FAISS-DISABLED]                 loaded += 1
# [FAISS-DISABLED]     print(f"Pre-loaded {loaded} FAISS indexes at startup")
