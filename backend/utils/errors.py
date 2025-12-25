"""
OPTIONAL IMPROVEMENT: Centralized Error Response Utilities
===========================================================
Post-hardening robustness enhancement (not security-critical)

Provides consistent error response shapes across all API endpoints.
Ensures no stack traces or internal details are exposed.
"""
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


# Standard error codes (user-safe)
class ErrorCode:
    """Enumeration of safe, user-facing error codes"""
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"


def create_error_response(
    code: str,
    message: str,
    status_code: int = 400,
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """
    Create a standardized error response
    
    Args:
        code: Error code (from ErrorCode enum)
        message: User-friendly error message
        status_code: HTTP status code
        details: Optional additional details (safe only)
    
    Returns:
        JSONResponse with standardized error structure
    
    Example:
        return create_error_response(
            ErrorCode.UNAUTHORIZED,
            "Authentication required",
            401
        )
    """
    error_body = {
        "error": {
            "code": code,
            "message": message
        }
    }
    
    # Add safe details if provided
    if details:
        error_body["error"]["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=error_body
    )


def safe_http_exception(
    status_code: int,
    message: str,
    code: Optional[str] = None
) -> HTTPException:
    """
    Create HTTPException with consistent error format
    
    Args:
        status_code: HTTP status code
        message: User-friendly message
        code: Optional error code
    
    Returns:
        HTTPException with standardized detail
    """
    if not code:
        # Map status code to error code
        code_map = {
            400: ErrorCode.BAD_REQUEST,
            401: ErrorCode.UNAUTHORIZED,
            403: ErrorCode.FORBIDDEN,
            404: ErrorCode.NOT_FOUND,
            409: ErrorCode.DUPLICATE_ENTRY,
            413: ErrorCode.FILE_TOO_LARGE,
            422: ErrorCode.VALIDATION_ERROR,
            429: ErrorCode.RATE_LIMITED,
            500: ErrorCode.INTERNAL_ERROR
        }
        code = code_map.get(status_code, ErrorCode.INTERNAL_ERROR)
    
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message
        }
    )


# Convenience functions for common errors
def unauthorized_error(message: str = "Authentication required") -> HTTPException:
    """401 Unauthorized"""
    return safe_http_exception(401, message, ErrorCode.UNAUTHORIZED)


def forbidden_error(message: str = "Access forbidden") -> HTTPException:
    """403 Forbidden"""
    return safe_http_exception(403, message, ErrorCode.FORBIDDEN)


def not_found_error(message: str = "Resource not found") -> HTTPException:
    """404 Not Found"""
    return safe_http_exception(404, message, ErrorCode.NOT_FOUND)


def validation_error(message: str = "Invalid input") -> HTTPException:
    """422 Validation Error"""
    return safe_http_exception(422, message, ErrorCode.VALIDATION_ERROR)


def duplicate_error(message: str = "Resource already exists") -> HTTPException:
    """409 Conflict"""
    return safe_http_exception(409, message, ErrorCode.DUPLICATE_ENTRY)


def rate_limit_error(message: str = "Too many requests") -> HTTPException:
    """429 Too Many Requests"""
    return safe_http_exception(429, message, ErrorCode.RATE_LIMITED)


def internal_error(message: str = "Internal server error") -> HTTPException:
    """500 Internal Server Error (no details exposed)"""
    return safe_http_exception(500, message, ErrorCode.INTERNAL_ERROR)


def file_too_large_error(max_size: str = "5MB") -> HTTPException:
    """413 Payload Too Large"""
    return safe_http_exception(
        413,
        f"File size exceeds the {max_size} limit",
        ErrorCode.FILE_TOO_LARGE
    )


def invalid_file_type_error(allowed_types: str = "PDF, DOC, DOCX") -> HTTPException:
    """400 Bad Request - Invalid file type"""
    return safe_http_exception(
        400,
        f"Invalid file type. Only {allowed_types} are allowed",
        ErrorCode.INVALID_FILE_TYPE
    )
