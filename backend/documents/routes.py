from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from datetime import datetime
from typing import List
from bson import ObjectId
from database import documents_collection, fs
from auth.dependencies import get_current_user, require_hr_role
from models.document import DocumentResponse
# [FAISS-DISABLED] from documents.services import extract_text_from_file, create_faiss_index_for_document
from documents.services import extract_text_from_file, create_pinecone_index_for_document

router = APIRouter(tags=["Documents"])


@router.post("/upload-document", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    create_chatbot: bool = Form(False),
    create_knowledge_cards: bool = Form(False),
    create_quiz: bool = Form(False),
    create_learning_path: bool = Form(False),
    use_ocr: bool = Form(False),
    hr_user: dict = Depends(require_hr_role),
):
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX, and TXT files are allowed",
        )

    file_content = await file.read()
    file_id = fs.put(
        file_content,
        filename=file.filename,
        content_type=file.content_type,
        upload_date=datetime.utcnow(),
        uploaded_by=hr_user["email"],
    )
    document_data = {
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "upload_date": datetime.utcnow(),
        "uploaded_by": hr_user["email"],
        "size": len(file_content),
        "is_active": True,
        "features": {
            "chatbot": create_chatbot,
            "knowledge_cards": create_knowledge_cards,
            "quiz": create_quiz,
            "learning_path": create_learning_path,
        },
    }
    result = documents_collection.insert_one(document_data)
    document_id = str(result.inserted_id)

    # Always extract text on upload (Phase 2 enhancement)
    try:
        print(f"Processing document: {file.filename}")
        text = extract_text_from_file(file_content, file.content_type, use_ocr=use_ocr)
        print(f"Extracted {len(text)} characters")

        update_fields = {
            "extracted_text": text,
            "text_extracted": True,
            "text_length": len(text),
        }

        if create_chatbot:
            # [FAISS-DISABLED] success = create_faiss_index_for_document(document_id, text)
            success = create_pinecone_index_for_document(document_id, text)
            update_fields["processed"] = success
            # [FAISS-DISABLED] print(f"FAISS index created: {success}")
            print(f"Pinecone index created: {success}")

        documents_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": update_fields},
        )
    except Exception as e:
        print(f"Error processing document: {e}")
        import traceback
        traceback.print_exc()
        documents_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"processed": False, "error": str(e)}},
        )

    # Notify all employees about new document
    from notifications.services import notify_new_document
    try:
        notify_new_document(file.filename, hr_user["email"])
    except Exception:
        pass

    return DocumentResponse(
        id=document_id,
        filename=file.filename,
        content_type=file.content_type,
        upload_date=document_data["upload_date"],
        uploaded_by=hr_user["email"],
        size=len(file_content),
    )


@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(current_user: dict = Depends(get_current_user)):
    documents = list(documents_collection.find({"is_active": True}))
    return [
        DocumentResponse(
            id=str(doc["_id"]),
            filename=doc["filename"],
            content_type=doc["content_type"],
            upload_date=doc["upload_date"],
            uploaded_by=doc["uploaded_by"],
            size=doc["size"],
        )
        for doc in documents
    ]


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, hr_user: dict = Depends(require_hr_role)):
    # [FAISS-DISABLED] from chatbots.services import invalidate_faiss_cache, invalidate_chain_cache
    from chatbots.services import invalidate_vectorstore_cache, invalidate_chain_cache
    from documents.services import delete_pinecone_namespace
    from database import chatbots_collection
    try:
        document = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
            )
        documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}},
        )
        # Invalidate caches for chatbots using this document
        # [FAISS-DISABLED] invalidate_faiss_cache(document_id)
        invalidate_vectorstore_cache(document_id)
        delete_pinecone_namespace(document_id)
        affected_bots = chatbots_collection.find({"document_id": document_id, "is_active": True})
        for bot in affected_bots:
            invalidate_chain_cache(str(bot["_id"]))
        return {"message": "Document deleted successfully"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
