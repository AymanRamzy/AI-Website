"""
SECURITY-HARDENED SUPABASE CLIENT MANAGEMENT
============================================
P0-3: Separate service and anon clients

CRITICAL SECURITY PRINCIPLES:
1. Service role client = ADMIN ONLY (bypasses RLS)
2. Anon client = USER OPERATIONS (respects RLS)
3. NEVER use service role for user-scoped operations
"""
import os
from typing import Optional
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Global client instances (singletons)
_service_client: Optional[Client] = None
_anon_client: Optional[Client] = None


def get_service_supabase_client() -> Client:
    """
    SECURITY: Service role client for ADMIN-ONLY operations
    
    ⚠️ WARNING: This client BYPASSES Row Level Security (RLS)
    
    Use ONLY for:
    - Admin dashboards
    - CV file operations (upload/download)
    - Application review/approval
    - System operations
    
    ❌ NEVER use for:
    - User profile operations
    - User-scoped queries
    - Team operations
    - Public data access
    """
    global _service_client
    
    if _service_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SECURITY ERROR: Supabase service role credentials missing. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            )
        
        _service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Service role Supabase client initialized (ADMIN ONLY)")
    
    return _service_client


def get_anon_supabase_client() -> Client:
    """
    SECURITY: Anon client for USER-SCOPED operations
    
    ✅ This client RESPECTS Row Level Security (RLS)
    
    Use for:
    - User profile operations
    - User applications
    - Team operations
    - Competition registrations
    - Any user-scoped data access
    
    RLS policies will enforce access control automatically.
    """
    global _anon_client
    
    if _anon_client is None:
        if not SUPABASE_URL:
            raise RuntimeError("SECURITY ERROR: SUPABASE_URL missing")
        
        # Try anon key, fallback to service role if not available
        # (but log warning as this defeats RLS purpose)
        key_to_use = SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
        
        if not SUPABASE_ANON_KEY:
            logger.warning(
                "SECURITY WARNING: SUPABASE_ANON_KEY not set, using service role. "
                "This may bypass RLS. Set SUPABASE_ANON_KEY for proper security."
            )
        
        _anon_client = create_client(SUPABASE_URL, key_to_use)
        logger.info("Anon Supabase client initialized (USER SCOPED)")
    
    return _anon_client


# ============================================
# LEGACY COMPATIBILITY (Backward compatible)
# ============================================

def get_supabase_client() -> Client:
    """
    DEPRECATED: Legacy function for backward compatibility
    
    ⚠️ Returns service role client
    ⚠️ Use get_service_supabase_client() or get_anon_supabase_client() instead
    
    This function will be removed in a future version.
    """
    logger.warning(
        "DEPRECATED: get_supabase_client() called. "
        "Use get_service_supabase_client() or get_anon_supabase_client() explicitly."
    )
    return get_service_supabase_client()
