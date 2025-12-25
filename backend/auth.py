"""
LEGACY AUTH MODULE (DEPRECATED - Use dependencies/auth.py)
===========================================================
This module is kept for backward compatibility only.
New code should import from dependencies.auth

SECURITY: This module now delegates to the new secure implementation
"""
from dependencies.auth import (
    get_current_user,
    get_admin_user,
    get_judge_user,
    get_service_client,
    get_anon_client,
    verify_resource_ownership,
    security
)

# Export for backward compatibility
__all__ = [
    'get_current_user',
    'get_admin_user',
    'get_judge_user',
    'get_service_client',
    'get_anon_client',
    'verify_resource_ownership',
    'security'
]
