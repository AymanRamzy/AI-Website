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
        "status": comp.status if comp.status in ["draft", "open", "closed", "registration_open"] else "draft"
    }
    
    # Add timer fields if provided
    if comp.case_release_at:
        comp_data["case_release_at"] = comp.case_release_at
    if comp.submission_deadline_at:
        comp_data["submission_deadline_at"] = comp.submission_deadline_at
    
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
    
    # Only add updated_at if it exists in the table (skip if column doesn't exist)
    # update_data['updated_at'] = datetime.utcnow().isoformat()
    
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
    Files stored in: Team-submissions/Cases/{competition_id}/
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
            supabase_admin.storage.from_("Team-submissions").remove([file_path])
        except Exception:
            pass
        
        # Upload file
        upload_result = supabase_admin.storage.from_("Team-submissions").upload(
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
        list_result = supabase_admin.storage.from_("Team-submissions").list(folder_path)
        
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
        supabase_admin.storage.from_("Team-submissions").remove([file_path])
        
        logger.info(f"Admin {current_user.id} deleted case file: {file_path}")
        
        return {"success": True, "message": "File deleted"}
        
    except Exception as e:
        logger.error(f"Delete case file error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")


# =========================================================
# ADMIN TEAM CHAT MANAGEMENT
# =========================================================

@router.get("/teams")
async def get_all_teams(
    competition_id: str = None,
    current_user: User = Depends(get_admin_user)
):
    """Get all teams for admin monitoring. Optionally filter by competition."""
    supabase = get_supabase_client()
    
    query = supabase.table('teams').select('*, team_members(user_id, role)')
    
    if competition_id:
        query = query.eq('competition_id', competition_id)
    
    response = query.order('created_at', desc=True).execute()
    
    teams = []
    for team in response.data or []:
        teams.append({
            "id": team['id'],
            "name": team['name'],
            "competition_id": team.get('competition_id'),
            "status": team.get('status', 'forming'),
            "created_at": team.get('created_at'),
            "member_count": len(team.get('team_members', []))
        })
    
    return teams


@router.get("/teams/{team_id}/chat")
async def get_team_chat_admin(
    team_id: str,
    limit: int = 100,
    current_user: User = Depends(get_admin_user)
):
    """Get team chat messages for admin monitoring."""
    supabase = get_supabase_client()
    
    # Verify team exists
    team_response = supabase.table('teams').select('id, name').eq('id', team_id).execute()
    if not team_response.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_response.data[0]
    
    # Get messages
    messages_response = supabase.table('chat_messages')\
        .select('*')\
        .eq('team_id', team_id)\
        .order('created_at', desc=False)\
        .limit(limit)\
        .execute()
    
    messages = []
    for msg in messages_response.data or []:
        messages.append({
            "id": msg['id'],
            "team_id": msg['team_id'],
            "user_id": msg['user_id'],
            "user_name": msg['user_name'],
            "message_type": msg['message_type'],
            "content": msg['content'],
            "file_url": msg.get('file_url'),
            "file_name": msg.get('file_name'),
            "file_size": msg.get('file_size'),
            "timestamp": msg.get('created_at'),
            "is_admin": msg.get('is_admin', False)
        })
    
    return {
        "team": team,
        "messages": messages
    }


@router.post("/teams/{team_id}/chat")
async def send_admin_message(
    team_id: str,
    message: dict,
    current_user: User = Depends(get_admin_user)
):
    """Send a message to a team chat as admin (for support)."""
    import logging
    logger = logging.getLogger(__name__)
    
    supabase = get_supabase_client()
    
    # Verify team exists
    team_response = supabase.table('teams').select('id').eq('id', team_id).execute()
    if not team_response.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    content = message.get('content', '').strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content required")
    
    # Build admin message with indicator
    message_dict = {
        "team_id": team_id,
        "user_id": current_user.id,
        "user_name": f"🛡️ Admin: {current_user.full_name}",
        "message_type": "text",
        "content": content,
        "is_admin": True
    }
    
    try:
        response = supabase.table('chat_messages').insert(message_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to send message")
        
        msg = response.data[0]
        logger.info(f"Admin {current_user.id} sent message to team {team_id}")
        
        return {
            "success": True,
            "message": {
                "id": msg['id'],
                "team_id": msg['team_id'],
                "user_id": msg['user_id'],
                "user_name": msg['user_name'],
                "content": msg['content'],
                "timestamp": msg.get('created_at'),
                "is_admin": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


# =========================================================
# COMPETITION TASKS MANAGEMENT (PHASE 1 - MODULE 2)
# =========================================================

@router.get("/competitions/{competition_id}/tasks")
async def get_competition_tasks(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all tasks for a competition (admin only)."""
    supabase = get_supabase_client()
    
    result = supabase.table("tasks")\
        .select("*")\
        .eq("competition_id", competition_id)\
        .order("order_index")\
        .execute()
    
    return result.data or []


@router.post("/competitions/{competition_id}/tasks")
async def create_task(
    competition_id: str,
    task: TaskCreate,
    current_user: User = Depends(get_admin_user)
):
    """Create a new task for a competition."""
    supabase = get_supabase_client()
    
    # Verify competition exists
    comp = supabase.table("competitions").select("id").eq("id", competition_id).execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    task_dict = {
        "competition_id": competition_id,
        "title": task.title,
        "description": task.description,
        "task_type": task.task_type or "submission",
        "max_points": task.max_points or 100,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "order_index": task.order_index or 0,
        "is_active": True,
        "created_by": current_user.id
    }
    
    result = supabase.table("tasks").insert(task_dict).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create task")
    
    return result.data[0]


@router.patch("/competitions/{competition_id}/tasks/{task_id}")
async def update_task(
    competition_id: str,
    task_id: str,
    updates: dict,
    current_user: User = Depends(get_admin_user)
):
    """Update a task."""
    supabase = get_supabase_client()
    
    # Verify task belongs to competition
    existing = supabase.table("tasks")\
        .select("id")\
        .eq("id", task_id)\
        .eq("competition_id", competition_id)\
        .execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Filter allowed fields
    allowed_fields = ["title", "description", "task_type", "max_points", "deadline", "order_index", "is_active"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
    
    return result.data[0] if result.data else {"success": True}


@router.delete("/competitions/{competition_id}/tasks/{task_id}")
async def delete_task(
    competition_id: str,
    task_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Delete a task (only if no submissions exist)."""
    supabase = get_supabase_client()
    
    # Check for existing submissions
    submissions = supabase.table("submissions")\
        .select("id")\
        .eq("task_id", task_id)\
        .execute()
    
    if submissions.data:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete task with existing submissions"
        )
    
    supabase.table("tasks").delete().eq("id", task_id).execute()
    
    return {"success": True, "message": "Task deleted"}


# =========================================================
# JUDGING & SCORING (PHASE 1 - MODULE 3)
# =========================================================

@router.get("/competitions/{competition_id}/submissions")
async def get_all_submissions(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all submissions for a competition (admin view)."""
    supabase = get_supabase_client()
    
    # Get all tasks for this competition
    tasks = supabase.table("tasks")\
        .select("id, title")\
        .eq("competition_id", competition_id)\
        .execute()
    
    task_ids = [t["id"] for t in (tasks.data or [])]
    
    if not task_ids:
        return []
    
    # Get submissions with team info
    submissions = supabase.table("submissions")\
        .select("*, teams(id, team_name)")\
        .in_("task_id", task_ids)\
        .order("submitted_at", desc=True)\
        .execute()
    
    return submissions.data or []


@router.post("/submissions/{submission_id}/score")
async def score_submission(
    submission_id: str,
    score_data: dict,
    current_user: User = Depends(get_admin_user)
):
    """
    Judge scores a submission.
    score_data: {
        criteria_scores: {"criterion1": 25, "criterion2": 30, ...},
        total_score: 85,
        feedback: "Optional feedback text",
        is_final: false
    }
    """
    supabase = get_supabase_client()
    
    # Verify submission exists
    submission = supabase.table("submissions")\
        .select("id, task_id")\
        .eq("id", submission_id)\
        .execute()
    
    if not submission.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if judge already scored this submission
    existing_score = supabase.table("scores")\
        .select("id")\
        .eq("submission_id", submission_id)\
        .eq("judge_id", current_user.id)\
        .execute()
    
    score_dict = {
        "submission_id": submission_id,
        "judge_id": current_user.id,
        "criteria_scores": score_data.get("criteria_scores", {}),
        "total_score": score_data.get("total_score", 0),
        "feedback": score_data.get("feedback", ""),
        "is_final": score_data.get("is_final", False),
        "scored_at": datetime.utcnow().isoformat()
    }
    
    if existing_score.data:
        # Update existing score
        result = supabase.table("scores")\
            .update(score_dict)\
            .eq("id", existing_score.data[0]["id"])\
            .execute()
    else:
        # Insert new score
        result = supabase.table("scores").insert(score_dict).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save score")
    
    return result.data[0]


@router.get("/submissions/{submission_id}/scores")
async def get_submission_scores(
    submission_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all judge scores for a submission."""
    supabase = get_supabase_client()
    
    result = supabase.table("scores")\
        .select("*, user_profiles(full_name)")\
        .eq("submission_id", submission_id)\
        .execute()
    
    return result.data or []


# =========================================================
# LEADERBOARD (PHASE 1 - MODULE 4)
# =========================================================

@router.get("/competitions/{competition_id}/leaderboard")
async def get_leaderboard(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Get competition leaderboard with aggregated scores.
    Tie-break: Higher total score wins. If tied, earlier submission time wins.
    """
    supabase = get_supabase_client()
    
    # Get all teams for this competition
    teams = supabase.table("teams")\
        .select("id, team_name, leader_id")\
        .eq("competition_id", competition_id)\
        .execute()
    
    if not teams.data:
        return []
    
    # Get all tasks for scoring weight
    tasks = supabase.table("tasks")\
        .select("id, title, max_points")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)\
        .execute()
    
    task_map = {t["id"]: t for t in (tasks.data or [])}
    
    # Calculate scores for each team
    leaderboard = []
    
    for team in teams.data:
        team_id = team["id"]
        
        # Get all submissions for this team
        submissions = supabase.table("submissions")\
            .select("id, task_id, submitted_at")\
            .eq("team_id", team_id)\
            .execute()
        
        total_score = 0
        tasks_completed = 0
        earliest_submission = None
        
        for sub in (submissions.data or []):
            # Get average score from all judges
            scores = supabase.table("scores")\
                .select("total_score")\
                .eq("submission_id", sub["id"])\
                .eq("is_final", True)\
                .execute()
            
            if scores.data:
                avg_score = sum(s["total_score"] for s in scores.data) / len(scores.data)
                total_score += avg_score
                tasks_completed += 1
            
            # Track earliest submission for tie-break
            sub_time = sub.get("submitted_at")
            if sub_time:
                if earliest_submission is None or sub_time < earliest_submission:
                    earliest_submission = sub_time
        
        leaderboard.append({
            "team_id": team_id,
            "team_name": team["team_name"],
            "total_score": round(total_score, 2),
            "tasks_completed": tasks_completed,
            "total_tasks": len(task_map),
            "earliest_submission": earliest_submission
        })
    
    # Sort by total_score (desc), then by earliest_submission (asc) for tie-break
    leaderboard.sort(key=lambda x: (-x["total_score"], x["earliest_submission"] or "9999"))
    
    # Add rank
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return leaderboard


# =========================================================
# ADMIN STAGE CONTROL (PHASE 1 - MODULE 5)
# =========================================================

@router.post("/competitions/{competition_id}/lock-submissions")
async def lock_submissions(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Lock all submissions for a competition (after deadline)."""
    supabase = get_supabase_client()
    
    # Update competition status
    supabase.table("competitions")\
        .update({"status": "judging"})\
        .eq("id", competition_id)\
        .execute()
    
    # Get all tasks and mark submissions as locked
    tasks = supabase.table("tasks")\
        .select("id")\
        .eq("competition_id", competition_id)\
        .execute()
    
    task_ids = [t["id"] for t in (tasks.data or [])]
    
    if task_ids:
        supabase.table("submissions")\
            .update({"status": "locked"})\
            .in_("task_id", task_ids)\
            .execute()
    
    return {"success": True, "message": "Submissions locked"}


@router.post("/competitions/{competition_id}/publish-results")
async def publish_results(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Publish competition results (makes leaderboard public)."""
    supabase = get_supabase_client()
    
    supabase.table("competitions")\
        .update({"status": "completed", "results_published": True})\
        .eq("id", competition_id)\
        .execute()
    
    return {"success": True, "message": "Results published"}


# =========================================================
# PHASE 2-4: LEVELS ENGINE (ADMIN ENDPOINTS)
# =========================================================

# ---- SCORING CRITERIA MANAGEMENT ----

@router.get("/scoring-criteria")
async def get_scoring_criteria(
    current_user: User = Depends(get_admin_user)
):
    """Get all scoring criteria with weights."""
    supabase = get_supabase_client()
    
    result = supabase.table("scoring_criteria")\
        .select("*")\
        .order("display_order")\
        .execute()
    
    return result.data or []


@router.post("/scoring-criteria")
async def create_scoring_criterion(
    criterion: dict,
    current_user: User = Depends(get_admin_user)
):
    """Create a new scoring criterion."""
    supabase = get_supabase_client()
    
    data = {
        "name": criterion["name"],
        "description": criterion.get("description", ""),
        "weight": criterion.get("weight", 0),
        "max_score": criterion.get("max_score", 100),
        "applies_to_levels": criterion.get("applies_to_levels", [1,2,3,4]),
        "display_order": criterion.get("display_order", 0),
        "is_active": True
    }
    
    result = supabase.table("scoring_criteria").insert(data).execute()
    return result.data[0] if result.data else None


@router.patch("/scoring-criteria/{criterion_id}")
async def update_scoring_criterion(
    criterion_id: str,
    updates: dict,
    current_user: User = Depends(get_admin_user)
):
    """Update a scoring criterion."""
    supabase = get_supabase_client()
    
    allowed = ["name", "description", "weight", "max_score", "applies_to_levels", "display_order", "is_active"]
    data = {k: v for k, v in updates.items() if k in allowed}
    
    result = supabase.table("scoring_criteria")\
        .update(data)\
        .eq("id", criterion_id)\
        .execute()
    
    return result.data[0] if result.data else {"success": True}


# ---- LEVEL TASK TEMPLATES ----

@router.post("/competitions/{competition_id}/create-level-tasks")
async def create_level_tasks(
    competition_id: str,
    level: int,
    current_user: User = Depends(get_admin_user)
):
    """Create predefined tasks for a competition level."""
    supabase = get_supabase_client()
    
    # Verify competition exists
    comp = supabase.table("competitions").select("id").eq("id", competition_id).execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    templates = {
        2: [
            {
                "title": "Financial Model",
                "description": "Build a comprehensive financial model analyzing the case study. Include assumptions, projections, and sensitivity analysis.",
                "task_type": "submission",
                "allowed_file_types": ["xlsx", "xlsm"],
                "max_file_size_mb": 25,
                "max_points": 100,
                "level": 2,
                "order_index": 1
            },
            {
                "title": "Written Case Study Analysis",
                "description": "Provide a detailed written analysis of the case study, including key findings, recommendations, and supporting rationale.",
                "task_type": "submission",
                "allowed_file_types": ["pdf", "docx"],
                "max_file_size_mb": 10,
                "max_points": 100,
                "level": 2,
                "order_index": 2
            }
        ],
        3: [
            {
                "title": "Strategic Decision Report",
                "description": "Present your strategic decisions with full rationale, considering the constraints provided.",
                "task_type": "submission",
                "allowed_file_types": ["pdf", "docx"],
                "max_file_size_mb": 15,
                "max_points": 100,
                "level": 3,
                "order_index": 1,
                "constraints_text": "Teams must work within the defined budget and resource constraints.",
                "assumptions_policy": "Document all assumptions clearly. No external data sources unless specified."
            },
            {
                "title": "Executive Summary",
                "description": "A concise executive summary (max 2 pages) highlighting key decisions and expected outcomes.",
                "task_type": "submission",
                "allowed_file_types": ["pdf", "docx"],
                "max_file_size_mb": 5,
                "max_points": 100,
                "level": 3,
                "order_index": 2
            }
        ],
        4: [
            {
                "title": "Final Video Presentation",
                "description": """Present your complete analysis in a 5-10 minute video covering:
• Case overview and objectives
• Key assumptions and financial logic
• Strategic decisions and alternatives considered
• Risks, opportunities, and conclusions

Evaluation focus: Clarity, depth of analysis, storytelling, executive presence.""",
                "task_type": "submission",
                "allowed_file_types": ["mp4", "mov"],
                "max_file_size_mb": 500,
                "max_points": 100,
                "level": 4,
                "order_index": 1,
                "requirements_text": "Video must be 5-10 minutes. Include all team members. Professional presentation expected."
            }
        ]
    }
    
    if level not in templates:
        raise HTTPException(status_code=400, detail=f"Invalid level: {level}. Must be 2, 3, or 4")
    
    tasks_to_create = []
    for template in templates[level]:
        task = {
            **template,
            "competition_id": competition_id,
            "created_by": current_user.id,
            "is_active": True
        }
        tasks_to_create.append(task)
    
    result = supabase.table("tasks").insert(tasks_to_create).execute()
    
    return {
        "success": True,
        "level": level,
        "tasks_created": len(result.data) if result.data else 0,
        "tasks": result.data
    }


@router.patch("/competitions/{competition_id}/set-level")
async def set_competition_level(
    competition_id: str,
    level_data: dict,
    current_user: User = Depends(get_admin_user)
):
    """Set the current active level for a competition."""
    supabase = get_supabase_client()
    
    level = level_data.get("level", 1)
    if level not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Level must be 1, 2, 3, or 4")
    
    result = supabase.table("competitions")\
        .update({"current_level": level})\
        .eq("id", competition_id)\
        .execute()
    
    return {"success": True, "current_level": level}


@router.patch("/competitions/{competition_id}/leaderboard-mode")
async def set_leaderboard_mode(
    competition_id: str,
    mode_data: dict,
    current_user: User = Depends(get_admin_user)
):
    """Set leaderboard mode: 'level' (per-level) or 'cumulative' (total)."""
    supabase = get_supabase_client()
    
    mode = mode_data.get("mode", "cumulative")
    if mode not in ["level", "cumulative"]:
        raise HTTPException(status_code=400, detail="Mode must be 'level' or 'cumulative'")
    
    result = supabase.table("competitions")\
        .update({"leaderboard_mode": mode})\
        .eq("id", competition_id)\
        .execute()
    
    return {"success": True, "leaderboard_mode": mode}


# ---- JUDGE ASSIGNMENTS ----

@router.get("/competitions/{competition_id}/judges")
async def get_competition_judges(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all judges assigned to a competition."""
    supabase = get_supabase_client()
    
    result = supabase.table("judge_assignments")\
        .select("*, user_profiles(id, full_name, email)")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)\
        .execute()
    
    return result.data or []


@router.post("/competitions/{competition_id}/judges")
async def assign_judge(
    competition_id: str,
    judge_data: dict,
    current_user: User = Depends(get_admin_user)
):
    """Assign a judge to a competition."""
    supabase = get_supabase_client()
    
    judge_id = judge_data.get("judge_id")
    if not judge_id:
        raise HTTPException(status_code=400, detail="judge_id required")
    
    # Verify user exists and has judge role
    user = supabase.table("user_profiles")\
        .select("id, role")\
        .eq("id", judge_id)\
        .execute()
    
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Insert assignment
    result = supabase.table("judge_assignments").upsert({
        "competition_id": competition_id,
        "judge_id": judge_id,
        "is_active": True
    }).execute()
    
    return {"success": True, "assignment": result.data[0] if result.data else None}


@router.delete("/competitions/{competition_id}/judges/{judge_id}")
async def remove_judge(
    competition_id: str,
    judge_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Remove a judge from a competition."""
    supabase = get_supabase_client()
    
    supabase.table("judge_assignments")\
        .update({"is_active": False})\
        .eq("competition_id", competition_id)\
        .eq("judge_id", judge_id)\
        .execute()
    
    return {"success": True}


# ---- CRITERIA-BASED SCORING ----

@router.get("/submissions/{submission_id}/criteria-scores")
async def get_submission_criteria_scores(
    submission_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Get all criteria scores for a submission from all judges."""
    supabase = get_supabase_client()
    
    result = supabase.table("score_entries")\
        .select("*, scoring_criteria(name, weight), user_profiles(full_name)")\
        .eq("submission_id", submission_id)\
        .execute()
    
    return result.data or []


@router.post("/submissions/{submission_id}/criteria-score")
async def score_submission_by_criteria(
    submission_id: str,
    scoring_data: dict,
    current_user: User = Depends(get_admin_user)
):
    """
    Judge scores a submission by criteria.
    
    scoring_data: {
        "scores": [
            {"criterion_id": "uuid", "score": 85, "feedback": "optional"},
            ...
        ],
        "overall_feedback": "Great work overall"
    }
    """
    supabase = get_supabase_client()
    
    # Verify submission exists
    submission = supabase.table("submissions")\
        .select("id, task_id")\
        .eq("id", submission_id)\
        .execute()
    
    if not submission.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    scores = scoring_data.get("scores", [])
    overall_feedback = scoring_data.get("overall_feedback", "")
    
    # Upsert each criterion score
    for score_item in scores:
        entry = {
            "submission_id": submission_id,
            "criterion_id": score_item["criterion_id"],
            "judge_id": current_user.id,
            "score": score_item["score"],
            "feedback": score_item.get("feedback", ""),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("score_entries").upsert(
            entry,
            on_conflict="submission_id,criterion_id,judge_id"
        ).execute()
    
    # Calculate weighted total
    weighted_total = 0
    for score_item in scores:
        criterion = supabase.table("scoring_criteria")\
            .select("weight")\
            .eq("id", score_item["criterion_id"])\
            .execute()
        
        if criterion.data:
            weight = criterion.data[0]["weight"]
            weighted_total += (score_item["score"] * weight / 100)
    
    # Upsert to main scores table
    supabase.table("scores").upsert({
        "submission_id": submission_id,
        "judge_id": current_user.id,
        "total_score": weighted_total,
        "overall_feedback": overall_feedback,
        "weighted_total": weighted_total,
        "is_final": False,
        "scored_at": datetime.utcnow().isoformat()
    }, on_conflict="submission_id,judge_id").execute()
    
    return {
        "success": True,
        "weighted_total": round(weighted_total, 2)
    }


@router.post("/submissions/{submission_id}/finalize-score")
async def finalize_submission_score(
    submission_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Mark a judge's score as final."""
    supabase = get_supabase_client()
    
    supabase.table("scores")\
        .update({"is_final": True})\
        .eq("submission_id", submission_id)\
        .eq("judge_id", current_user.id)\
        .execute()
    
    return {"success": True}


# ---- RESULTS CALCULATION ----

@router.post("/competitions/{competition_id}/calculate-results")
async def calculate_competition_results(
    competition_id: str,
    level: int = None,
    current_user: User = Depends(get_admin_user)
):
    """Calculate and store competition results."""
    supabase = get_supabase_client()
    
    # Get all teams
    teams = supabase.table("teams")\
        .select("id, team_name")\
        .eq("competition_id", competition_id)\
        .execute()
    
    if not teams.data:
        return {"message": "No teams found"}
    
    # Get tasks grouped by level
    tasks_query = supabase.table("tasks")\
        .select("id, level")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)
    
    if level:
        tasks_query = tasks_query.eq("level", level)
    
    tasks = tasks_query.execute()
    
    results = []
    
    for team in teams.data:
        team_id = team["id"]
        level_scores = {2: 0, 3: 0, 4: 0}
        
        for task in (tasks.data or []):
            task_level = task.get("level", 1)
            
            # Get submission for this task/team
            submission = supabase.table("submissions")\
                .select("id")\
                .eq("task_id", task["id"])\
                .eq("team_id", team_id)\
                .execute()
            
            if submission.data:
                # Get average finalized score
                scores = supabase.table("scores")\
                    .select("weighted_total")\
                    .eq("submission_id", submission.data[0]["id"])\
                    .eq("is_final", True)\
                    .execute()
                
                if scores.data:
                    avg_score = sum(s["weighted_total"] or 0 for s in scores.data) / len(scores.data)
                    level_scores[task_level] = level_scores.get(task_level, 0) + avg_score
        
        cumulative = sum(level_scores.values())
        
        result_entry = {
            "competition_id": competition_id,
            "team_id": team_id,
            "level": level or 0,  # 0 = cumulative
            "level_2_score": round(level_scores[2], 2),
            "level_3_score": round(level_scores[3], 2),
            "level_4_score": round(level_scores[4], 2),
            "cumulative_score": round(cumulative, 2),
            "total_score": round(level_scores.get(level, cumulative) if level else cumulative, 2),
            "calculated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("competition_results").upsert(
            result_entry,
            on_conflict="competition_id,team_id,level"
        ).execute()
        
        results.append(result_entry)
    
    # Sort and assign ranks
    results.sort(key=lambda x: -x["total_score"])
    
    for i, r in enumerate(results):
        r["rank"] = i + 1
        supabase.table("competition_results")\
            .update({"rank": i + 1})\
            .eq("competition_id", competition_id)\
            .eq("team_id", r["team_id"])\
            .eq("level", r["level"])\
            .execute()
    
    return {"success": True, "results": results}


@router.patch("/competitions/{competition_id}/toggle-comments")
async def toggle_comments_visibility(
    competition_id: str,
    visibility: dict,
    current_user: User = Depends(get_admin_user)
):
    """Toggle whether judge comments are visible after publish."""
    supabase = get_supabase_client()
    
    show = visibility.get("show_comments", False)
    
    supabase.table("competition_results")\
        .update({"show_comments": show})\
        .eq("competition_id", competition_id)\
        .execute()
    
    return {"success": True, "show_comments": show}
