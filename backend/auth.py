from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_client import get_supabase_client
from models import User, UserRole
from typing import Optional
import jwt

security = HTTPBearer()

def decode_supabase_jwt(token: str):
    try:
        supabase = get_supabase_client()
        response = supabase.auth.get_user(token)
        if response:
            return response.user
        return None
    except Exception:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    supabase = get_supabase_client()

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        user_id = user_response.user.id

        profile_response = supabase.table('user_profiles').select('*').eq('id', user_id).execute()

        if not profile_response.data or len(profile_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )

        profile = profile_response.data[0]

        return User(
            id=profile['id'],
            email=user_response.user.email or '',
            full_name=profile['full_name'],
            role=UserRole(profile['role']),
            created_at=profile['created_at'],
            updated_at=profile['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Admin check: user {current_user.email} has role {current_user.role}")
    if current_user.role != UserRole.ADMIN:
        logger.warning(f"Admin access denied for user {current_user.email} with role {current_user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
