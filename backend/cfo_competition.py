from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Response
from fastapi.security import HTTPBearer
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import json
import os

from supabase_client import get_supabase_client
from auth import get_current_user, get_admin_user
from models import (User, UserCreate, UserLogin, UserResponse, UserRole, Team,
                    TeamCreate, TeamJoin, TeamResponse, TeamMember, AssignRole,
                    TeamStatus, TeamMemberRole, Competition, CompetitionCreate,
                    CompetitionResponse, CompetitionStatus, GlobalProfileUpdate,
                    GlobalProfileResponse)

# =========================================================
# PHASE 1.5: CLEAR ERROR MESSAGES (OPERATIONAL HARDENING)
# =========================================================

class CompetitionErrors:
    """Explicit, user-friendly error messages for competition operations."""
    REGISTRATION_CLOSED = "Registration window is closed for this competition"
    SUBMISSION_CLOSED = "Submission window is closed"
    SUBMISSIONS_LOCKED = "Submissions are locked and cannot be modified"
    RESULTS_NOT_PUBLISHED = "Results are not published yet"
    DEADLINE_PASSED = "The deadline for this task has passed"
    NOT_TEAM_LEADER = "Only team leaders can perform this action"
    NOT_IN_TEAM = "You are not assigned to a team for this competition"
    NOT_REGISTERED = "You must be registered for this competition"
    TEAM_FULL = "This team has reached the maximum number of members (5)"
    ALREADY_IN_TEAM = "You are already in a team for this competition"
    TASK_NOT_FOUND = "Task not found"
    SUBMISSION_NOT_FOUND = "Submission not found"
    COMPETITION_NOT_FOUND = "Competition not found"


def get_competition_status_flags(competition_data: dict) -> dict:
    """
    Derive explicit status flags from competition data.
    These flags are read-only for participants.
    """
    now = datetime.utcnow()
    status = competition_data.get("status", "draft")
    
    # Check date-based flags
    reg_start = competition_data.get("registration_start")
    reg_end = competition_data.get("registration_end")
    submission_deadline = competition_data.get("submission_deadline_at")
    
    registration_open = False
    submission_open = False
    submissions_locked = competition_data.get("submissions_locked", False)
    results_published = competition_data.get("results_published", False)
    
    # Derive registration_open from dates and status
    if status in ["registration", "active"]:
        if reg_start and reg_end:
            try:
                start = datetime.fromisoformat(reg_start.replace("Z", "+00:00")).replace(tzinfo=None)
                end = datetime.fromisoformat(reg_end.replace("Z", "+00:00")).replace(tzinfo=None)
                registration_open = start <= now <= end
            except (ValueError, TypeError):
                registration_open = status == "registration"
        else:
            registration_open = status == "registration"
    
    # Derive submission_open from status and deadline
    if status == "active" and not submissions_locked:
        if submission_deadline:
            try:
                deadline = datetime.fromisoformat(submission_deadline.replace("Z", "+00:00")).replace(tzinfo=None)
                submission_open = now <= deadline
            except (ValueError, TypeError):
                submission_open = True
        else:
            submission_open = True
    
    return {
        "registration_open": registration_open,
        "submission_open": submission_open,
        "submissions_locked": submissions_locked,
        "results_published": results_published,
        "status": status
    }


# =========================================================
# MODELS
# =========================================================


class CFOApplicationCreate(BaseModel):
    experience_years: int
    job_title: str
    company: str


# =========================================================
# ROUTER SETUP
# =========================================================

security = HTTPBearer()
router = APIRouter(prefix="/api/cfo", tags=["CFO Competition"])

# =========================================================
# AUTH
# =========================================================


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    import logging
    import os
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()

    # Email normalization (MANDATORY)
    normalized_email = user_data.email.strip().lower()
    
    # Get production URL for email redirect
    # Use frontend URL from environment, fallback to backend URL
    production_url = os.environ.get("FRONTEND_URL") or os.environ.get("REACT_APP_BACKEND_URL", "")
    if not production_url:
        # Fallback: construct from request or use known domain
        production_url = "https://modex-uploader.preview.emergentagent.com"
    
    # Ensure no trailing slash
    production_url = production_url.rstrip('/')
    email_redirect_url = f"{production_url}/auth/callback"

    try:
        # Step 1: Create user in Supabase Auth (email confirmation will be required)
        # BOARD-APPROVED: Include emailRedirectTo for proper production redirect
        auth_response = supabase.auth.sign_up({
            "email": normalized_email,
            "password": user_data.password,
            "options": {
                "data": {"full_name": user_data.full_name},
                "email_redirect_to": email_redirect_url
            }
        })

        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )

        user_id = auth_response.user.id
        now = datetime.utcnow().isoformat()

        # Step 2: Check if profile was auto-created by trigger
        existing_profile = supabase.table("user_profiles")\
            .select("id")\
            .eq("id", user_id)\
            .execute()

        if existing_profile.data:
            # Profile exists (created by trigger), update it with full details
            logger.info(f"Updating auto-created profile for user {user_id}")
            supabase.table("user_profiles").update({
                "email": normalized_email,
                "full_name": user_data.full_name,
                "role": user_data.role.value,
                "updated_at": now
            }).eq("id", user_id).execute()
        else:
            # No trigger, create profile manually
            logger.info(f"Creating new profile for user {user_id}")
            profile_data = {
                "id": user_id,
                "email": normalized_email,
                "full_name": user_data.full_name,
                "role": user_data.role.value,
                "created_at": now,
                "updated_at": now
            }
            supabase.table("user_profiles").insert(profile_data).execute()

        logger.info(f"Registration successful for {normalized_email} (email confirmation required)")
        
        return UserResponse(
            id=user_id,
            email=normalized_email,
            full_name=user_data.full_name,
            role=user_data.role,
            created_at=datetime.fromisoformat(now)
        )

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Registration error for {normalized_email}: {e}")
        
        # 409 for duplicate email
        if "already registered" in error_str or "user already registered" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered. Please try logging in instead."
            )
        # Password requirements
        if "password" in error_str and ("weak" in error_str or "short" in error_str or "6" in error_str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters."
            )
        # Rate limiting
        if "security purposes" in error_str or "after" in error_str and "seconds" in error_str:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a moment and try again."
            )
        # Generic server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/auth/login")
async def login(user_credentials: UserLogin, response: Response):
    """
    SECURITY HARDENED: Login with HttpOnly cookie support
    
    P0-1: Sets HttpOnly, Secure cookie for session token
    - Cookie: session_token (HttpOnly, Secure, SameSite=Lax)
    - Also returns token in response for API clients
    """
    import logging
    from fastapi import Response
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()

    # Email normalization (MANDATORY - P1-6)
    normalized_email = user_credentials.email.strip().lower()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": normalized_email,
            "password": user_credentials.password
        })
    except Exception as e:
        logger.error(f"Login auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not auth_response or not auth_response.session or not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    user_id = auth_response.user.id
    user_email = auth_response.user.email or normalized_email
    access_token = auth_response.session.access_token

    try:
        profile_result = supabase.table("user_profiles") \
            .select("*") \
            .eq("id", user_id) \
            .execute()
        
        profile_data = profile_result.data[0] if profile_result.data else None
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        profile_data = None

    if not profile_data:
        logger.info(f"Creating missing profile for user {user_id}")
        now = datetime.utcnow().isoformat()
        new_profile = {
            "id": user_id,
            "email": user_email,
            "full_name": user_email.split("@")[0],
            "role": "participant",
            "created_at": now,
            "updated_at": now
        }
        try:
            insert_result = supabase.table("user_profiles").insert(new_profile).execute()
            profile_data = insert_result.data[0] if insert_result.data else new_profile
        except Exception as e:
            logger.error(f"Failed to create profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )

    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found"
        )

    # SECURITY P0-1: Set HttpOnly cookie for session token
    # Cross-domain fix: samesite="none" required for cross-origin requests
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=True,  # HTTPS only
        samesite="none",  # Required for cross-domain cookie
        max_age=3600 * 24 * 7,  # 7 days
        path="/"
    )
    
    logger.info(f"User logged in successfully: {user_email}")

    return {
        "access_token": access_token,  # For API clients
        "token_type": "bearer",
        "user": UserResponse(
            id=profile_data["id"],
            email=profile_data["email"],
            full_name=profile_data["full_name"],
            role=UserRole(profile_data["role"]),
            created_at=datetime.fromisoformat(profile_data["created_at"]),
            profile_completed=profile_data.get("profile_completed", False)
        )
    }


class GoogleCallbackRequest(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: dict


@router.post("/auth/google-callback")
async def google_callback(request: GoogleCallbackRequest, response: Response):
    """
    Handle Google OAuth callback from frontend.
    
    This endpoint:
    1. Receives the Supabase session tokens from frontend
    2. Creates/updates user profile if needed
    3. Sets HttpOnly cookie for session management
    4. Returns profile completion status
    
    SECURITY: 
    - No manual token validation (trust Supabase)
    - HttpOnly cookie for session
    - Profile auto-created for new OAuth users
    """
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    access_token = request.access_token
    user_data = request.user
    
    if not access_token or not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing access token or user data"
        )
    
    user_id = user_data.get("id")
    user_email = user_data.get("email", "").strip().lower()
    full_name = user_data.get("full_name") or user_data.get("name") or user_email.split("@")[0]
    avatar_url = user_data.get("avatar_url")
    
    if not user_id or not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user data"
        )
    
    logger.info(f"Google OAuth callback for user: {user_email}")
    
    # Check if user profile exists
    try:
        profile_result = supabase.table("user_profiles") \
            .select("*") \
            .eq("id", user_id) \
            .execute()
        
        profile_data = profile_result.data[0] if profile_result.data else None
    except Exception as e:
        logger.warning(f"Profile lookup error: {e}")
        profile_data = None
    
    # Create profile if it doesn't exist (new OAuth user)
    if not profile_data:
        logger.info(f"Creating new profile for Google user: {user_email}")
        now = datetime.utcnow().isoformat()
        new_profile = {
            "id": user_id,
            "email": user_email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "role": "participant",
            "auth_provider": "google",
            "created_at": now,
            "updated_at": now,
            "profile_completed": False  # New users need to complete profile setup
        }
        
        try:
            insert_result = supabase.table("user_profiles").insert(new_profile).execute()
            profile_data = insert_result.data[0] if insert_result.data else new_profile
            logger.info(f"Created profile for Google user: {user_email}")
        except Exception as e:
            # Profile might already exist (race condition), try to fetch again
            logger.warning(f"Profile insert failed (might exist): {e}")
            try:
                profile_result = supabase.table("user_profiles") \
                    .select("*") \
                    .eq("email", user_email) \
                    .execute()
                profile_data = profile_result.data[0] if profile_result.data else None
            except Exception:
                pass
            
            if not profile_data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile"
                )
    
    # Set HttpOnly cookie for session (cross-domain fix)
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",  # Required for cross-domain cookie
        max_age=3600 * 24 * 7,  # 7 days
        path="/"
    )
    
    logger.info(f"Google user signed in: {user_email}")
    
    # Return actual profile_completed status from database
    # New users will have False, returning users will have their actual status
    is_profile_completed = profile_data.get("profile_completed", False)
    
    return {
        "success": True,
        "profile_completed": is_profile_completed,
        "access_token": access_token,  # MOBILE FIX: Return token for mobile fallback
        "user": {
            "id": profile_data["id"],
            "email": profile_data["email"],
            "full_name": profile_data.get("full_name"),
            "role": profile_data.get("role", "participant")
        }
    }


@router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """
    SECURITY: Logout and clear session cookie
    
    P0-1: Clears HttpOnly cookie
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Clear the HttpOnly cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    
    logger.info(f"User logged out: {current_user.email}")
    
    return {"message": "Logged out successfully"}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user with profile_completed status"""
    supabase = get_supabase_client()
    profile = supabase.table("user_profiles").select("profile_completed").eq("id", current_user.id).execute()
    profile_completed = profile.data[0].get("profile_completed", False) if profile.data else False
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
        profile_completed=profile_completed
    )


# =========================================================
# GLOBAL PROFILE (Phase 3)
# =========================================================

@router.get("/profile", response_model=GlobalProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's global profile"""
    supabase = get_supabase_client()
    
    result = supabase.table("user_profiles").select("*").eq("id", current_user.id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = result.data[0]
    
    # Parse certifications JSON if stored as string
    certs = profile.get("certifications", [])
    if isinstance(certs, str):
        try:
            certs = json.loads(certs)
        except json.JSONDecodeError:
            certs = []
    
    return GlobalProfileResponse(
        id=profile["id"],
        email=profile["email"],
        full_name=profile["full_name"],
        role=UserRole(profile["role"]),
        profile_completed=profile.get("profile_completed", False),
        country=profile.get("country"),
        preferred_language=profile.get("preferred_language"),
        mobile_number=profile.get("mobile_number"),
        whatsapp_enabled=profile.get("whatsapp_enabled", False),
        job_title=profile.get("job_title"),
        company_name=profile.get("company_name"),
        industry=profile.get("industry"),
        years_of_experience=profile.get("years_of_experience"),
        linkedin_url=profile.get("linkedin_url"),
        certifications=certs,
        created_at=datetime.fromisoformat(profile["created_at"])
    )


@router.put("/profile", response_model=GlobalProfileResponse)
async def update_profile(
    profile_data: GlobalProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update global profile and mark as completed with validation"""
    import logging
    import re
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # ============================================
    # BACKEND VALIDATION (Re-validate all inputs)
    # ============================================
    errors = {}
    
    # Country validation
    if not profile_data.country or len(profile_data.country.strip()) < 2:
        errors["country"] = "Country is required"
    
    # Mobile number validation: 8-15 digits, numeric only
    mobile_cleaned = profile_data.mobile_number.replace(" ", "").replace("+", "")
    if not mobile_cleaned:
        errors["mobile_number"] = "Mobile number is required"
    elif not mobile_cleaned.isdigit():
        errors["mobile_number"] = "Mobile number must contain only digits"
    elif len(mobile_cleaned) < 8 or len(mobile_cleaned) > 15:
        errors["mobile_number"] = "Mobile number must be 8-15 digits"
    
    # Job title validation: min 2 chars
    if not profile_data.job_title or len(profile_data.job_title.strip()) < 2:
        errors["job_title"] = "Job title must be at least 2 characters"
    
    # Company name validation: min 2 chars
    if not profile_data.company_name or len(profile_data.company_name.strip()) < 2:
        errors["company_name"] = "Company name must be at least 2 characters"
    
    # LinkedIn URL validation: must start with linkedin.com
    if not profile_data.linkedin_url:
        errors["linkedin_url"] = "LinkedIn profile URL is required"
    elif not profile_data.linkedin_url.startswith('https://www.linkedin.com/') and not profile_data.linkedin_url.startswith('https://linkedin.com/'):
        errors["linkedin_url"] = "LinkedIn URL must start with https://www.linkedin.com/"
    
    # Certifications validation: check "Other" has text if selected (certifications are optional)
    if profile_data.certifications:
        for cert in profile_data.certifications:
            if cert.name == "Other" and (not cert.other_text or len(cert.other_text.strip()) == 0):
                errors["other_certification"] = "Please specify your other certification"
            if cert.other_text and len(cert.other_text) > 100:
                errors["other_certification"] = "Other certification must be under 100 characters"
    
    # If validation errors, return structured error response
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Validation failed", "errors": errors}
        )
    
    now = datetime.utcnow().isoformat()
    
    # Convert certifications to JSON-serializable format
    certs_list = []
    if profile_data.certifications:
        for cert in profile_data.certifications:
            cert_data = {
                "name": cert.name,
                "status": cert.status.value,
                "year": cert.year
            }
            if cert.name == "Other" and cert.other_text:
                cert_data["other_text"] = cert.other_text.strip()
            certs_list.append(cert_data)
    
    update_data = {
        "country": profile_data.country.strip(),
        "preferred_language": profile_data.preferred_language.value,
        "mobile_number": profile_data.mobile_number.replace(" ", ""),
        "whatsapp_enabled": profile_data.whatsapp_enabled,
        "job_title": profile_data.job_title.strip(),
        "company_name": profile_data.company_name.strip(),
        "industry": profile_data.industry.value,
        "years_of_experience": profile_data.years_of_experience.value,
        "linkedin_url": profile_data.linkedin_url.strip(),
        "certifications": json.dumps(certs_list),
        "profile_completed": True,
        "updated_at": now
    }
    
    try:
        result = supabase.table("user_profiles").update(update_data).eq("id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update profile")
        
        profile = result.data[0]
        logger.info(f"Profile completed/updated for user {current_user.id}")
        
        return GlobalProfileResponse(
            id=profile["id"],
            email=profile["email"],
            full_name=profile["full_name"],
            role=UserRole(profile["role"]),
            profile_completed=True,
            country=profile.get("country"),
            preferred_language=profile.get("preferred_language"),
            mobile_number=profile.get("mobile_number"),
            whatsapp_enabled=profile.get("whatsapp_enabled", False),
            job_title=profile.get("job_title"),
            company_name=profile.get("company_name"),
            industry=profile.get("industry"),
            years_of_experience=profile.get("years_of_experience"),
            linkedin_url=profile.get("linkedin_url"),
            certifications=certs_list,
            created_at=datetime.fromisoformat(profile["created_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


# =========================================================
# CFO APPLICATION - Leadership Application System (CFO-FIRST MODEL)
# =========================================================
# Phase 1: Individual CFO applications (NO team requirements)
# Phase 2: Only Qualified CFOs (Top 100) can create teams

from cfo_application_scoring import (
    CFOFullApplication, calculate_total_score, determine_status,
    CFOApplicationStep1, CFOApplicationStep2, CFOApplicationStep3, CFOApplicationStep4
)


@router.get("/applications/eligibility")
async def check_cfo_eligibility(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check if user is eligible to apply as CFO.
    CFO-FIRST MODEL: No team requirements - individuals apply first.
    """
    import logging
    import re
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # UUID validation guard
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not competition_id or not UUID_PATTERN.match(competition_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format"
        )
    
    eligibility = {
        "eligible": False,
        "reasons": [],
        "checks": {
            "authenticated": True,
            "applications_open": False,
            "not_already_applied": True
        }
    }
    
    # Check competition exists
    comp_result = supabase.table("competitions").select("*").eq("id", competition_id).execute()
    if not comp_result.data:
        eligibility["reasons"].append("Competition not found")
        return eligibility
    
    competition = comp_result.data[0]
    
    # Check if applications are open
    if competition.get("status") in ["applications_open", "open"]:
        eligibility["checks"]["applications_open"] = True
    else:
        eligibility["reasons"].append("CFO applications are not currently open")
    
    # Check if already applied
    existing_app = supabase.table("cfo_applications")\
        .select("id, status")\
        .eq("user_id", current_user.id)\
        .eq("competition_id", competition_id)\
        .execute()
    
    if existing_app.data:
        eligibility["checks"]["not_already_applied"] = False
        app_status = existing_app.data[0].get("status", "pending")
        eligibility["existing_application"] = {
            "id": existing_app.data[0]["id"],
            "status": app_status
        }
        eligibility["reasons"].append(f"You have already applied (Status: {app_status})")
    
    # Determine final eligibility
    all_checks_passed = all(eligibility["checks"].values())
    eligibility["eligible"] = all_checks_passed
    
    if all_checks_passed:
        eligibility["reasons"] = ["You are eligible to apply as CFO"]
    
    logger.info(f"CFO eligibility check for user {current_user.id}: eligible={eligibility['eligible']}")
    
    return eligibility


@router.post("/applications/upload-cv")
async def upload_cv(
    competition_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload CV for CFO application.
    Uses SERVICE_ROLE_KEY to upload to private Supabase Storage bucket.
    Path format: cfo/{competition_id}/{user_id}.{ext}
    
    SECURITY: File type validation, size limits, rate limiting
    """
    import logging
    import re
    from supabase import create_client
    from datetime import datetime, timedelta
    logger = logging.getLogger(__name__)
    
    supabase = get_supabase_client()
    
    # SECURITY FIX: Rate limiting - max 3 uploads per 5 minutes per user
    # Prevent abuse of storage bandwidth
    # Note: Skip rate limiting if RPC doesn't exist (non-blocking)
    try:
        recent_uploads_count = supabase.rpc(
            'count_recent_uploads',
            {
                'p_user_id': current_user.id,
                'p_minutes': 5
            }
        ).execute()
        
        if recent_uploads_count.data and recent_uploads_count.data > 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload attempts. Please wait 5 minutes before trying again."
            )
    except HTTPException:
        raise
    except Exception as rpc_err:
        # RPC might not exist, log and continue without rate limiting
        logger.warning(f"Rate limit RPC check skipped: {rpc_err}")
    
    # BOARD-APPROVED FIX: Create dedicated admin client for storage uploads
    # This ensures service_role key is used, bypassing RLS
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    # Create fresh admin client - DO NOT reuse global client
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # UUID validation
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not competition_id or not UUID_PATTERN.match(competition_id):
        raise HTTPException(status_code=400, detail="Invalid competition ID format")
    
    # Validate file type (strict whitelist)
    ALLOWED_MIME_TYPES = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    }
    
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Check content type
    content_type = file.content_type or ''
    if content_type not in ALLOWED_MIME_TYPES:
        # Also check by extension as fallback
        file_ext_check = os.path.splitext(file.filename or '')[1].lower()
        if file_ext_check not in ALLOWED_MIME_TYPES.values():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid file type. Only PDF, DOC, and DOCX files are accepted."
            )
    
    # Get file extension (validated)
    file_ext = os.path.splitext(file.filename or 'cv.pdf')[1].lower()
    if file_ext not in ALLOWED_MIME_TYPES.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension. Only .pdf, .doc, and .docx are accepted."
        )
    
    # Read file contents
    contents = await file.read()
    
    # Validate file size (strict check)
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="File is empty. Please upload a valid CV."
        )
    
    if len(contents) > MAX_FILE_SIZE:
        size_mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
            detail=f"File size ({size_mb:.1f}MB) exceeds the 5MB limit."
        )
    
    # Build file path
    file_path = f"cfo/{competition_id}/{current_user.id}{file_ext}"
    
    # Determine content type for upload (use validated MIME type or default to PDF)
    upload_content_type = content_type if content_type in ALLOWED_MIME_TYPES else 'application/pdf'
    
    try:
        # Try to remove existing file first (ignore errors)
        try:
            supabase_admin.storage.from_("cfo-cvs").remove([file_path])
        except Exception:
            pass
        
        # Upload new file using admin client (service role key bypasses RLS)
        upload_result = supabase_admin.storage.from_("cfo-cvs").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": upload_content_type, "upsert": "true"}
        )
        
        # SECURITY FIX: Handle upload errors with clear messages (no stack trace exposure)
        if hasattr(upload_result, 'error') and upload_result.error:
            logger.error(f"Supabase upload error: {upload_result.error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Storage upload failed. Please try again or contact support."
            )
        
        # SECURITY FIX: Store only the file path reference (no pre-signed URL)
        # Admin will generate short-lived signed URLs when downloading
        cv_url = file_path  # Store simple path: cfo/{competition_id}/{user_id}.ext
        
        logger.info(f"CV uploaded for user {current_user.id}, competition {competition_id}, path: {file_path}")
        
        return {
            "success": True,
            "cv_url": cv_url,
            "cv_uploaded_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CV upload error: {type(e).__name__}: {e}")
        # SECURITY FIX: Don't expose internal error details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Upload failed. Please try again or contact support."
        )


@router.post("/applications/submit", status_code=201)
async def submit_cfo_application(
    application: CFOFullApplication,
    current_user: User = Depends(get_current_user)
):
    """Submit full CFO leadership application (CFO-FIRST: No team required)
    
    SECURITY: Rate limited, duplicate prevention via DB constraint
    """
    import logging
    import re
    from datetime import datetime, timedelta
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # SECURITY FIX: Simple rate limiting - check recent submission attempts
    # Prevent spam submissions (max 1 submission per 60 seconds per user)
    recent_submissions = supabase.table("cfo_applications")\
        .select("submitted_at")\
        .eq("user_id", current_user.id)\
        .gte("submitted_at", (datetime.utcnow() - timedelta(seconds=60)).isoformat())\
        .execute()
    
    if recent_submissions.data and len(recent_submissions.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before submitting again. You can only submit once per minute."
        )
    
    # UUID validation guard - prevent unresolved placeholders
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not application.competition_id or not UUID_PATTERN.match(application.competition_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid competition ID format"
        )
    
    # Validate all required fields before processing
    validation_errors = []
    
    # Step 1 validation
    if not application.step1.experience_years:
        validation_errors.append("Experience years is required")
    if not application.step1.leadership_exposure:
        validation_errors.append("Leadership exposure is required")
    if not application.step1.decision_ownership:
        validation_errors.append("Decision ownership is required")
    if not application.step1.leadership_willingness:
        validation_errors.append("Leadership willingness is required")
    if not application.step1.commitment_level:
        validation_errors.append("Commitment level is required")
    
    # NEW: CFO Readiness & Commitment validation (merged question)
    if not application.step1.cfo_readiness_commitment:
        validation_errors.append("CFO readiness and commitment level is required")
    elif application.step1.cfo_readiness_commitment.value == "not_ready":
        # Hard gate: reject if not_ready
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="You have indicated you are not ready for CFO responsibilities. This application requires readiness to proceed."
        )
    
    # CV URL validation (required)
    if not application.cv_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please upload your CV before submitting"
        )
    
    # Step 2 validation
    if not application.step2.capital_allocation:
        validation_errors.append("Capital allocation choice is required")
    if not application.step2.capital_justification or len(application.step2.capital_justification.strip()) < 50:
        validation_errors.append("Capital justification must be at least 50 characters")
    if not application.step2.cash_vs_profit or len(application.step2.cash_vs_profit.strip()) < 50:
        validation_errors.append("Cash vs profit answer must be at least 50 characters")
    if not application.step2.kpi_prioritization or len(application.step2.kpi_prioritization.strip()) < 50:
        validation_errors.append("KPI prioritization answer must be at least 50 characters")
    
    # Step 3 validation
    if not application.step3.dscr_choice:
        validation_errors.append("DSCR choice is required")
    if not application.step3.dscr_impact or len(application.step3.dscr_impact.strip()) < 30:
        validation_errors.append("DSCR impact must be at least 30 characters")
    if not application.step3.cost_priority:
        validation_errors.append("Cost priority is required")
    if not application.step3.cfo_mindset:
        validation_errors.append("CFO mindset is required")
    if not application.step3.mindset_explanation or len(application.step3.mindset_explanation.strip()) < 30:
        validation_errors.append("Mindset explanation must be at least 30 characters")
    
    # Step 4 validation
    if not application.step4.ethics_choice:
        validation_errors.append("Ethics choice is required")
    if not application.step4.culture_vs_results:
        validation_errors.append("Culture vs results is required")
    if not application.step4.why_top_100 or len(application.step4.why_top_100.strip()) < 100:
        validation_errors.append("Why top 100 must be at least 100 characters")
    
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation failed: {'; '.join(validation_errors)}"
        )
    
    # SECURITY FIX: Atomic duplicate check using database unique constraint
    # The unique constraint (user_id, competition_id) prevents race conditions
    # If duplicate exists, database will reject with integrity error
    
    # Calculate score
    score_result = calculate_total_score(application)
    
    # Prepare application data for storage - ATOMIC SINGLE INSERT
    app_data = {
        "user_id": current_user.id,
        "competition_id": application.competition_id,
        # Step 1
        "experience_years": application.step1.experience_years.value,
        "leadership_exposure": application.step1.leadership_exposure.value,
        "decision_ownership": application.step1.decision_ownership.value,
        "leadership_willingness": application.step1.leadership_willingness.value,
        "commitment_level": application.step1.commitment_level.value,
        # NEW: Merged readiness & commitment question
        "cfo_readiness_commitment": application.step1.cfo_readiness_commitment.value if application.step1.cfo_readiness_commitment else None,
        # Step 2
        "capital_allocation": application.step2.capital_allocation.value,
        "capital_justification": application.step2.capital_justification.strip(),
        "cash_vs_profit": application.step2.cash_vs_profit.strip(),
        "kpi_prioritization": application.step2.kpi_prioritization.strip(),
        # Step 3
        "dscr_choice": application.step3.dscr_choice.value,
        "dscr_impact": application.step3.dscr_impact.strip(),
        "cost_priority": application.step3.cost_priority.value,
        "cfo_mindset": application.step3.cfo_mindset.value,
        "mindset_explanation": application.step3.mindset_explanation.strip(),
        # Step 4
        "ethics_choice": application.step4.ethics_choice.value,
        "culture_vs_results": application.step4.culture_vs_results.value,
        "why_top_100": application.step4.why_top_100.strip(),
        # CV Upload
        "cv_url": application.cv_url,
        "cv_uploaded_at": application.cv_uploaded_at or datetime.utcnow().isoformat(),
        # Scoring (internal only)
        "total_score": score_result["final_score"],
        "raw_score": score_result["total_raw_score"],
        "leadership_score": score_result["section_scores"]["leadership"],
        "ethics_score": score_result["section_scores"]["ethics"],
        "capital_score": score_result["section_scores"]["capital_allocation"],
        "judgment_score": score_result["section_scores"]["financial_judgment"],
        "red_flag_count": score_result["red_flag_count"],
        "red_flags": score_result["red_flags"],
        "auto_excluded": score_result["auto_exclude"],
        "exclusion_reason": score_result["exclusion_reason"],
        # Status - EXPLICIT SUBMITTED STATUS
        "status": "excluded" if score_result["auto_exclude"] else "submitted",
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    try:
        result = supabase.table("cfo_applications").insert(app_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save application. Please try again."
            )
        
        logger.info(f"CFO application submitted by user {current_user.id}, score: {score_result['final_score']}, excluded: {score_result['auto_exclude']}")
        
        # Return clean success response
        return {
            "success": True,
            "message": "Your CFO leadership application has been submitted successfully.",
            "application_id": result.data[0]["id"],
            "status": "under_review"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CFO application submission error: {type(e).__name__}: {e}")
        
        # SECURITY FIX: Handle duplicate submission error gracefully
        error_msg = str(e).lower()
        if 'unique' in error_msg or 'duplicate' in error_msg or 'cfo_applications_user_competition_unique' in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted an application for this competition."
            )
        
        # SECURITY FIX: Don't expose internal database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to submit application. Please try again or contact support."
        )


@router.get("/applications/my-application")
async def get_my_cfo_application(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current user's CFO application status (without revealing score)"""
    supabase = get_supabase_client()
    
    result = supabase.table("cfo_applications")\
        .select("id, status, submitted_at")\
        .eq("user_id", current_user.id)\
        .eq("competition_id", competition_id)\
        .execute()
    
    if not result.data:
        return {"has_applied": False}
    
    app = result.data[0]
    
    # Map internal status to user-friendly status
    status_map = {
        "submitted": "Under Review",
        "pending": "Under Review",
        "qualified": "Qualified - Top 100",
        "reserve": "Reserve List",
        "not_selected": "Not Selected",
        "excluded": "Not Eligible"
    }
    
    return {
        "has_applied": True,
        "application_id": app["id"],
        "status": status_map.get(app["status"], "Under Review"),
        "submitted_at": app["submitted_at"]
    }


@router.get("/applications/admin/list")
async def admin_list_applications(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin: List all applications with scores and rankings"""
    supabase = get_supabase_client()
    
    result = supabase.table("cfo_applications")\
        .select("*, user_profiles(full_name, email)")\
        .eq("competition_id", competition_id)\
        .order("total_score", desc=True)\
        .execute()
    
    applications = result.data or []
    
    # Add ranking
    for i, app in enumerate(applications):
        if not app.get("auto_excluded"):
            app["rank"] = i + 1
            app["final_status"] = determine_status(i + 1, app.get("auto_excluded", False))
        else:
            app["rank"] = None
            app["final_status"] = "excluded"
    
    return {
        "total_applications": len(applications),
        "qualified_count": len([a for a in applications if a["final_status"] == "qualified"]),
        "reserve_count": len([a for a in applications if a["final_status"] == "reserve"]),
        "excluded_count": len([a for a in applications if a["final_status"] == "excluded"]),
        "applications": applications
    }


@router.put("/applications/admin/{application_id}/override")
async def admin_override_status(
    application_id: str,
    new_status: str,
    reason: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Manual override of application status (rare cases)"""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    valid_statuses = ["qualified", "reserve", "not_selected", "excluded"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = supabase.table("cfo_applications")\
        .update({
            "status": new_status,
            "admin_override": True,
            "override_reason": reason,
            "override_by": current_user.id,
            "override_at": datetime.utcnow().isoformat()
        })\
        .eq("id", application_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    logger.info(f"Admin {current_user.id} overrode application {application_id} to status {new_status}")
    
    return {"success": True, "message": f"Application status updated to {new_status}"}


# Legacy endpoint - keep for backward compatibility
@router.post("/applications", status_code=201)
async def apply_for_cfo_legacy(
        data: CFOApplicationCreate,
        current_user: User = Depends(get_current_user),
):
    """Legacy CFO application endpoint"""
    raise HTTPException(
        status_code=400,
        detail="Please use the new CFO application form at /applications/submit"
    )


# =========================================================
# COMPETITIONS
# =========================================================


@router.get("/competitions")
async def list_competitions():
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    response = supabase.table("competitions").select("*").order("created_at", desc=True).execute()
    
    competitions = response.data or []
    
    # Map backend status to frontend expected status
    # Backend uses: 'draft', 'open', 'closed'
    # Frontend expects: 'draft', 'registration_open', 'in_progress', 'completed'
    status_map = {
        'open': 'registration_open',
        'draft': 'draft',
        'closed': 'completed'
    }
    
    for comp in competitions:
        original_status = comp.get('status', 'draft')
        comp['status'] = status_map.get(original_status, original_status)
        
        # Ensure registered_teams field exists (frontend expects it)
        if 'registered_teams' not in comp:
            # Count actual teams for this competition
            teams_count = supabase.table("teams").select("id", count="exact").eq("competition_id", comp["id"]).execute()
            comp['registered_teams'] = teams_count.count if hasattr(teams_count, 'count') else 0
    
    logger.info(f"Returning {len(competitions)} competitions")
    return competitions


@router.get("/competitions/{competition_id}")
async def get_competition(competition_id: str):
    supabase = get_supabase_client()
    response = supabase.table("competitions").select("*").eq("id", competition_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    return response.data[0]


@router.post("/competitions")
async def create_competition(competition_data: CompetitionCreate,
                             admin_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()

    competition_dict = {
        "title": competition_data.title,
        "description": competition_data.description or "",
        "registration_start": competition_data.registration_start,
        "registration_end": competition_data.registration_end,
        "competition_start": competition_data.competition_start,
        "competition_end": competition_data.competition_end,
        "max_teams": competition_data.max_teams,
        "status": competition_data.status if competition_data.status in ["draft", "open", "closed"] else "draft"
    }

    response = supabase.table("competitions").insert(competition_dict).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create competition")

    return response.data[0]


# =========================================================
# COMPETITION REGISTRATION
# =========================================================


@router.get("/competitions/{competition_id}/is-registered")
async def check_registration(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    response = supabase.table("competitions").select("id").eq("id", competition_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    registration = supabase.table("competition_registrations") \
        .select("id") \
        .eq("competition_id", competition_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    is_registered = bool(registration.data)
    logger.info(f"Registration check - user_id: {current_user.id}, competition_id: {competition_id}, is_registered: {is_registered}, registrations_found: {len(registration.data or [])}")
    
    return {"is_registered": is_registered}


@router.get("/competitions/{competition_id}/status")
async def get_competition_status(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get explicit status flags for a competition.
    Participants can view but cannot modify these flags.
    
    Returns:
    - registration_open: Can users register?
    - submission_open: Can teams submit?
    - submissions_locked: Are submissions immutable?
    - results_published: Is leaderboard public?
    - status: Current phase (draft/registration/active/judging/completed)
    """
    supabase = get_supabase_client()
    
    response = supabase.table("competitions")\
        .select("*")\
        .eq("id", competition_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail=CompetitionErrors.COMPETITION_NOT_FOUND)
    
    competition = response.data[0]
    status_flags = get_competition_status_flags(competition)
    
    return {
        "competition_id": competition_id,
        "title": competition.get("title"),
        **status_flags
    }


@router.post("/competitions/{competition_id}/register", status_code=201)
async def register_for_competition(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    competition = supabase.table("competitions").select("*").eq("id", competition_id).execute()
    if not competition.data:
        raise HTTPException(status_code=404, detail=CompetitionErrors.COMPETITION_NOT_FOUND)
    
    comp = competition.data[0]
    
    # PHASE 1.5: Check explicit status flags
    status_flags = get_competition_status_flags(comp)
    if not status_flags["registration_open"]:
        raise HTTPException(
            status_code=403, 
            detail=CompetitionErrors.REGISTRATION_CLOSED
        )
    
    existing = supabase.table("competition_registrations") \
        .select("id") \
        .eq("competition_id", competition_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if existing.data:
        raise HTTPException(
            status_code=409, 
            detail="You are already registered for this competition"
        )
    
    registration_data = {
        "competition_id": competition_id,
        "user_id": current_user.id
    }
    
    try:
        result = supabase.table("competition_registrations").insert(registration_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to register for competition")
        
        logger.info(f"User {current_user.id} registered for competition {competition_id}")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")



# =========================================================
# TEAMS (CFO-FIRST: Only Qualified CFOs can create teams)
# =========================================================


@router.post("/teams")
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new team for a competition.
    CFO-FIRST MODEL: Only users with qualified CFO status can create teams.
    """
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # CFO-FIRST: Check if user is a QUALIFIED CFO for this competition
    cfo_app = supabase.table("cfo_applications") \
        .select("id, status") \
        .eq("competition_id", team_data.competition_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not cfo_app.data:
        raise HTTPException(
            status_code=403,
            detail="You must apply as CFO first before creating a team"
        )
    
    app_status = cfo_app.data[0].get("status")
    if app_status != "qualified":
        status_messages = {
            "pending": "Your CFO application is still under review",
            "reserve": "You are on the reserve list (Top 101-150). Only Top 100 CFOs can create teams",
            "not_selected": "Your CFO application was not selected",
            "excluded": "Your CFO application was not eligible"
        }
        raise HTTPException(
            status_code=403,
            detail=status_messages.get(app_status, "Only qualified CFOs (Top 100) can create teams")
        )
    
    # Check if user is already in a team for this competition
    existing_membership = supabase.table("team_members") \
        .select("team_id, teams(competition_id)") \
        .eq("user_id", current_user.id) \
        .execute()
    
    for membership in existing_membership.data or []:
        team_info = membership.get("teams")
        if team_info and team_info.get("competition_id") == team_data.competition_id:
            raise HTTPException(
                status_code=400,
                detail="You are already in a team for this competition"
            )
    
    # Create team - database trigger automatically adds leader to team_members
    try:
        # Step 1: Insert into teams table (trigger creates team_member with team_role='leader')
        team_result = supabase.table("teams").insert({
            "team_name": team_data.team_name,
            "competition_id": team_data.competition_id,
            "leader_id": current_user.id
        }).execute()
        
        if not team_result.data:
            raise HTTPException(status_code=500, detail="Failed to create team")
        
        team = team_result.data[0]
        team_id = team["id"]
        
        # Step 2: Update the auto-created team_member with user_name
        supabase.table("team_members").update({
            "user_name": current_user.full_name
        }).eq("team_id", team_id).eq("user_id", current_user.id).execute()
        
        logger.info(f"Team created by qualified CFO {current_user.id}")
        
        return team
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Team creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create team: {str(e)}")


@router.get("/teams/eligibility")
async def check_team_creation_eligibility(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check if user can create a team (CFO-FIRST model).
    Only qualified CFOs (Top 100) can create teams.
    """
    supabase = get_supabase_client()
    
    eligibility = {
        "can_create_team": False,
        "reason": "",
        "cfo_status": None,
        "has_team": False
    }
    
    # Check CFO application status
    cfo_app = supabase.table("cfo_applications") \
        .select("id, status") \
        .eq("competition_id", competition_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not cfo_app.data:
        eligibility["reason"] = "You must apply as CFO first"
        return eligibility
    
    app_status = cfo_app.data[0].get("status")
    eligibility["cfo_status"] = app_status
    
    if app_status != "qualified":
        status_reasons = {
            "pending": "Your CFO application is under review",
            "reserve": "You are on the reserve list (101-150)",
            "not_selected": "Your application was not selected",
            "excluded": "Your application was not eligible"
        }
        eligibility["reason"] = status_reasons.get(app_status, "Only qualified CFOs can create teams")
        return eligibility
    
    # Check if already in a team
    existing = supabase.table("team_members") \
        .select("team_id, teams(competition_id)") \
        .eq("user_id", current_user.id) \
        .execute()
    
    for membership in existing.data or []:
        team_info = membership.get("teams")
        if team_info and team_info.get("competition_id") == competition_id:
            eligibility["has_team"] = True
            eligibility["reason"] = "You already have a team for this competition"
            return eligibility
    
    eligibility["can_create_team"] = True
    eligibility["reason"] = "You are a qualified CFO - you can create a team!"
    
    return eligibility


@router.get("/teams/my-team")
async def get_my_team(current_user: User = Depends(get_current_user)):
    """Get the current user's team."""
    supabase = get_supabase_client()
    
    # Find team membership for current user
    membership = supabase.table("team_members") \
        .select("team_id") \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=404, detail="You are not in any team")
    
    team_id = membership.data[0]["team_id"]
    
    # Get team details
    team_result = supabase.table("teams") \
        .select("*") \
        .eq("id", team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_result.data[0]
    
    # Get team members
    members_result = supabase.table("team_members") \
        .select("*") \
        .eq("team_id", team_id) \
        .execute()
    
    team["members"] = members_result.data or []
    team["max_members"] = 5  # Constant max team size for frontend
    # Compute status from member count (no status column in DB)
    team["status"] = "complete" if len(team["members"]) >= 5 else "forming"
    
    return team


@router.get("/teams/competition/{competition_id}")
async def get_teams_by_competition(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all teams for a competition."""
    supabase = get_supabase_client()
    
    # Get all teams for this competition
    teams_result = supabase.table("teams") \
        .select("*") \
        .eq("competition_id", competition_id) \
        .execute()
    
    teams = teams_result.data or []
    
    # Get members for each team and add computed fields
    for team in teams:
        members_result = supabase.table("team_members") \
            .select("*") \
            .eq("team_id", team["id"]) \
            .execute()
        team["members"] = members_result.data or []
        team["max_members"] = 5  # Constant max team size for frontend
        # Compute status from member count (no status column in DB)
        team["status"] = "complete" if len(team["members"]) >= 5 else "forming"
    
    return teams


@router.post("/teams/join")
async def join_team(
    join_data: TeamJoin,
    current_user: User = Depends(get_current_user)
):
    """Join an existing team."""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Get team details
    team_result = supabase.table("teams") \
        .select("*") \
        .eq("id", join_data.team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_result.data[0]
    
    # Check if user is registered for the competition
    registration = supabase.table("competition_registrations") \
        .select("id") \
        .eq("competition_id", team["competition_id"]) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not registration.data:
        raise HTTPException(
            status_code=403,
            detail="You must be registered for this competition to join a team"
        )
    
    # Check if user is already in a team for this competition
    existing_membership = supabase.table("team_members") \
        .select("team_id, teams(competition_id)") \
        .eq("user_id", current_user.id) \
        .execute()
    
    for membership in existing_membership.data or []:
        team_info = membership.get("teams")
        if team_info and team_info.get("competition_id") == team["competition_id"]:
            raise HTTPException(
                status_code=400,
                detail="You are already in a team for this competition"
            )
    
    # Get current member count
    MAX_TEAM_SIZE = 5  # Constant max team size
    members_result = supabase.table("team_members") \
        .select("id") \
        .eq("team_id", join_data.team_id) \
        .execute()
    
    current_members = len(members_result.data or [])
    
    if current_members >= MAX_TEAM_SIZE:
        raise HTTPException(status_code=400, detail="Team is full")
    
    # Add user to team
    now = datetime.utcnow().isoformat()
    member_dict = {
        "team_id": join_data.team_id,
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "joined_at": now
    }
    
    try:
        supabase.table("team_members").insert(member_dict).execute()
        
        # Team is implicitly complete when member count reaches MAX_TEAM_SIZE
        # No status update needed - frontend calculates from member count
        
        logger.info(f"User {current_user.id} joined team {join_data.team_id}")
        
        return {"success": True, "message": "Successfully joined team"}
        
    except Exception as e:
        logger.error(f"Join team error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to join team: {str(e)}")


@router.get("/teams/{team_id}")
async def get_team(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get team details by ID."""
    supabase = get_supabase_client()
    
    # Get team
    team_result = supabase.table("teams") \
        .select("*") \
        .eq("id", team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_result.data[0]
    
    # Get team members
    members_result = supabase.table("team_members") \
        .select("*") \
        .eq("team_id", team_id) \
        .execute()
    
    team["members"] = members_result.data or []
    team["max_members"] = 5  # Constant max team size for frontend
    # Compute status from member count (no status column in DB)
    team["status"] = "complete" if len(team["members"]) >= 5 else "forming"
    
    return team


@router.delete("/teams/{team_id}/leave")
async def leave_team(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """Leave a team."""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Get team
    team_result = supabase.table("teams") \
        .select("*") \
        .eq("id", team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_result.data[0]
    
    # Check if user is the leader
    if team["leader_id"] == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Team leaders cannot leave. Transfer leadership or delete the team."
        )
    
    # Check if user is a member
    membership = supabase.table("team_members") \
        .select("id") \
        .eq("team_id", team_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=400, detail="You are not a member of this team")
    
    # Remove user from team
    try:
        supabase.table("team_members") \
            .delete() \
            .eq("team_id", team_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        # No status update needed - team completeness is calculated from member count
        
        logger.info(f"User {current_user.id} left team {team_id}")
        
        return {"success": True, "message": "Successfully left team"}
        
    except Exception as e:
        logger.error(f"Leave team error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to leave team: {str(e)}")


@router.put("/teams/{team_id}/assign-role")
async def assign_role(
    team_id: str,
    role_data: AssignRole,
    current_user: User = Depends(get_current_user)
):
    """Assign a role to a team member (leader only)."""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Get team
    team_result = supabase.table("teams") \
        .select("*") \
        .eq("id", team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_result.data[0]
    
    # PHASE 1.5: Clear error for non-leader
    if team["leader_id"] != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=CompetitionErrors.NOT_TEAM_LEADER
        )
    
    # Check if target user is a team member
    membership = supabase.table("team_members") \
        .select("id") \
        .eq("team_id", team_id) \
        .eq("user_id", role_data.user_id) \
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=400, detail="User is not a member of this team")
    
    # Check if role is already assigned to another member
    existing_role = supabase.table("team_members") \
        .select("user_id") \
        .eq("team_id", team_id) \
        .eq("team_role", role_data.team_role.value) \
        .execute()
    
    if existing_role.data:
        for member in existing_role.data:
            if member["user_id"] != role_data.user_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Role '{role_data.team_role.value}' is already assigned to another member"
                )
    
    # Update the role
    try:
        supabase.table("team_members").update({
            "team_role": role_data.team_role.value
        }).eq("team_id", team_id).eq("user_id", role_data.user_id).execute()
        
        logger.info(f"Role {role_data.team_role.value} assigned to user {role_data.user_id} in team {team_id}")
        
        return {"success": True, "message": "Role assigned successfully"}
        
    except Exception as e:
        logger.error(f"Assign role error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign role: {str(e)}")


# =========================================================
# TEAM CASE FILES & SUBMISSIONS
# =========================================================


@router.get("/teams/{team_id}/case-files")
async def get_team_case_files(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get case files for a team's competition.
    Enforces timer: returns empty if before case_release_at.
    Returns signed URLs with 15 min expiry.
    """
    import logging
    from supabase import create_client
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Verify user is a team member
    membership = supabase.table("team_members") \
        .select("id") \
        .eq("team_id", team_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    
    # Get team and competition info
    team_result = supabase.table("teams") \
        .select("competition_id") \
        .eq("id", team_id) \
        .execute()
    
    if not team_result.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    competition_id = team_result.data[0]["competition_id"]
    
    # Get competition with timer fields
    comp_result = supabase.table("competitions") \
        .select("id, title, case_release_at, submission_deadline_at") \
        .eq("id", competition_id) \
        .execute()
    
    if not comp_result.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp_result.data[0]
    case_release_at = competition.get("case_release_at")
    submission_deadline_at = competition.get("submission_deadline_at")
    
    now = datetime.utcnow()
    
    # Check if case is released
    case_released = True
    time_until_release = None
    
    if case_release_at:
        try:
            release_dt = datetime.fromisoformat(case_release_at.replace('Z', '+00:00'))
            release_dt_naive = release_dt.replace(tzinfo=None)
            if now < release_dt_naive:
                case_released = False
                time_until_release = (release_dt_naive - now).total_seconds()
        except ValueError:
            pass
    
    # If case not released, return timer info only
    if not case_released:
        return {
            "case_released": False,
            "case_release_at": case_release_at,
            "time_until_release": time_until_release,
            "files": []
        }
    
    # Case is released - get files from storage
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        # List files in Cases/{competition_id}/
        folder_path = f"Cases/{competition_id}"
        list_result = supabase_admin.storage.from_("Team-submissions").list(folder_path)
        
        files = []
        for item in list_result or []:
            if item.get("name") and not item.get("name").startswith("."):
                file_path = f"{folder_path}/{item.get('name')}"
                
                # Generate signed URL (15 min = 900 seconds)
                signed_url_result = supabase_admin.storage.from_("Team-submissions").create_signed_url(
                    file_path, 900
                )
                
                download_url = None
                if isinstance(signed_url_result, dict):
                    download_url = signed_url_result.get('signedURL') or signed_url_result.get('signedUrl')
                
                files.append({
                    "name": item.get("name"),
                    "size": item.get("metadata", {}).get("size", 0),
                    "download_url": download_url,
                    "expires_in": 900
                })
        
        return {
            "case_released": True,
            "case_release_at": case_release_at,
            "submission_deadline_at": submission_deadline_at,
            "files": files
        }
        
    except Exception as e:
        logger.error(f"Get case files error: {e}")
        return {
            "case_released": True,
            "case_release_at": case_release_at,
            "submission_deadline_at": submission_deadline_at,
            "files": []
        }


@router.get("/teams/{team_id}/submission")
async def get_team_submission(
    team_id: str,
    competition_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get team's existing submission for a competition."""
    supabase = get_supabase_client()
    
    # Verify user is a team member
    membership = supabase.table("team_members") \
        .select("id") \
        .eq("team_id", team_id) \
        .eq("user_id", current_user.id) \
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    
    # Get team's submission
    query = supabase.table("team_submissions") \
        .select("*") \
        .eq("team_id", team_id)
    
    if competition_id:
        query = query.eq("competition_id", competition_id)
    
    result = query.order("submitted_at", desc=True).limit(1).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No submission found")
    
    submission = result.data[0]
    
    return {
        "submitted": True,
        "id": submission["id"],
        "file_name": submission.get("file_name"),
        "file_url": submission.get("file_url"),
        "submitted_at": submission.get("submitted_at"),
        "submitted_by": submission.get("submitted_by"),
        "submitted_by_name": submission.get("submitted_by_name")
    }


@router.post("/teams/{team_id}/submission")
async def submit_team_solution(
    team_id: str,
    file: UploadFile = File(...),
    competition_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Submit team's final solution for the competition case.
    Only one submission per team per competition.
    
    CRITICAL ORDER:
    1. Validate user is team member
    2. Get team and resolve competition EXPLICITLY
    3. Check deadline BEFORE any file processing
    4. Check for existing submission
    5. Validate and upload file
    """
    import logging
    from supabase import create_client
    import uuid
    logger = logging.getLogger(__name__)
    
    # =========================================================
    # STEP 1: Validate file is provided (quick check)
    # =========================================================
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    supabase = get_supabase_client()
    
    # =========================================================
    # STEP 2: Verify user is a team member
    # =========================================================
    try:
        membership = supabase.table("team_members") \
            .select("id") \
            .eq("team_id", team_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not membership.data:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Membership check failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify team membership")
    
    # =========================================================
    # STEP 3: Get team and EXPLICITLY resolve competition
    # =========================================================
    try:
        team_result = supabase.table("teams") \
            .select("competition_id") \
            .eq("id", team_id) \
            .execute()
        
        if not team_result.data:
            raise HTTPException(status_code=404, detail="Team not found")
        
        comp_id = team_result.data[0].get("competition_id")
        
        # Override with provided competition_id if given
        if competition_id:
            comp_id = competition_id
        
        # HARD GUARD: competition_id must exist
        if not comp_id:
            raise HTTPException(status_code=400, detail="Team is not associated with any competition")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Team fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve team information")
    
    # =========================================================
    # STEP 4: EXPLICITLY fetch competition and check deadline
    # This MUST happen BEFORE any file upload
    # =========================================================
    try:
        comp_result = supabase.table("competitions") \
            .select("id, submission_deadline_at, title") \
            .eq("id", comp_id) \
            .execute()
        
        # HARD GUARD: Competition must exist
        if not comp_result.data:
            logger.error(f"Competition not found for id: {comp_id}")
            raise HTTPException(status_code=400, detail="Competition not found for this team")
        
        competition = comp_result.data[0]
        deadline = competition.get("submission_deadline_at")
        
        # HARD GUARD: Deadline must be configured
        if not deadline:
            logger.error(f"Submission deadline not configured for competition: {comp_id}")
            raise HTTPException(
                status_code=400, 
                detail="Submission deadline not configured for this competition. Contact administrator."
            )
        
        # CHECK DEADLINE BEFORE ANY FILE PROCESSING
        try:
            deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            deadline_naive = deadline_dt.replace(tzinfo=None)
            now = datetime.utcnow()
            
            if now > deadline_naive:
                logger.info(f"Submission rejected: deadline passed. Now={now}, Deadline={deadline_naive}")
                raise HTTPException(
                    status_code=403,
                    detail="Submission deadline has passed. No more submissions are accepted."
                )
        except HTTPException:
            raise
        except ValueError as e:
            logger.error(f"Invalid deadline format: {deadline}, error: {e}")
            raise HTTPException(status_code=500, detail="Invalid deadline configuration")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Competition/deadline check failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify submission deadline")
    
    # =========================================================
    # STEP 5: Check if team already has a submission
    # =========================================================
    try:
        existing = supabase.table("team_submissions") \
            .select("id") \
            .eq("team_id", team_id) \
            .eq("competition_id", comp_id) \
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=409,
                detail="Your team has already submitted a solution. Only one submission is allowed."
            )
    except HTTPException:
        raise
    except Exception as e:
        # Table might not exist - log but continue (first submission)
        logger.warning(f"Submission check warning (may be first submission): {e}")
    
    # =========================================================
    # STEP 6: Validate file extension (before reading file)
    # =========================================================
    file_ext = os.path.splitext(file.filename or 'submission.pdf')[1].lower()
    ALLOWED_EXTENSIONS = {'.pdf', '.xls', '.xlsx', '.zip'}
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, Excel (.xls, .xlsx), and ZIP files are accepted."
        )
    
    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
    
    # =========================================================
    # STEP 7: Read and validate file contents
    # =========================================================
    try:
        contents = await file.read()
    except Exception as e:
        logger.error(f"File read failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file")
    
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 25MB limit."
        )
    
    # =========================================================
    # STEP 8: Upload to Supabase Storage
    # =========================================================
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logger.error("Missing Supabase storage configuration")
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    try:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        logger.error(f"Supabase admin client creation failed: {e}")
        raise HTTPException(status_code=500, detail="Storage service unavailable")
    
    # Build file path: Submissions/{competition_id}/{team_id}/{filename}
    unique_id = str(uuid.uuid4())[:8]
    file_path = f"Submissions/{comp_id}/{team_id}/{unique_id}{file_ext}"
    
    try:
        # Upload file to Team-submissions bucket
        upload_result = supabase_admin.storage.from_("Team-submissions").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": "application/octet-stream", "upsert": "true"}
        )
        
        # Check for upload errors
        if hasattr(upload_result, 'error') and upload_result.error:
            logger.error(f"Storage upload error: {upload_result.error}")
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Storage upload exception: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")
    
    # =========================================================
    # STEP 9: Store submission record in database
    # =========================================================
    now = datetime.utcnow().isoformat()
    submission_data = {
        "team_id": team_id,
        "competition_id": comp_id,
        "file_name": file.filename,
        "file_path": file_path,
        "file_url": file_path,
        "file_size": len(contents),
        "submitted_by": current_user.id,
        "submitted_by_name": current_user.full_name,
        "submitted_at": now
    }
    
    submission_id = None
    try:
        result = supabase.table("team_submissions").insert(submission_data).execute()
        if result.data:
            submission_id = result.data[0]["id"]
    except Exception as db_err:
        # File was uploaded, log DB error but don't fail
        logger.warning(f"DB insert warning (file uploaded): {db_err}")
        submission_id = unique_id
    
    logger.info(f"Team {team_id} submitted solution: {file_path}")
    
    return {
        "success": True,
        "submitted": True,
        "id": submission_id or unique_id,
        "file_name": file.filename,
        "submitted_at": now,
        "submitted_by_name": current_user.full_name
    }



# =========================================================
# COMPETITION TASKS (PARTICIPANT VIEW)
# =========================================================

@router.get("/competitions/{competition_id}/tasks")
async def get_competition_tasks_public(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get active tasks for a competition (participant view)."""
    supabase = get_supabase_client()
    
    # Verify user is registered for competition
    registration = supabase.table("competition_registrations")\
        .select("id")\
        .eq("competition_id", competition_id)\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not registration.data:
        raise HTTPException(
            status_code=403,
            detail="You must be registered for this competition"
        )
    
    # Get active tasks
    result = supabase.table("tasks")\
        .select("id, title, description, task_type, max_points, deadline, order_index")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)\
        .order("order_index")\
        .execute()
    
    return result.data or []


@router.post("/tasks/{task_id}/submit")
async def submit_task(
    task_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Submit a file for a specific task."""
    import logging
    from uuid import uuid4
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Get task details with competition info
    task = supabase.table("tasks")\
        .select("*, competitions(*)")\
        .eq("id", task_id)\
        .execute()
    
    if not task.data:
        raise HTTPException(status_code=404, detail=CompetitionErrors.TASK_NOT_FOUND)
    
    task_data = task.data[0]
    competition_id = task_data["competition_id"]
    competition = task_data.get("competitions", {})
    
    # PHASE 1.5: Check competition status flags
    status_flags = get_competition_status_flags(competition)
    
    if status_flags["submissions_locked"]:
        raise HTTPException(status_code=403, detail=CompetitionErrors.SUBMISSIONS_LOCKED)
    
    if not status_flags["submission_open"]:
        raise HTTPException(status_code=403, detail=CompetitionErrors.SUBMISSION_CLOSED)
    
    # Check task-specific deadline
    if task_data.get("deadline"):
        try:
            deadline = datetime.fromisoformat(task_data["deadline"].replace("Z", "+00:00"))
            if datetime.now(deadline.tzinfo) > deadline:
                raise HTTPException(status_code=403, detail=CompetitionErrors.DEADLINE_PASSED)
        except ValueError:
            pass  # If deadline parsing fails, proceed
    
    # Get user's team for this competition
    membership = supabase.table("team_members")\
        .select("team_id, teams(competition_id)")\
        .eq("user_id", current_user.id)\
        .execute()
    
    team_id = None
    for m in (membership.data or []):
        if m.get("teams", {}).get("competition_id") == competition_id:
            team_id = m["team_id"]
            break
    
    if not team_id:
        raise HTTPException(status_code=403, detail=CompetitionErrors.NOT_IN_TEAM)
    
    # Check for existing submission (DB constraint will also prevent duplicates)
    existing = supabase.table("submissions")\
        .select("id, status")\
        .eq("task_id", task_id)\
        .eq("team_id", team_id)\
        .execute()
    
    if existing.data and existing.data[0].get("status") == "locked":
        raise HTTPException(status_code=403, detail=CompetitionErrors.SUBMISSIONS_LOCKED)
    
    # Upload file
    file_content = await file.read()
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    unique_filename = f"{uuid4()}.{file_ext}"
    file_path = f"submissions/{competition_id}/{task_id}/{team_id}/{unique_filename}"
    
    try:
        supabase_admin = get_supabase_client(use_service_role=True)
        upload_result = supabase_admin.storage.from_("Team-submissions").upload(
            file_path,
            file_content,
            {"content-type": file.content_type or "application/octet-stream"}
        )
        
        if hasattr(upload_result, 'error') and upload_result.error:
            raise Exception(upload_result.error)
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")
    
    # Create or update submission record
    submission_dict = {
        "task_id": task_id,
        "team_id": team_id,
        "file_path": file_path,
        "file_name": file.filename,
        "submitted_by": current_user.id,
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "submitted"
    }
    
    if existing.data:
        result = supabase.table("submissions")\
            .update(submission_dict)\
            .eq("id", existing.data[0]["id"])\
            .execute()
    else:
        result = supabase.table("submissions").insert(submission_dict).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save submission")
    
    return {
        "success": True,
        "message": "Submission uploaded successfully",
        "submission": result.data[0]
    }


@router.get("/tasks/{task_id}/my-submission")
async def get_my_submission(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current team's submission for a task."""
    supabase = get_supabase_client()
    
    # Get task to find competition
    task = supabase.table("tasks")\
        .select("competition_id")\
        .eq("id", task_id)\
        .execute()
    
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    competition_id = task.data[0]["competition_id"]
    
    # Get user's team
    membership = supabase.table("team_members")\
        .select("team_id, teams(competition_id)")\
        .eq("user_id", current_user.id)\
        .execute()
    
    team_id = None
    for m in (membership.data or []):
        if m.get("teams", {}).get("competition_id") == competition_id:
            team_id = m["team_id"]
            break
    
    if not team_id:
        return None
    
    # Get submission
    result = supabase.table("submissions")\
        .select("*")\
        .eq("task_id", task_id)\
        .eq("team_id", team_id)\
        .execute()
    
    return result.data[0] if result.data else None


# =========================================================
# PUBLIC LEADERBOARD (READ-ONLY)
# =========================================================

@router.get("/competitions/{competition_id}/leaderboard")
async def get_public_leaderboard(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get public leaderboard for a competition.
    Only shows results if competition has published results.
    """
    supabase = get_supabase_client()
    
    # Check if results are published
    comp = supabase.table("competitions")\
        .select("*")\
        .eq("id", competition_id)\
        .execute()
    
    if not comp.data:
        raise HTTPException(status_code=404, detail=CompetitionErrors.COMPETITION_NOT_FOUND)
    
    # PHASE 1.5: Check explicit status flags
    status_flags = get_competition_status_flags(comp.data[0])
    
    if not status_flags["results_published"]:
        raise HTTPException(status_code=403, detail=CompetitionErrors.RESULTS_NOT_PUBLISHED)
    
    # Get leaderboard (same logic as admin but limited data)
    teams = supabase.table("teams")\
        .select("id, team_name")\
        .eq("competition_id", competition_id)\
        .execute()
    
    if not teams.data:
        return {"leaderboard": []}
    
    leaderboard = []
    
    for team in teams.data:
        submissions = supabase.table("submissions")\
            .select("id")\
            .eq("team_id", team["id"])\
            .execute()
        
        total_score = 0
        for sub in (submissions.data or []):
            scores = supabase.table("scores")\
                .select("total_score")\
                .eq("submission_id", sub["id"])\
                .eq("is_final", True)\
                .execute()
            
            if scores.data:
                avg = sum(s["total_score"] for s in scores.data) / len(scores.data)
                total_score += avg
        
        leaderboard.append({
            "team_name": team["team_name"],
            "total_score": round(total_score, 2)
        })
    
    leaderboard.sort(key=lambda x: -x["total_score"])
    
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return {"leaderboard": leaderboard}
