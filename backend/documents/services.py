import os
import io
import pypdf
import fitz
from PIL import Image
import pytesseract
from langchain.text_splitter import RecursiveCharacterTextSplitter
# [FAISS-DISABLED] from langchain.vectorstores import FAISS
from langchain_pinecone import PineconeVectorStore
from ai.embeddings import embeddings
from config import settings, pinecone_index


def extract_text_from_pdf(file_content: bytes, use_ocr: bool = True) -> str:
    text = ""
    try:
        pdf_document = fitz.open(stream=file_content, filetype="pdf")
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
            if use_ocr:
                try:
                    image_list = page.get_images(full=True)
                    for img_index, img in enumerate(image_list):
                        try:
                            xref = img[0]
                            base_image = pdf_document.extract_image(xref)
                            image_bytes = base_image["image"]
                            image = Image.open(io.BytesIO(image_bytes))
                            ocr_text = pytesseract.image_to_string(image)
                            if ocr_text and ocr_text.strip():
                                text += f"\n[Image {img_index + 1} on page {page_num + 1}]: {ocr_text}\n"
                        except Exception as e:
                            print(f"Error processing image: {e}")
                            continue
                except Exception as e:
                    print(f"OCR extraction error: {e}")
        pdf_document.close()
    except Exception as e:
        print(f"Primary PDF extraction failed: {e}. Falling back to pypdf.")
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            for p in reader.pages:
                try:
                    page_text = p.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception:
                    continue
        except Exception as e2:
            print(f"Fallback PDF extraction also failed: {e2}")
            text = "Error: Could not extract text from PDF"
    return text


def extract_text_from_file(file_content: bytes, content_type: str, use_ocr: bool = True) -> str:
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_content, use_ocr=use_ocr)
    else:
        return file_content.decode("utf-8", errors="ignore")


# [FAISS-DISABLED] def create_faiss_index_for_document(document_id: str, text: str) -> bool:
# [FAISS-DISABLED]     try:
# [FAISS-DISABLED]         text_splitter = RecursiveCharacterTextSplitter(
# [FAISS-DISABLED]             chunk_size=1000, chunk_overlap=200, length_function=len
# [FAISS-DISABLED]         )
# [FAISS-DISABLED]         chunks = text_splitter.split_text(text)
# [FAISS-DISABLED]         if not chunks:
# [FAISS-DISABLED]             raise ValueError("No text chunks created from document")
# [FAISS-DISABLED]         print(f"Created {len(chunks)} chunks from document")
# [FAISS-DISABLED]         vectorstore = FAISS.from_texts(texts=chunks, embedding=embeddings)
# [FAISS-DISABLED]         index_path = os.path.join(settings.FAISS_INDEX_DIR, f"doc_{document_id}")
# [FAISS-DISABLED]         vectorstore.save_local(index_path)
# [FAISS-DISABLED]         print(f"FAISS index created successfully for document {document_id}")
# [FAISS-DISABLED]         return True
# [FAISS-DISABLED]     except Exception as e:
# [FAISS-DISABLED]         print(f"Error creating FAISS index: {e}")
# [FAISS-DISABLED]         import traceback
# [FAISS-DISABLED]         traceback.print_exc()
# [FAISS-DISABLED]         return False


def create_pinecone_index_for_document(document_id: str, text: str) -> bool:
    """Chunk text and upsert embeddings into Pinecone under a document-specific namespace."""
    try:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, length_function=len
        )
        chunks = text_splitter.split_text(text)

        if not chunks:
            raise ValueError("No text chunks created from document")

        print(f"Created {len(chunks)} chunks from document")

        PineconeVectorStore.from_texts(
            texts=chunks,
            embedding=embeddings,
            index_name=settings.PINECONE_INDEX_NAME,
            namespace=f"doc_{document_id}",
        )

        print(f"Pinecone vectors upserted for document {document_id} in namespace doc_{document_id}")
        return True
    except Exception as e:
        print(f"Error creating Pinecone index: {e}")
        import traceback
        traceback.print_exc()
        return False


# [FAISS-DISABLED] def load_faiss_index_for_document(document_id: str):
# [FAISS-DISABLED]     try:
# [FAISS-DISABLED]         index_path = os.path.join(settings.FAISS_INDEX_DIR, f"doc_{document_id}")
# [FAISS-DISABLED]         if not os.path.exists(index_path):
# [FAISS-DISABLED]             print(f"FAISS index not found at {index_path}")
# [FAISS-DISABLED]             return None
# [FAISS-DISABLED]         vectorstore = FAISS.load_local(
# [FAISS-DISABLED]             index_path, embeddings, allow_dangerous_deserialization=True
# [FAISS-DISABLED]         )
# [FAISS-DISABLED]         print(f"FAISS index loaded successfully for document {document_id}")
# [FAISS-DISABLED]         return vectorstore
# [FAISS-DISABLED]     except Exception as e:
# [FAISS-DISABLED]         print(f"Error loading FAISS index: {e}")
# [FAISS-DISABLED]         import traceback
# [FAISS-DISABLED]         traceback.print_exc()
# [FAISS-DISABLED]         return None


def get_pinecone_vectorstore_for_document(document_id: str):
    """Return a PineconeVectorStore scoped to a document's namespace.

    Unlike FAISS, there is nothing to 'load' -- this creates a lightweight
    wrapper that queries Pinecone's API filtered to the namespace.
    """
    try:
        namespace = f"doc_{document_id}"

        # Check if namespace has vectors
        stats = pinecone_index.describe_index_stats()
        if namespace not in stats.get("namespaces", {}):
            print(f"Pinecone namespace {namespace} not found")
            return None

        vectorstore = PineconeVectorStore(
            index=pinecone_index,
            embedding=embeddings,
            namespace=namespace,
        )
        print(f"Pinecone vectorstore created for document {document_id}")
        return vectorstore
    except Exception as e:
        print(f"Error creating Pinecone vectorstore: {e}")
        import traceback
        traceback.print_exc()
        return None


def delete_pinecone_namespace(document_id: str):
    """Delete all vectors in a document's Pinecone namespace."""
    try:
        namespace = f"doc_{document_id}"
        pinecone_index.delete(delete_all=True, namespace=namespace)
        print(f"Deleted Pinecone namespace {namespace}")
    except Exception as e:
        print(f"Error deleting Pinecone namespace: {e}")


def get_document_text(document_id: str) -> str:
    """Get extracted text for a document. Checks stored text first, falls back to GridFS re-extraction."""
    from database import documents_collection, fs
    from bson import ObjectId

    doc = documents_collection.find_one({"_id": ObjectId(document_id)})
    if not doc:
        return ""

    # Check if text is already stored
    if doc.get("extracted_text"):
        return doc["extracted_text"]

    # Fallback: re-extract from GridFS
    try:
        grid_file = fs.get(doc["file_id"])
        file_content = grid_file.read()
        text = extract_text_from_file(file_content, doc["content_type"])

        # Store for future use
        documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"extracted_text": text}},
        )
        return text
    except Exception as e:
        print(f"Error extracting text from GridFS: {e}")
        return ""
