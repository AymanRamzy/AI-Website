from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
from datetime import datetime
import os

from supabase_client import get_supabase_client
from auth import get_admin_user
from models import (
    User, UserRole, UserUpdate, AdminUserResponse,
    CompetitionCreate, CompetitionUpdate, CompetitionResponse, CompetitionStatus,
    CFOApplicationResponse, CFOApplicationReview, CFOApplicationStatus,
    TaskCreate, TaskResponse,
    JudgeAssignment, JudgeAssignmentResponse
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def calculate_auto_score(app_data: dict) -> float:
    score = 0.0
    years = app_data.get('years_experience', 0)
    if years >= 10:
        score += 30
    elif years >= 5:
        score += 20
    elif years >= 2:
        score += 10
    
    certs = app_data.get('certifications', [])
    cert_points = {'CFA': 15, 'CPA': 12, 'CMA': 12, 'FMVA': 10, 'MBA': 8}
    for cert in certs:
        score += cert_points.get(cert.upper(), 5)
    
    availability = app_data.get('availability_score', 5)
    score += availability * 2
    
    education = app_data.get('education_level', '')
    if 'phd' in education.lower():
        score += 15
    elif 'master' in education.lower():
        score += 10
    elif 'bachelor' in education.lower():
        score += 5
    
    return min(score, 100)

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    response = supabase.table('user_profiles').select('*').order('created_at', desc=True).execute()
    
    users = []
    for u in response.data or []:
        users.append(AdminUserResponse(
            id=u['id'],
            email=u.get('email') or '',
            full_name=u.get('full_name') or 'Unknown',
            role=UserRole(u.get('role', 'participant')),
            is_cfo_qualified=u.get('is_cfo_qualified', False),
            created_at=datetime.fromisoformat(u['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(u['updated_at'].replace('Z', '+00:00'))
        ))
    return users

@router.patch("/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    update_data = {k: v.value if hasattr(v, 'value') else v for k, v in updates.model_dump(exclude_none=True).items()}
    update_data['updated_at'] = datetime.utcnow().isoformat()
    
    response = supabase.table('user_profiles').update(update_data).eq('id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated", "user": response.data[0]}

@router.get("/competitions")
async def get_all_competitions(current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    response = supabase.table('competitions').select('*').order('created_at', desc=True).execute()
    return response.data or []

@router.post("/competitions")
async def create_competition(comp: CompetitionCreate, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    import logging
    logger = logging.getLogger(__name__)
    
    comp_data = {
        "title": comp.title,
        "description": comp.description or "",
        "registration_start": comp.registration_start,
        "registration_end": comp.registration_end,
        "competition_start": comp.competition_start,
        "competition_end": comp.competition_end,
        "max_teams": comp.max_teams,
        "status": comp.status if comp.status in ["draft", "open", "closed"] else "draft"
    }
    
    try:
        response = supabase.table('competitions').insert(comp_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create competition")
        return response.data[0]
    except Exception as e:
        logger.error(f"Competition create error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/competitions/{comp_id}")
async def update_competition(comp_id: str, updates: CompetitionUpdate, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    update_data = {}
    for k, v in updates.model_dump(exclude_none=True).items():
        if hasattr(v, 'value'):
            update_data[k] = v.value
        elif isinstance(v, datetime):
            update_data[k] = v.isoformat()
        else:
            update_data[k] = v
    update_data['updated_at'] = datetime.utcnow().isoformat()
    
    response = supabase.table('competitions').update(update_data).eq('id', comp_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    return {"message": "Competition updated", "competition": response.data[0]}

@router.delete("/competitions/{comp_id}")
async def delete_competition(comp_id: str, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    supabase.table('competitions').delete().eq('id', comp_id).execute()
    return {"message": "Competition deleted"}


@router.get("/competitions/{competition_id}/cfo-applications")
async def get_competition_cfo_applications(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all CFO applications for a specific competition (Admin only)"""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Verify competition exists
    comp_check = supabase.table('competitions').select('id, title').eq('id', competition_id).execute()
    if not comp_check.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Get all applications for this competition with user info
    # Use explicit relationship name to avoid ambiguity (user_id vs override_by)
    response = supabase.table('cfo_applications')\
        .select('*, user_profiles!cfo_applications_user_id_fkey(full_name, email)')\
        .eq('competition_id', competition_id)\
        .order('total_score', desc=True)\
        .execute()
    
    applications = response.data or []
    
    # Add ranking
    rank = 1
    for app in applications:
        if not app.get('auto_excluded'):
            app['rank'] = rank
            rank += 1
        else:
            app['rank'] = None
    
    logger.info(f"Admin {current_user.id} viewed {len(applications)} applications for competition {competition_id}")
    
    return {
        "competition": comp_check.data[0],
        "total_count": len(applications),
        "applications": applications
    }


@router.get("/competitions/{competition_id}/cfo-applications/{application_id}/cv")
async def get_application_cv_download(
    competition_id: str,
    application_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Generate signed download URL for applicant's CV (Admin only)
    BOARD-APPROVED: Manual CV download for admin review
    """
    import logging
    import os
    from supabase import create_client
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Verify application exists and belongs to competition
    app_response = supabase.table('cfo_applications')\
        .select('id, cv_url, user_id')\
        .eq('id', application_id)\
        .eq('competition_id', competition_id)\
        .execute()
    
    if not app_response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application = app_response.data[0]
    cv_url = application.get('cv_url')
    
    if not cv_url:
        raise HTTPException(status_code=404, detail="No CV uploaded for this application")
    
    # Extract file path from cv_url
    # cv_url could be: 
    # - "storage/cfo-cvs/cfo/{comp_id}/{user_id}.pdf" (path reference)
    # - Full signed URL (already signed, may be expired)
    # - "cfo/{comp_id}/{user_id}.pdf" (direct path)
    
    if 'storage/cfo-cvs/' in cv_url:
        file_path = cv_url.replace('storage/cfo-cvs/', '')
    elif cv_url.startswith('cfo/'):
        file_path = cv_url
    elif '/object/sign/cfo-cvs/' in cv_url:
        # Extract path from signed URL
        parts = cv_url.split('/object/sign/cfo-cvs/')
        if len(parts) > 1:
            file_path = parts[1].split('?')[0]
        else:
            # Fallback: construct from known format
            file_path = f"cfo/{competition_id}/{application['user_id']}.pdf"
    else:
        # Fallback: construct from known format
        file_path = f"cfo/{competition_id}/{application['user_id']}.pdf"
    
    # Create dedicated admin client for storage access (service role key bypasses RLS)
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        # Generate signed URL with short expiry (10 minutes = 600 seconds)
        signed_url_result = supabase_admin.storage.from_("cfo-cvs").create_signed_url(file_path, 600)
        
        if not signed_url_result:
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
        
        # Handle different response formats from Supabase
        download_url = None
        if isinstance(signed_url_result, dict):
            download_url = signed_url_result.get('signedURL') or signed_url_result.get('signedUrl')
        
        if not download_url:
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
        
        logger.info(f"Admin {current_user.id} requested CV download for application {application_id}")
        
        return {
            "download_url": download_url,
            "expires_in": 600,
            "filename": f"cv_{application_id[:8]}.pdf"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CV download error for application {application_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate download URL")


@router.get("/competitions/{competition_id}/cfo-applications/{application_id}")
async def get_application_detail(
    competition_id: str,
    application_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get detailed view of a single CFO application (Admin only)"""
    supabase = get_supabase_client()
    
    # Use explicit relationship name to avoid ambiguity
    response = supabase.table('cfo_applications')\
        .select('*, user_profiles!cfo_applications_user_id_fkey(full_name, email)')\
        .eq('id', application_id)\
        .eq('competition_id', competition_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return response.data[0]


@router.put("/competitions/{competition_id}/cfo-applications/{application_id}/status")
async def update_application_status(
    competition_id: str,
    application_id: str,
    new_status: str,
    reason: str = None,
    current_user: User = Depends(get_admin_user)
):
    """Update CFO application status (Admin only)"""
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    valid_statuses = ["qualified", "reserve", "not_selected", "excluded", "pending"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Verify application exists and belongs to competition
    app_check = supabase.table('cfo_applications')\
        .select('id')\
        .eq('id', application_id)\
        .eq('competition_id', competition_id)\
        .execute()
    
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found in this competition")
    
    # Update status
    update_data = {
        "status": new_status,
        "admin_override": True,
        "override_reason": reason,
        "override_by": current_user.id,
        "override_at": datetime.utcnow().isoformat()
    }
    
    supabase.table('cfo_applications')\
        .update(update_data)\
        .eq('id', application_id)\
        .execute()
    
    logger.info(f"Admin {current_user.id} changed application {application_id} status to {new_status}")
    
    return {"success": True, "message": f"Application status updated to {new_status}"}


@router.get("/cfo-applications", response_model=List[CFOApplicationResponse])
async def get_cfo_applications(
    status_filter: Optional[str] = None,
    competition_id: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    supabase = get_supabase_client()
    query = supabase.table('cfo_applications').select('*')
    if status_filter:
        query = query.eq('status', status_filter)
    if competition_id:
        query = query.eq('competition_id', competition_id)
    response = query.order('final_score', desc=True).execute()
    return response.data or []

@router.patch("/cfo-applications/{app_id}")
async def review_cfo_application(app_id: str, review: CFOApplicationReview, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    
    app_response = supabase.table('cfo_applications').select('*').eq('id', app_id).execute()
    if not app_response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = app_response.data[0]
    auto_score = app.get('auto_score', 0)
    manual_score = review.manual_score if review.manual_score is not None else app.get('manual_score')
    final_score = manual_score if manual_score is not None else auto_score
    
    update_data = {
        "status": review.status.value,
        "final_score": final_score,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    if review.manual_score is not None:
        update_data["manual_score"] = review.manual_score
    if review.admin_notes:
        update_data["admin_notes"] = review.admin_notes
    if review.rejection_reason:
        update_data["rejection_reason"] = review.rejection_reason
    
    response = supabase.table('cfo_applications').update(update_data).eq('id', app_id).execute()
    
    if review.status == CFOApplicationStatus.APPROVED:
        supabase.table('user_profiles').update({
            "is_cfo_qualified": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq('id', app['user_id']).execute()
    
    supabase.table('admin_audit_log').insert({
        "admin_id": current_user.id,
        "action": f"reviewed_cfo_application_{review.status.value}",
        "entity_type": "cfo_application",
        "entity_id": app_id,
        "new_values": update_data
    }).execute()
    
    return {"message": "Application reviewed", "application": response.data[0]}

@router.post("/cfo-applications/bulk-approve")
async def bulk_approve_top_applications(
    competition_id: str,
    top_n: int = 40,
    current_user: User = Depends(get_admin_user)
):
    supabase = get_supabase_client()
    response = supabase.table('cfo_applications').select('id,final_score').eq('competition_id', competition_id).eq('status', 'pending').order('final_score', desc=True).limit(top_n).execute()
    
    approved_count = 0
    for app in response.data or []:
        supabase.table('cfo_applications').update({
            "status": "approved",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq('id', app['id']).execute()
        
        supabase.table('user_profiles').update({
            "is_cfo_qualified": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq('id', app['user_id']).execute()
        approved_count += 1
    
    return {"message": f"Approved top {approved_count} applications"}

@router.get("/judges", response_model=List[AdminUserResponse])
async def get_judges(current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    response = supabase.table('user_profiles').select('*').eq('role', 'judge').execute()
    
    judges = []
    for u in response.data or []:
        judges.append(AdminUserResponse(
            id=u['id'],
            email=u.get('email', ''),
            full_name=u.get('full_name', ''),
            role=UserRole.JUDGE,
            is_cfo_qualified=u.get('is_cfo_qualified', False),
            created_at=datetime.fromisoformat(u['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(u['updated_at'].replace('Z', '+00:00'))
        ))
    return judges

@router.post("/judge-assignments")
async def assign_judge(assignment: JudgeAssignment, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    
    existing = supabase.table('judge_assignments').select('id').eq('competition_id', assignment.competition_id).eq('judge_id', assignment.judge_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Judge already assigned to this competition")
    
    response = supabase.table('judge_assignments').insert({
        "competition_id": assignment.competition_id,
        "judge_id": assignment.judge_id,
        "assigned_by": current_user.id,
        "status": "active"
    }).execute()
    return {"message": "Judge assigned", "assignment": response.data[0]}

@router.get("/judge-assignments/{competition_id}")
async def get_competition_judges(competition_id: str, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    response = supabase.table('judge_assignments').select('*, user_profiles(full_name, email)').eq('competition_id', competition_id).execute()
    
    assignments = []
    for a in response.data or []:
        profile = a.get('user_profiles', {}) or {}
        assignments.append({
            "id": a['id'],
            "competition_id": a['competition_id'],
            "judge_id": a['judge_id'],
            "judge_name": profile.get('full_name', ''),
            "judge_email": profile.get('email', ''),
            "status": a['status'],
            "created_at": a['created_at']
        })
    return assignments

@router.delete("/judge-assignments/{assignment_id}")
async def remove_judge_assignment(assignment_id: str, current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    supabase.table('judge_assignments').delete().eq('id', assignment_id).execute()
    return {"message": "Judge assignment removed"}

@router.get("/stats")
async def get_admin_stats(current_user: User = Depends(get_admin_user)):
    supabase = get_supabase_client()
    
    users = supabase.table('user_profiles').select('id').execute()
    competitions = supabase.table('competitions').select('id').execute()
    
    try:
        teams = supabase.table('teams').select('id').execute()
        total_teams = len(teams.data or [])
    except Exception:
        total_teams = 0
    
    try:
        applications = supabase.table('cfo_applications').select('id, status').execute()
        total_apps = len(applications.data or [])
        pending_apps = len([a for a in (applications.data or []) if a.get('status') == 'pending'])
    except Exception:
        total_apps = 0
        pending_apps = 0
    
    return {
        "total_users": len(users.data or []),
        "total_competitions": len(competitions.data or []),
        "total_teams": total_teams,
        "total_applications": total_apps,
        "pending_applications": pending_apps
    }



# =========================================================
# ADMIN CASE FILE MANAGEMENT
# =========================================================

@router.post("/competitions/{competition_id}/case-files")
async def upload_case_file(
    competition_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin_user)
):
    """
    Upload case file for a competition (Admin only).
    Files stored in: team-submissions/Cases/{competition_id}/
    Allowed: PDF, DOC, DOCX, XLS, XLSX, ZIP
    """
    import logging
    from supabase import create_client
    import uuid as uuid_lib
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Validate file
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Verify competition exists
    comp_result = supabase.table("competitions").select("id, status, competition_start").eq("id", competition_id).execute()
    if not comp_result.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp_result.data[0]
    
    # Check if competition has started (block replacement after start)
    comp_start = competition.get("competition_start")
    if comp_start:
        try:
            start_dt = datetime.fromisoformat(comp_start.replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=start_dt.tzinfo) > start_dt:
                raise HTTPException(
                    status_code=403, 
                    detail="Cannot upload case files after competition has started"
                )
        except ValueError:
            pass
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename or '')[1].lower()
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip'}
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, ZIP"
        )
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB for case files
    
    # Read file
    try:
        contents = await file.read()
    except Exception as e:
        logger.error(f"File read error: {e}")
        raise HTTPException(status_code=400, detail="Failed to read file")
    
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 50MB limit")
    
    # Setup storage client
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # Build file path: Cases/{competition_id}/{original_filename}
    safe_filename = file.filename.replace(" ", "_")
    file_path = f"Cases/{competition_id}/{safe_filename}"
    
    try:
        # Remove existing file with same name (for replacement)
        try:
            supabase_admin.storage.from_("team-submissions").remove([file_path])
        except Exception:
            pass
        
        # Upload file
        upload_result = supabase_admin.storage.from_("team-submissions").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": "application/octet-stream", "upsert": "true"}
        )
        
        if hasattr(upload_result, 'error') and upload_result.error:
            logger.error(f"Storage upload error: {upload_result.error}")
            raise HTTPException(status_code=500, detail="Failed to upload file")
        
        logger.info(f"Admin {current_user.id} uploaded case file: {file_path}")
        
        return {
            "success": True,
            "file_name": file.filename,
            "file_path": file_path,
            "file_size": len(contents),
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Case file upload error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload case file")


@router.get("/competitions/{competition_id}/case-files")
async def list_case_files(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """List all case files for a competition (Admin only)."""
    import logging
    from supabase import create_client
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Verify competition exists
    comp_result = supabase.table("competitions").select("id").eq("id", competition_id).execute()
    if not comp_result.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        # List files in Cases/{competition_id}/
        folder_path = f"Cases/{competition_id}"
        list_result = supabase_admin.storage.from_("team-submissions").list(folder_path)
        
        files = []
        for item in list_result or []:
            if item.get("name") and not item.get("name").startswith("."):
                files.append({
                    "name": item.get("name"),
                    "size": item.get("metadata", {}).get("size", 0),
                    "created_at": item.get("created_at"),
                    "path": f"{folder_path}/{item.get('name')}"
                })
        
        return {"files": files}
        
    except Exception as e:
        logger.error(f"List case files error: {e}")
        return {"files": []}


@router.delete("/competitions/{competition_id}/case-files/{file_name}")
async def delete_case_file(
    competition_id: str,
    file_name: str,
    current_user: User = Depends(get_admin_user)
):
    """Delete a case file (Admin only, before competition start)."""
    import logging
    from supabase import create_client
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    # Verify competition exists and hasn't started
    comp_result = supabase.table("competitions").select("id, competition_start").eq("id", competition_id).execute()
    if not comp_result.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp_result.data[0]
    comp_start = competition.get("competition_start")
    if comp_start:
        try:
            start_dt = datetime.fromisoformat(comp_start.replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=start_dt.tzinfo) > start_dt:
                raise HTTPException(status_code=403, detail="Cannot delete case files after competition has started")
        except ValueError:
            pass
    
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        file_path = f"Cases/{competition_id}/{file_name}"
        supabase_admin.storage.from_("team-submissions").remove([file_path])
        
        logger.info(f"Admin {current_user.id} deleted case file: {file_path}")
        
        return {"success": True, "message": "File deleted"}
        
    except Exception as e:
        logger.error(f"Delete case file error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")
