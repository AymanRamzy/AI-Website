from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team_id: str
    user_id: str
    user_name: str
    message_type: MessageType = MessageType.TEXT
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    edited: bool = False
    edited_at: Optional[datetime] = None

class ChatMessageCreate(BaseModel):
    team_id: str
    message_type: MessageType = MessageType.TEXT
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: str
    team_id: str
    user_id: str
    user_name: str
    message_type: MessageType
    content: str
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    timestamp: datetime
    edited: bool
    edited_at: Optional[datetime]

class TypingIndicator(BaseModel):
    team_id: str
    user_id: str
    user_name: str
    is_typing: bool
