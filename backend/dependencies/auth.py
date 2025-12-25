"""
SECURITY-HARDENED AUTHENTICATION DEPENDENCIES
==============================================
P0-1: Session-based auth with HttpOnly cookies
P0-2: Server-side RBAC enforcement
P0-3: Supabase client separation (anon vs service)

CRITICAL PRINCIPLES:
- Backend NEVER trusts frontend claims
- Roles fetched from DB on every request
- Service role ONLY for admin operations
"""
from fastapi import HTTPException, status, Depends, Request, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from models import User, UserRole

logger = logging.getLogger(__name__)

# Security schemes
security = HTTPBearer(auto_error=False)  # Allow cookie fallback

# ============================================
# SUPABASE CLIENT SEPARATION (P0-3)
# ============================================

def get_service_client():
    """
    SECURITY: Service role client for ADMIN-ONLY operations
    - Bypasses RLS
    - Use ONLY in: admin dashboards, CV review, final scoring
    - NEVER use for user-scoped operations
    """
    from supabase_client import get_service_supabase_client
    return get_service_supabase_client()


def get_anon_client():
    """
    SECURITY: Anon client for user-scoped operations
    - Respects RLS
    - Use for: user profiles, applications, team operations
    """
    from supabase_client import get_anon_supabase_client
    return get_anon_supabase_client()


# ============================================
# SESSION VALIDATION (P0-1)
# ============================================

async def get_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(None, alias="session_token")
) -> str:
    """
    SECURITY: Extract token from HttpOnly cookie OR Authorization header
    
    Priority:
    1. HttpOnly cookie (most secure)
    2. Authorization header (fallback for API clients)
    
    Raises 401 if no valid token found
    """
    # Priority 1: HttpOnly cookie
    if session_token:
        logger.debug("Token extracted from HttpOnly cookie")
        return session_token
    
    # Priority 2: Authorization header (Bearer token)
    if credentials and credentials.credentials:
        logger.debug("Token extracted from Authorization header")
        return credentials.credentials
    
    # No valid authentication found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in.",
        headers={"WWW-Authenticate": "Bearer"}
    )


# ============================================
# USER AUTHENTICATION (P0-1, P0-2)
# ============================================

async def get_current_user(
    token: str = Depends(get_token_from_request)
) -> User:
    """
    SECURITY: Validate session and fetch user from DATABASE
    
    - NEVER trusts JWT claims for role/permissions
    - Fetches role from DB on EVERY request
    - Uses anon client (respects RLS)
    
    IMPROVEMENT: Explicit 401 handling for expired sessions
    
    Returns: Validated User object with DB-sourced role
    """
    supabase = get_anon_client()
    
    try:
        # Step 1: Validate token with Supabase Auth
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            logger.warning("Invalid or expired token")
            # IMPROVEMENT: Explicit 401 with clear error code
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": "Invalid or expired session. Please log in again."
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user_id = user_response.user.id
        user_email = user_response.user.email or ''
        
        # Step 2: Fetch user profile from DATABASE (source of truth for role)
        # SECURITY: This ensures role is ALWAYS from DB, never from JWT
        profile_response = supabase.table('user_profiles')\
            .select('id, email, full_name, role, profile_completed, created_at, updated_at')\
            .eq('id', user_id)\
            .execute()
        
        if not profile_response.data or len(profile_response.data) == 0:
            logger.error(f"User profile not found for authenticated user: {user_id}")
            # IMPROVEMENT: Explicit 401 (session valid but profile missing)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "PROFILE_NOT_FOUND",
                    "message": "User profile not found. Please contact support."
                }
            )
        
        profile = profile_response.data[0]
        
        # Step 3: Construct User object with DB-sourced data
        user = User(
            id=profile['id'],
            email=user_email,
            full_name=profile['full_name'],
            role=UserRole(profile['role']),  # Role from DB, NOT from JWT
            created_at=profile['created_at'],
            updated_at=profile['updated_at']
        )
        
        logger.debug(f"User authenticated: {user.email} with role {user.role}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {type(e).__name__}: {e}")
        # IMPROVEMENT: Always 401 for auth failures, no internal details
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_ERROR",
                "message": "Authentication failed. Please log in again."
            }
        )


# ============================================
# ADMIN AUTHORIZATION (P0-2)
# ============================================

async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    SECURITY: Enforce admin role SERVER-SIDE ONLY
    
    - Role fetched from DB (via get_current_user)
    - NEVER trusts frontend claims
    - Returns 403 for non-admin users
    
    Use this dependency for ALL admin-only endpoints
    """
    if current_user.role != UserRole.ADMIN:
        logger.warning(
            f"Admin access denied: user={current_user.email}, role={current_user.role}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You do not have permission to access this resource."
        )
    
    logger.info(f"Admin access granted: {current_user.email}")
    return current_user


# ============================================
# JUDGE AUTHORIZATION (Optional)
# ============================================

async def get_judge_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    SECURITY: Enforce judge role (or admin) SERVER-SIDE ONLY
    """
    if current_user.role not in [UserRole.JUDGE, UserRole.ADMIN]:
        logger.warning(
            f"Judge access denied: user={current_user.email}, role={current_user.role}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Judge access required."
        )
    
    logger.info(f"Judge access granted: {current_user.email}")
    return current_user


# ============================================
# OWNERSHIP VERIFICATION (P1-5: IDOR Prevention)
# ============================================

def verify_resource_ownership(
    resource_user_id: str,
    current_user: User
) -> None:
    """
    SECURITY: Verify user owns the resource
    
    Prevents IDOR (Insecure Direct Object Reference)
    Raises 403 if user doesn't own the resource
    
    Usage:
        verify_resource_ownership(team.leader_id, current_user)
    """
    if resource_user_id != current_user.id:
        logger.warning(
            f"IDOR attempt: user={current_user.email} tried to access resource owned by {resource_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource."
        )
