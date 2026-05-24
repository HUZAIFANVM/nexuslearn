from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatbotCreate(BaseModel):
    name: str
    document_id: str
    access_type: str
    departments: Optional[List[str]] = None


class ChatbotResponse(BaseModel):
    id: str
    name: str
    document_id: str
    document_name: str
    access_type: str
    departments: List[str]
    created_by: str
    created_at: datetime


class ChatMessage(BaseModel):
    chatbot_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    chat_id: str
