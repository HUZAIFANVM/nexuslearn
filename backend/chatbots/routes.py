import asyncio
import json
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import List
from bson import ObjectId
from bson.errors import InvalidId
from database import chatbots_collection, chat_history_collection, documents_collection
from config import settings
from auth.dependencies import get_current_user, require_hr_role
from ai.usage import ai_quota, count_llm_call
from models.chatbot import ChatbotCreate, ChatbotResponse, ChatMessage, ChatResponse
# [FAISS-DISABLED] from chatbots.services import (
# [FAISS-DISABLED]     get_faiss_index, get_or_create_chain,
# [FAISS-DISABLED]     get_chat_history_pairs, save_chat_record,
# [FAISS-DISABLED]     invalidate_chain_cache,
# [FAISS-DISABLED] )
from chatbots.services import (
    get_vectorstore, get_or_create_chain,
    get_chat_history_pairs, save_chat_record,
    invalidate_chain_cache,
)

router = APIRouter(tags=["Chatbots"])


def _parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {id_str}")


@router.post("/chatbots", response_model=ChatbotResponse)
async def create_chatbot_endpoint(
    chatbot_data: ChatbotCreate, hr_user: dict = Depends(require_hr_role)
):
    document = documents_collection.find_one({"_id": _parse_object_id(chatbot_data.document_id)})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    if not document.get("processed", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document was not processed for chatbot. Please re-upload with 'Create Chatbot' enabled.",
        )
    if chatbot_data.access_type == "specific":
        if not chatbot_data.departments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Departments required for specific access",
            )
        for dept in chatbot_data.departments:
            if dept not in settings.DEPARTMENTS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid department: {dept}",
                )

    chatbot_doc = {
        "name": chatbot_data.name,
        "document_id": chatbot_data.document_id,
        "document_name": document["filename"],
        "access_type": chatbot_data.access_type,
        "departments": chatbot_data.departments
        if chatbot_data.access_type == "specific"
        else [],
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = chatbots_collection.insert_one(chatbot_doc)

    # Notify target employees
    from notifications.services import notify_new_chatbot
    try:
        notify_new_chatbot(chatbot_data.name, chatbot_data.access_type, chatbot_doc["departments"], hr_user["email"])
    except Exception:
        pass

    return ChatbotResponse(
        id=str(result.inserted_id),
        name=chatbot_data.name,
        document_id=chatbot_data.document_id,
        document_name=document["filename"],
        access_type=chatbot_data.access_type,
        departments=chatbot_doc["departments"],
        created_by=hr_user["email"],
        created_at=chatbot_doc["created_at"],
    )


@router.get("/chatbots", response_model=List[ChatbotResponse])
async def get_chatbots(current_user: dict = Depends(get_current_user)):
    query = {"is_active": True}
    if current_user["role"] == "employee":
        user_dept = current_user.get("department")
        if not user_dept:
            raise HTTPException(status_code=403, detail="User department not set")
        query["$or"] = [{"access_type": "all"}, {"departments": user_dept}]
    chatbots = list(chatbots_collection.find(query))
    return [
        ChatbotResponse(
            id=str(bot["_id"]),
            name=bot["name"],
            document_id=bot["document_id"],
            document_name=bot["document_name"],
            access_type=bot["access_type"],
            departments=bot.get("departments", []),
            created_by=bot["created_by"],
            created_at=bot["created_at"],
        )
        for bot in chatbots
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    chat_data: ChatMessage, current_user: dict = Depends(get_current_user),
    _quota: dict = Depends(ai_quota),
):
    chatbot = chatbots_collection.find_one({"_id": _parse_object_id(chat_data.chatbot_id)})
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if current_user["role"] == "employee" and chatbot["access_type"] == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in chatbot["departments"]:
            raise HTTPException(status_code=403, detail="Access denied")

    # [FAISS-DISABLED] vectorstore = get_faiss_index(chatbot["document_id"])
    vectorstore = get_vectorstore(chatbot["document_id"])
    if not vectorstore:
        raise HTTPException(
            status_code=500, detail="Document index not found. Recreate chatbot."
        )

    # Optimized: single aggregation pipeline for history
    chat_history = get_chat_history_pairs(
        chat_data.chatbot_id, str(current_user["_id"])
    )

    try:
        chain = get_or_create_chain(chat_data.chatbot_id, vectorstore)
        count_llm_call()
        result = chain(
            {"question": chat_data.message, "chat_history": chat_history}
        )
        bot_response = result.get("answer", "No answer found.")
    except Exception as e:
        traceback.print_exc()
        bot_response = f"I apologize, an error occurred: {str(e)}"

    # Optimized: single insert + conditional trim
    chat_id = save_chat_record(
        chat_data.chatbot_id,
        str(current_user["_id"]),
        current_user["email"],
        chat_data.message,
        bot_response,
    )

    return ChatResponse(response=bot_response, chat_id=chat_id)


@router.post("/chat/stream")
async def chat_with_bot_stream(
    chat_data: ChatMessage, current_user: dict = Depends(get_current_user),
    _quota: dict = Depends(ai_quota),
):
    """Stream chat response using Server-Sent Events.

    Manually handles: condense question -> retrieve docs -> stream answer.
    We can't use ConversationalRetrievalChain for streaming because its
    internal condense step triggers on_llm_end which kills the async iterator.
    """
    from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
    from langchain_core.messages import HumanMessage
    from langchain_core.prompts import PromptTemplate
    from ai.llm import global_llm, streaming_llm

    chatbot = chatbots_collection.find_one({"_id": _parse_object_id(chat_data.chatbot_id)})
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if current_user["role"] == "employee" and chatbot["access_type"] == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in chatbot["departments"]:
            raise HTTPException(status_code=403, detail="Access denied")

    # [FAISS-DISABLED] vectorstore = get_faiss_index(chatbot["document_id"])
    vectorstore = get_vectorstore(chatbot["document_id"])
    if not vectorstore:
        raise HTTPException(status_code=500, detail="Document index not found.")

    chat_history = get_chat_history_pairs(
        chat_data.chatbot_id, str(current_user["_id"])
    )

    # Step 1: Condense question with chat history (non-streaming, fast)
    question = chat_data.message
    if chat_history:
        history_text = "\n".join(
            f"Human: {h}\nAssistant: {a}" for h, a in chat_history[-5:]
        )
        condense_template = PromptTemplate.from_template(
            "Given the following conversation and a follow up question, "
            "rephrase the follow up question to be a standalone question.\n\n"
            "Chat History:\n{history}\n\n"
            "Follow Up Input: {question}\n"
            "Standalone question:"
        )
        try:
            count_llm_call()
            condensed = global_llm.predict(
                condense_template.format(history=history_text, question=question)
            )
            question = condensed.strip()
        except Exception:
            pass  # Use original question if condense fails

    # Step 2: Retrieve relevant documents
    from chatbots.services import CHATBOT_RETRIEVER_K
    retriever = vectorstore.as_retriever(search_kwargs={"k": CHATBOT_RETRIEVER_K})
    docs = retriever.get_relevant_documents(question)
    context = "\n\n".join(doc.page_content for doc in docs)

    # Step 3: Build the QA prompt and stream the answer. Use the SAME strict,
    # grounded prompt as the non-streaming chain so behaviour is identical
    # (answer only from context, refuse otherwise, quote numbers verbatim).
    from ai.prompts import CHATBOT_QA_PROMPT
    qa_prompt = CHATBOT_QA_PROMPT.format(context=context, question=question)

    callback = AsyncIteratorCallbackHandler()

    async def generate_sse():
        full_response = ""

        count_llm_call()
        task = asyncio.create_task(
            streaming_llm.agenerate(
                [[HumanMessage(content=qa_prompt)]],
                callbacks=[callback],
            )
        )

        try:
            async for token in callback.aiter():
                full_response += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            await task
            yield f"data: {json.dumps({'done': True, 'full_response': full_response})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            full_response = full_response or f"I apologize, an error occurred: {str(e)}"
        finally:
            # Ensure the LLM task is properly cleaned up
            if not task.done():
                task.cancel()
                try:
                    await task
                except (asyncio.CancelledError, Exception):
                    pass

        # Save to DB after stream completes
        save_chat_record(
            chat_data.chatbot_id,
            str(current_user["_id"]),
            current_user["email"],
            chat_data.message,
            full_response,
        )

    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/chat-history/{chatbot_id}")
async def get_chat_history(
    chatbot_id: str, current_user: dict = Depends(get_current_user)
):
    history = list(
        chat_history_collection.find(
            {"chatbot_id": chatbot_id, "user_id": str(current_user["_id"])}
        )
        .sort("timestamp", -1)
        .limit(50)
    )
    return [
        {
            "id": str(msg["_id"]),
            "user_message": msg["user_message"],
            "bot_response": msg["bot_response"],
            "timestamp": msg["timestamp"],
        }
        for msg in reversed(history)
    ]


@router.delete("/chat-history/{chatbot_id}")
async def clear_chat_history(
    chatbot_id: str, current_user: dict = Depends(get_current_user)
):
    """Clear all chat history for the current user with a specific chatbot."""
    result = chat_history_collection.delete_many({
        "chatbot_id": chatbot_id,
        "user_id": str(current_user["_id"]),
    })
    return {"message": f"Cleared {result.deleted_count} messages"}


@router.delete("/chatbots/{chatbot_id}")
async def delete_chatbot(chatbot_id: str, hr_user: dict = Depends(require_hr_role)):
    oid = _parse_object_id(chatbot_id)
    chatbot = chatbots_collection.find_one({"_id": oid})
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chatbot not found"
        )
    chatbots_collection.update_one(
        {"_id": oid},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}},
    )
    # Invalidate caches
    invalidate_chain_cache(chatbot_id)
    return {"message": "Chatbot deleted successfully"}
