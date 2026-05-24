from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: str
    upload_date: datetime
    uploaded_by: str
    size: int
