from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.responses import FileResponse
from typing import List
import os
import aiofiles
from pathlib import Path
from datetime import datetime

from supabase_client import get_supabase_client
from models import User
from chat_models import (
    ChatMessage,
    ChatMessageCreate,
    ChatMessageResponse,
    MessageType,
)
from auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

@router.post("/messages", response_model=ChatMessageResponse)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        supabase = get_supabase_client()
        
        # Verify team exists
        team_response = supabase.table('teams').select('*').eq('id', message_data.team_id).execute()
        
        if not team_response.data or len(team_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        
        # Verify user is team member
        member_response = supabase.table('team_members')\
            .select('*')\
            .eq('team_id', message_data.team_id)\
            .eq('user_id', current_user.id)\
            .execute()
        
        if not member_response.data or len(member_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this team"
            )
        
        # Build message payload
        message_dict = {
            "team_id": message_data.team_id,
            "user_id": current_user.id,
            "user_name": current_user.full_name,
            "message_type": message_data.message_type.value,
            "content": message_data.content,
            "file_url": message_data.file_url,
            "file_name": message_data.file_name,
            "file_size": message_data.file_size
        }
        
        logger.info(f"Chat insert payload: {message_dict}")
        
        # Insert to database
        response = supabase.table('chat_messages').insert(message_dict).execute()
        
        logger.info(f"Chat insert response: {response}")
        
        if not response.data or len(response.data) == 0:
            logger.error(f"Chat insert failed - no data returned")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message - no data returned"
            )
        
        msg = response.data[0]
        logger.info(f"Chat message created: {msg['id']}")
        
        # Use created_at from database (not timestamp)
        msg_timestamp = msg.get('created_at') or msg.get('timestamp')
        msg_edited_at = msg.get('edited_at')
        
        return ChatMessageResponse(
            id=msg['id'],
            team_id=msg['team_id'],
            user_id=msg['user_id'],
            user_name=msg['user_name'],
            message_type=MessageType(msg['message_type']),
            content=msg['content'],
            file_url=msg.get('file_url'),
            file_name=msg.get('file_name'),
            file_size=msg.get('file_size'),
            timestamp=datetime.fromisoformat(msg_timestamp.replace('Z', '+00:00')) if isinstance(msg_timestamp, str) else msg_timestamp,
            edited=msg.get('edited', False),
            edited_at=datetime.fromisoformat(msg_edited_at.replace('Z', '+00:00')) if msg_edited_at and isinstance(msg_edited_at, str) else msg_edited_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat message error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )

@router.get("/messages/{team_id}", response_model=List[ChatMessageResponse])
async def get_team_messages(
    team_id: str,
    limit: int = 100,
    before_id: str = None,
    current_user: User = Depends(get_current_user)
):
    supabase = get_supabase_client()

    team_response = supabase.table('teams').select('*').eq('id', team_id).execute()

    if not team_response.data or len(team_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    member_response = supabase.table('team_members')\
        .select('*')\
        .eq('team_id', team_id)\
        .eq('user_id', current_user.id)\
        .execute()

    if not member_response.data or len(member_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    query = supabase.table('chat_messages').select('*').eq('team_id', team_id)

    if before_id:
        before_msg_response = supabase.table('chat_messages').select('created_at').eq('id', before_id).execute()
        if before_msg_response.data and len(before_msg_response.data) > 0:
            before_timestamp = before_msg_response.data[0]['created_at']
            query = query.lt('created_at', before_timestamp)

    response = query.order('created_at', desc=False).limit(limit).execute()

    messages = []
    for msg in response.data:
        msg_timestamp = msg.get('created_at') or msg.get('timestamp')
        msg_edited_at = msg.get('edited_at')
        
        messages.append(ChatMessageResponse(
            id=msg['id'],
            team_id=msg['team_id'],
            user_id=msg['user_id'],
            user_name=msg['user_name'],
            message_type=MessageType(msg['message_type']),
            content=msg['content'],
            file_url=msg.get('file_url'),
            file_name=msg.get('file_name'),
            file_size=msg.get('file_size'),
            timestamp=datetime.fromisoformat(msg_timestamp.replace('Z', '+00:00')) if isinstance(msg_timestamp, str) else msg_timestamp,
            edited=msg.get('edited', False),
            edited_at=datetime.fromisoformat(msg_edited_at.replace('Z', '+00:00')) if msg_edited_at and isinstance(msg_edited_at, str) else msg_edited_at
        ))

    return messages

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    max_size = 10 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit"
        )

    user_dir = UPLOAD_DIR / current_user.id
    user_dir.mkdir(exist_ok=True, parents=True)

    import uuid
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = user_dir / unique_filename

    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    file_url = f"/api/chat/files/{current_user.id}/{unique_filename}"

    return {
        "file_url": file_url,
        "file_name": file.filename,
        "file_size": file_size
    }

@router.get("/files/{user_id}/{filename}")
async def get_file(
    user_id: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    file_path = UPLOAD_DIR / user_id / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(file_path)
