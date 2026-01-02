"""
Phase 5-10: Multi-Level Competition Engine
==========================================
- Phase 5: Task Submissions (Levels 2-4)
- Phase 6: Judge Workflow & Criteria Scoring
- Phase 7: Results & Leaderboards
- Phase 8: Certificates
- Phase 9: Audit Trail
- Phase 10: Operational Excellence

Non-destructive implementation that extends existing system.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Request
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import os
import logging
from pydantic import BaseModel

from supabase_client import get_supabase_client
from dependencies.auth import get_current_user, get_admin_user, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Phase 5-10"])

# ===========================================================
# PYDANTIC MODELS
# ===========================================================

class TaskSubmissionCreate(BaseModel):
    task_id: str
    declared_duration_seconds: Optional[int] = None

class ScoreEntry(BaseModel):
    criterion_id: str
    score: float
    feedback: Optional[str] = ""

class JudgeScoreSubmit(BaseModel):
    scores: List[ScoreEntry]
    overall_feedback: Optional[str] = ""
    is_final: bool = False

class JudgeAssignment(BaseModel):
    judge_id: str
    notes: Optional[str] = ""

class CertificateIssue(BaseModel):
    team_id: Optional[str] = None
    user_id: Optional[str] = None
    certificate_type: str
    rank: Optional[int] = None

# ===========================================================
# AUDIT LOGGING HELPER
# ===========================================================

async def log_audit(
    supabase,
    actor_id: str,
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str = None,
    competition_id: str = None,
    meta: dict = None,
    request: Request = None
):
    """Log action to audit trail."""
    try:
        data = {
            "actor_id": actor_id,
            "actor_role": actor_role,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "competition_id": competition_id,
            "meta": meta or {},
            "ip_address": request.client.host if request else None,
            "user_agent": request.headers.get("user-agent") if request else None
        }
        supabase.table("audit_log").insert(data).execute()
    except Exception as e:
        logger.error(f"Audit log error: {e}")

# ===========================================================
# PHASE 5: TASK SUBMISSIONS (Participant)
# ===========================================================

@router.get("/cfo/competitions/{competition_id}/tasks")
async def get_competition_tasks_with_status(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get all tasks for a competition with submission status for current user's team.
    Returns level, allowed_file_types, deadline, constraints, etc.
    """
    supabase = get_supabase_client()
    
    # Get competition with status
    comp = supabase.table("competitions")\
        .select("id, title, current_level, submissions_locked, level_2_deadline, level_3_deadline, level_4_deadline")\
        .eq("id", competition_id)\
        .execute()
    
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp.data[0]
    
    # Get user's team
    team_result = supabase.table("team_members")\
        .select("team_id, teams(id, competition_id)")\
        .eq("user_id", current_user.id)\
        .execute()
    
    user_team_id = None
    for tm in (team_result.data or []):
        if tm.get("teams", {}).get("competition_id") == competition_id:
            user_team_id = tm["team_id"]
            break
    
    # Get tasks
    tasks = supabase.table("tasks")\
        .select("id, title, description, level, deadline, allowed_file_types, max_file_size_mb, constraints_text, assumptions_policy, requirements_text, order_index, is_active")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)\
        .order("level")\
        .order("order_index")\
        .execute()
    
    # Get user's team submissions
    submissions = {}
    if user_team_id:
        sub_result = supabase.table("task_submissions")\
            .select("id, task_id, file_name, submitted_at, status")\
            .eq("team_id", user_team_id)\
            .execute()
        for s in (sub_result.data or []):
            submissions[s["task_id"]] = s
    
    # Enrich tasks with status
    result = []
    for task in (tasks.data or []):
        task_level = task.get("level", 1)
        submission = submissions.get(task["id"])
        
        # Determine submission status
        if submission:
            status = "submitted"
            if submission.get("status") == "locked":
                status = "locked"
        elif competition.get("submissions_locked"):
            status = "locked"
        elif task_level > competition.get("current_level", 1):
            status = "level_not_active"
        else:
            # Check deadline
            deadline = task.get("deadline")
            level_deadline_key = f"level_{task_level}_deadline"
            level_deadline = competition.get(level_deadline_key)
            
            effective_deadline = deadline or level_deadline
            if effective_deadline and datetime.fromisoformat(str(effective_deadline).replace("Z", "+00:00")) < datetime.now(timezone.utc):
                status = "past_deadline"
            else:
                status = "open"
        
        result.append({
            **task,
            "submission_status": status,
            "submission": submission,
            "can_submit": status == "open"
        })
    
    return {
        "competition": {
            "id": competition["id"],
            "title": competition["title"],
            "current_level": competition.get("current_level", 1),
            "submissions_locked": competition.get("submissions_locked", False)
        },
        "tasks": result
    }


@router.get("/cfo/tasks/{task_id}/my-submission")
async def get_my_task_submission(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current user's team submission for a specific task."""
    supabase = get_supabase_client()
    
    # Get task
    task = supabase.table("tasks")\
        .select("id, competition_id, title, level")\
        .eq("id", task_id)\
        .execute()
    
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    competition_id = task.data[0]["competition_id"]
    
    # Get user's team for this competition
    team_result = supabase.table("team_members")\
        .select("team_id, teams(id, competition_id)")\
        .eq("user_id", current_user.id)\
        .execute()
    
    user_team_id = None
    for tm in (team_result.data or []):
        if tm.get("teams", {}).get("competition_id") == competition_id:
            user_team_id = tm["team_id"]
            break
    
    if not user_team_id:
        raise HTTPException(status_code=403, detail="You are not part of a team in this competition")
    
    # Get submission
    submission = supabase.table("task_submissions")\
        .select("*")\
        .eq("task_id", task_id)\
        .eq("team_id", user_team_id)\
        .execute()
    
    return submission.data[0] if submission.data else None


@router.post("/cfo/tasks/{task_id}/submit")
async def submit_task_file(
    task_id: str,
    request: Request,
    file: UploadFile = File(...),
    declared_duration_seconds: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a file for a specific task (Levels 2-4).
    Validates: file type, size, deadline, lock status.
    """
    from supabase import create_client
    
    supabase = get_supabase_client()
    
    # Get task details
    task = supabase.table("tasks")\
        .select("id, competition_id, title, level, deadline, allowed_file_types, max_file_size_mb, is_active")\
        .eq("id", task_id)\
        .execute()
    
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = task.data[0]
    competition_id = task_data["competition_id"]
    task_level = task_data.get("level", 1)
    
    if not task_data.get("is_active", True):
        raise HTTPException(status_code=400, detail="Task is not active")
    
    # Get competition
    comp = supabase.table("competitions")\
        .select("id, current_level, submissions_locked, level_2_deadline, level_3_deadline, level_4_deadline")\
        .eq("id", competition_id)\
        .execute()
    
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp.data[0]
    
    # CHECK 1: Submissions locked
    if competition.get("submissions_locked"):
        raise HTTPException(status_code=403, detail="Competition submissions are locked")
    
    # CHECK 2: Level not yet active
    if task_level > competition.get("current_level", 1):
        raise HTTPException(status_code=403, detail=f"Level {task_level} is not yet active")
    
    # CHECK 3: Deadline
    task_deadline = task_data.get("deadline")
    level_deadline = competition.get(f"level_{task_level}_deadline")
    effective_deadline = task_deadline or level_deadline
    
    if effective_deadline:
        deadline_dt = datetime.fromisoformat(str(effective_deadline).replace("Z", "+00:00"))
        if deadline_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Task deadline has passed")
    
    # Get user's team
    team_result = supabase.table("team_members")\
        .select("team_id, teams(id, team_name, competition_id)")\
        .eq("user_id", current_user.id)\
        .execute()
    
    user_team_id = None
    team_name = "Unknown"
    for tm in (team_result.data or []):
        if tm.get("teams", {}).get("competition_id") == competition_id:
            user_team_id = tm["team_id"]
            team_name = tm.get("teams", {}).get("team_name", "Unknown")
            break
    
    if not user_team_id:
        raise HTTPException(status_code=403, detail="You are not part of a team in this competition")
    
    # CHECK 4: Existing submission
    existing = supabase.table("task_submissions")\
        .select("id, status")\
        .eq("task_id", task_id)\
        .eq("team_id", user_team_id)\
        .execute()
    
    if existing.data and existing.data[0].get("status") == "locked":
        raise HTTPException(status_code=403, detail="Your submission is locked and cannot be modified")
    
    # CHECK 5: File type validation
    allowed_types = task_data.get("allowed_file_types", ["pdf", "xlsx", "docx"])
    file_ext = os.path.splitext(file.filename or "")[1].lower().lstrip(".")
    
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")
    
    # Read file
    contents = await file.read()
    file_size = len(contents)
    
    # CHECK 6: File size
    max_size_bytes = (task_data.get("max_file_size_mb") or 50) * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(status_code=413, detail=f"File size exceeds {task_data.get('max_file_size_mb', 50)}MB limit")
    
    # Calculate file hash for anti-cheat
    file_hash = hashlib.sha256(contents).hexdigest()
    
    # Upload to storage
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Storage configuration error")
    
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    safe_filename = file.filename.replace(" ", "_")
    file_path = f"task_submissions/{competition_id}/{task_id}/{user_team_id}/{safe_filename}"
    
    try:
        # Remove existing file if replacing
        if existing.data:
            try:
                supabase_admin.storage.from_("Team-submissions").remove([file_path])
            except Exception:
                pass
        
        # Upload
        supabase_admin.storage.from_("Team-submissions").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": "application/octet-stream", "upsert": "true"}
        )
        
        # Create signed URL
        signed_url = supabase_admin.storage.from_("Team-submissions").create_signed_url(file_path, 3600 * 24 * 30)
        file_url = signed_url.get("signedURL") or signed_url.get("signedUrl") if isinstance(signed_url, dict) else None
        
        # Prepare submission data
        submission_data = {
            "competition_id": competition_id,
            "team_id": user_team_id,
            "task_id": task_id,
            "level": task_level,
            "file_name": file.filename,
            "file_path": file_path,
            "file_url": file_url or file_path,
            "file_size": file_size,
            "file_hash": file_hash,
            "submitted_by": current_user.id,
            "submitted_by_name": current_user.full_name or current_user.email,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "status": "submitted",
            "declared_duration_seconds": declared_duration_seconds
        }
        
        # Insert or update
        if existing.data:
            result = supabase.table("task_submissions")\
                .update(submission_data)\
                .eq("id", existing.data[0]["id"])\
                .execute()
            action = "submission_updated"
        else:
            result = supabase.table("task_submissions")\
                .insert(submission_data)\
                .execute()
            action = "submission_created"
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save submission")
        
        # Audit log
        await log_audit(
            supabase,
            current_user.id,
            "participant",
            action,
            "task_submission",
            result.data[0]["id"],
            competition_id,
            {"task_id": task_id, "task_title": task_data["title"], "team_name": team_name, "file_hash": file_hash},
            request
        )
        
        logger.info(f"Task submission: team={user_team_id} task={task_id} action={action}")
        
        return {
            "success": True,
            "submission": result.data[0],
            "message": "File submitted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Task submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit file")


# ===========================================================
# PHASE 5: ADMIN TASK SUBMISSION MANAGEMENT
# ===========================================================

@router.get("/admin/competitions/{competition_id}/task-submissions")
async def get_competition_task_submissions(
    competition_id: str,
    level: Optional[int] = Query(None),
    task_id: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get all task submissions for a competition, optionally filtered by level or task."""
    supabase = get_supabase_client()
    
    query = supabase.table("task_submissions")\
        .select("*, teams(team_name)")\
        .eq("competition_id", competition_id)\
        .order("submitted_at", desc=True)
    
    if level:
        query = query.eq("level", level)
    if task_id:
        query = query.eq("task_id", task_id)
    
    result = query.execute()
    
    return result.data or []


@router.get("/admin/tasks/{task_id}/submissions")
async def get_task_submissions(
    task_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get all submissions for a specific task."""
    supabase = get_supabase_client()
    
    result = supabase.table("task_submissions")\
        .select("*, teams(team_name), task_submission_scores(weighted_total, judge_id, is_final)")\
        .eq("task_id", task_id)\
        .order("submitted_at")\
        .execute()
    
    return result.data or []


@router.post("/admin/task-submissions/{submission_id}/lock")
async def lock_task_submission(
    submission_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Lock a submission to prevent modifications."""
    supabase = get_supabase_client()
    
    result = supabase.table("task_submissions")\
        .update({
            "status": "locked",
            "is_locked": True,
            "locked_at": datetime.now(timezone.utc).isoformat()
        })\
        .eq("id", submission_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await log_audit(
        supabase, current_user.id, "admin", "submission_locked",
        "task_submission", submission_id,
        result.data[0].get("competition_id"),
        request=request
    )
    
    return {"success": True, "message": "Submission locked"}


# ===========================================================
# PHASE 6: JUDGE WORKFLOW
# ===========================================================

@router.post("/admin/competitions/{competition_id}/judges")
async def assign_judge(
    competition_id: str,
    assignment: JudgeAssignment,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Assign a judge to a competition."""
    supabase = get_supabase_client()
    
    # Verify judge exists and has judge role
    judge = supabase.table("user_profiles")\
        .select("id, role, full_name")\
        .eq("id", assignment.judge_id)\
        .execute()
    
    if not judge.data:
        raise HTTPException(status_code=404, detail="Judge user not found")
    
    # Insert assignment
    try:
        result = supabase.table("judge_assignments").upsert({
            "competition_id": competition_id,
            "judge_id": assignment.judge_id,
            "assigned_by": current_user.id,
            "notes": assignment.notes,
            "is_active": True,
            "assigned_at": datetime.now(timezone.utc).isoformat()
        }, on_conflict="competition_id,judge_id").execute()
        
        await log_audit(
            supabase, current_user.id, "admin", "judge_assigned",
            "judge_assignment", result.data[0]["id"] if result.data else None,
            competition_id,
            {"judge_id": assignment.judge_id, "judge_name": judge.data[0].get("full_name")},
            request
        )
        
        return {"success": True, "assignment": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Judge assignment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign judge")


@router.get("/admin/competitions/{competition_id}/judges")
async def get_competition_judges(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get all judges assigned to a competition."""
    supabase = get_supabase_client()
    
    result = supabase.table("judge_assignments")\
        .select("*, user_profiles(id, full_name, email)")\
        .eq("competition_id", competition_id)\
        .eq("is_active", True)\
        .execute()
    
    return result.data or []


@router.delete("/admin/competitions/{competition_id}/judges/{judge_id}")
async def remove_judge(
    competition_id: str,
    judge_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Remove a judge from a competition."""
    supabase = get_supabase_client()
    
    supabase.table("judge_assignments")\
        .update({"is_active": False})\
        .eq("competition_id", competition_id)\
        .eq("judge_id", judge_id)\
        .execute()
    
    await log_audit(
        supabase, current_user.id, "admin", "judge_removed",
        "judge_assignment", None, competition_id,
        {"judge_id": judge_id},
        request
    )
    
    return {"success": True}


@router.get("/judge/competitions")
async def get_judge_competitions(
    current_user: User = Depends(get_current_user)
):
    """Judge: Get competitions assigned to current judge."""
    supabase = get_supabase_client()
    
    result = supabase.table("judge_assignments")\
        .select("competition_id, competitions(id, title, current_level, status)")\
        .eq("judge_id", current_user.id)\
        .eq("is_active", True)\
        .execute()
    
    competitions = []
    for r in (result.data or []):
        if r.get("competitions"):
            competitions.append(r["competitions"])
    
    return competitions


@router.get("/judge/competitions/{competition_id}/submissions")
async def get_judge_submissions(
    competition_id: str,
    level: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Judge: Get submissions to review for an assigned competition."""
    supabase = get_supabase_client()
    
    # Verify judge assignment
    assignment = supabase.table("judge_assignments")\
        .select("id")\
        .eq("competition_id", competition_id)\
        .eq("judge_id", current_user.id)\
        .eq("is_active", True)\
        .execute()
    
    if not assignment.data:
        raise HTTPException(status_code=403, detail="You are not assigned as judge for this competition")
    
    # Get submissions
    query = supabase.table("task_submissions")\
        .select("*, teams(team_name), tasks(title, level)")\
        .eq("competition_id", competition_id)
    
    if level:
        query = query.eq("level", level)
    
    submissions = query.order("submitted_at").execute()
    
    # Get judge's existing scores
    my_scores = supabase.table("task_submission_scores")\
        .select("task_submission_id, weighted_total, is_final")\
        .eq("judge_id", current_user.id)\
        .execute()
    
    scores_map = {s["task_submission_id"]: s for s in (my_scores.data or [])}
    
    # Enrich submissions with score status
    result = []
    for sub in (submissions.data or []):
        my_score = scores_map.get(sub["id"])
        result.append({
            **sub,
            "team_name": sub.get("teams", {}).get("team_name"),
            "task_title": sub.get("tasks", {}).get("title"),
            "my_score_status": "final" if my_score and my_score.get("is_final") else ("draft" if my_score else "pending"),
            "my_weighted_total": my_score.get("weighted_total") if my_score else None
        })
    
    return result


@router.get("/judge/competitions/{competition_id}/criteria")
async def get_judge_criteria(
    competition_id: str,
    level: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Judge: Get scoring criteria for a competition level."""
    supabase = get_supabase_client()
    
    # Get competition current level if not specified
    if not level:
        comp = supabase.table("competitions")\
            .select("current_level")\
            .eq("id", competition_id)\
            .execute()
        level = comp.data[0].get("current_level", 2) if comp.data else 2
    
    # Get criteria that apply to this level
    criteria = supabase.table("scoring_criteria")\
        .select("*")\
        .eq("is_active", True)\
        .order("display_order")\
        .execute()
    
    applicable = [c for c in (criteria.data or []) if level in c.get("applies_to_levels", [])]
    
    return applicable


@router.get("/judge/task-submissions/{submission_id}/my-scores")
async def get_my_submission_scores(
    submission_id: str,
    current_user: User = Depends(get_current_user)
):
    """Judge: Get my scores for a specific submission."""
    supabase = get_supabase_client()
    
    # Get criteria scores
    criteria_scores = supabase.table("task_score_entries")\
        .select("criterion_id, score, feedback")\
        .eq("task_submission_id", submission_id)\
        .eq("judge_id", current_user.id)\
        .execute()
    
    # Get overall score
    overall = supabase.table("task_submission_scores")\
        .select("overall_feedback, weighted_total, is_final")\
        .eq("task_submission_id", submission_id)\
        .eq("judge_id", current_user.id)\
        .execute()
    
    return {
        "criteria_scores": criteria_scores.data or [],
        "overall_feedback": overall.data[0].get("overall_feedback") if overall.data else "",
        "weighted_total": overall.data[0].get("weighted_total") if overall.data else None,
        "is_final": overall.data[0].get("is_final") if overall.data else False
    }


@router.post("/judge/task-submissions/{submission_id}/score")
async def submit_judge_score(
    submission_id: str,
    score_data: JudgeScoreSubmit,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Judge: Submit scores for a task submission.
    Validates: judge assignment, criteria applicability, score range.
    """
    supabase = get_supabase_client()
    
    # Get submission
    submission = supabase.table("task_submissions")\
        .select("id, competition_id, level, team_id, task_id")\
        .eq("id", submission_id)\
        .execute()
    
    if not submission.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    sub_data = submission.data[0]
    competition_id = sub_data["competition_id"]
    level = sub_data["level"]
    
    # Verify judge assignment
    assignment = supabase.table("judge_assignments")\
        .select("id")\
        .eq("competition_id", competition_id)\
        .eq("judge_id", current_user.id)\
        .eq("is_active", True)\
        .execute()
    
    if not assignment.data:
        raise HTTPException(status_code=403, detail="You are not assigned as judge for this competition")
    
    # Get applicable criteria
    criteria = supabase.table("scoring_criteria")\
        .select("id, weight, applies_to_levels")\
        .eq("is_active", True)\
        .execute()
    
    criteria_map = {c["id"]: c for c in (criteria.data or [])}
    
    # Validate and save scores
    weighted_total = 0
    for entry in score_data.scores:
        criterion = criteria_map.get(entry.criterion_id)
        
        if not criterion:
            raise HTTPException(status_code=400, detail=f"Invalid criterion: {entry.criterion_id}")
        
        if level not in criterion.get("applies_to_levels", []):
            continue  # Skip criteria that don't apply to this level
        
        if entry.score < 0 or entry.score > 100:
            raise HTTPException(status_code=400, detail="Score must be between 0-100")
        
        # Calculate weighted contribution
        weighted_total += entry.score * (criterion["weight"] / 100)
        
        # Upsert score entry
        supabase.table("task_score_entries").upsert({
            "task_submission_id": submission_id,
            "criterion_id": entry.criterion_id,
            "judge_id": current_user.id,
            "score": entry.score,
            "feedback": entry.feedback or ""
        }, on_conflict="task_submission_id,criterion_id,judge_id").execute()
    
    # Upsert overall score
    supabase.table("task_submission_scores").upsert({
        "task_submission_id": submission_id,
        "judge_id": current_user.id,
        "weighted_total": round(weighted_total, 2),
        "overall_feedback": score_data.overall_feedback,
        "is_final": score_data.is_final,
        "scored_at": datetime.now(timezone.utc).isoformat()
    }, on_conflict="task_submission_id,judge_id").execute()
    
    # Audit log
    await log_audit(
        supabase, current_user.id, "judge",
        "submission_scored" if score_data.is_final else "score_draft_saved",
        "task_submission", submission_id, competition_id,
        {"weighted_total": round(weighted_total, 2), "is_final": score_data.is_final},
        request
    )
    
    logger.info(f"Judge {current_user.id} scored submission {submission_id}: {round(weighted_total, 2)}")
    
    return {
        "success": True,
        "weighted_total": round(weighted_total, 2),
        "is_final": score_data.is_final
    }


# ===========================================================
# PHASE 7: LEADERBOARDS & RESULTS
# ===========================================================

@router.get("/cfo/competitions/{competition_id}/leaderboard")
async def get_competition_leaderboard(
    competition_id: str,
    level: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Get competition leaderboard.
    Only returns data if results_published=true OR user is admin.
    """
    supabase = get_supabase_client()
    
    # Check if results are published
    comp = supabase.table("competitions")\
        .select("id, results_published, leaderboard_mode, show_judge_comments")\
        .eq("id", competition_id)\
        .execute()
    
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp.data[0]
    
    # Check access
    if not competition.get("results_published") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Results are not yet published")
    
    # Check for snapshot first
    snapshot = supabase.table("leaderboard_snapshots")\
        .select("*")\
        .eq("competition_id", competition_id)\
        .order("final_rank")\
        .execute()
    
    if snapshot.data:
        return {
            "competition_id": competition_id,
            "leaderboard_mode": competition.get("leaderboard_mode", "cumulative"),
            "show_comments": competition.get("show_judge_comments", False),
            "rankings": snapshot.data
        }
    
    # Calculate live leaderboard
    return await calculate_leaderboard(competition_id, level)


async def calculate_leaderboard(competition_id: str, level: Optional[int] = None):
    """Calculate live leaderboard from scores."""
    supabase = get_supabase_client()
    
    # Get all teams
    teams = supabase.table("teams")\
        .select("id, team_name")\
        .eq("competition_id", competition_id)\
        .execute()
    
    team_scores = {}
    for team in (teams.data or []):
        team_scores[team["id"]] = {
            "team_id": team["id"],
            "team_name": team["team_name"],
            "level_2_score": 0,
            "level_3_score": 0,
            "level_4_score": 0,
            "cumulative_score": 0,
            "last_submission_at": None
        }
    
    # Get all final scores
    scores = supabase.table("task_submission_scores")\
        .select("task_submission_id, weighted_total, task_submissions(team_id, level, submitted_at)")\
        .eq("is_final", True)\
        .execute()
    
    for score in (scores.data or []):
        sub = score.get("task_submissions", {})
        team_id = sub.get("team_id")
        lvl = sub.get("level")
        
        if team_id in team_scores and lvl:
            level_key = f"level_{lvl}_score"
            if level_key in team_scores[team_id]:
                team_scores[team_id][level_key] += score.get("weighted_total", 0)
            
            # Track last submission
            submitted_at = sub.get("submitted_at")
            if submitted_at:
                current = team_scores[team_id]["last_submission_at"]
                if not current or submitted_at > current:
                    team_scores[team_id]["last_submission_at"] = submitted_at
    
    # Calculate cumulative
    for team_id in team_scores:
        team_scores[team_id]["cumulative_score"] = (
            team_scores[team_id]["level_2_score"] +
            team_scores[team_id]["level_3_score"] +
            team_scores[team_id]["level_4_score"]
        )
    
    # Sort by cumulative score (desc), then by submission time (asc for tiebreak)
    rankings = sorted(
        team_scores.values(),
        key=lambda x: (-x["cumulative_score"], x["last_submission_at"] or "9999")
    )
    
    # Add ranks
    for i, entry in enumerate(rankings):
        entry["rank"] = i + 1
    
    return {
        "competition_id": competition_id,
        "rankings": rankings
    }


@router.post("/admin/competitions/{competition_id}/publish-results")
async def publish_competition_results(
    competition_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Publish competition results and create leaderboard snapshot."""
    supabase = get_supabase_client()
    
    # Calculate final leaderboard
    leaderboard = await calculate_leaderboard(competition_id)
    
    # Create snapshot
    for entry in leaderboard["rankings"]:
        supabase.table("leaderboard_snapshots").upsert({
            "competition_id": competition_id,
            "team_id": entry["team_id"],
            "team_name": entry["team_name"],
            "final_rank": entry["rank"],
            "level_2_score": entry["level_2_score"],
            "level_3_score": entry["level_3_score"],
            "level_4_score": entry["level_4_score"],
            "cumulative_score": entry["cumulative_score"],
            "last_submission_at": entry["last_submission_at"]
        }, on_conflict="competition_id,team_id").execute()
    
    # Update competition
    supabase.table("competitions")\
        .update({"results_published": True})\
        .eq("id", competition_id)\
        .execute()
    
    await log_audit(
        supabase, current_user.id, "admin", "results_published",
        "competition", competition_id, competition_id,
        {"team_count": len(leaderboard["rankings"])},
        request
    )
    
    return {"success": True, "rankings": leaderboard["rankings"]}


@router.get("/admin/competitions/{competition_id}/export-results")
async def export_competition_results(
    competition_id: str,
    format: str = Query("csv", enum=["csv", "json"]),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Export competition results."""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    supabase = get_supabase_client()
    
    # Get leaderboard
    leaderboard = await calculate_leaderboard(competition_id)
    
    if format == "json":
        return leaderboard
    
    # CSV export
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Team Name", "Level 2 Score", "Level 3 Score", "Level 4 Score", "Cumulative Score", "Last Submission"])
    
    for entry in leaderboard["rankings"]:
        writer.writerow([
            entry["rank"],
            entry["team_name"],
            entry["level_2_score"],
            entry["level_3_score"],
            entry["level_4_score"],
            entry["cumulative_score"],
            entry["last_submission_at"]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=results_{competition_id}.csv"}
    )


# ===========================================================
# PHASE 8: CERTIFICATES
# ===========================================================

@router.post("/admin/competitions/{competition_id}/issue-certificates")
async def issue_certificates(
    competition_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Issue certificates based on leaderboard rankings."""
    supabase = get_supabase_client()
    
    # Get leaderboard snapshot
    snapshot = supabase.table("leaderboard_snapshots")\
        .select("*")\
        .eq("competition_id", competition_id)\
        .order("final_rank")\
        .execute()
    
    if not snapshot.data:
        raise HTTPException(status_code=400, detail="Publish results first")
    
    issued = []
    for entry in snapshot.data:
        rank = entry["final_rank"]
        
        # Determine certificate type
        if rank == 1:
            cert_type = "winner"
        elif rank == 2:
            cert_type = "runner_up"
        elif rank <= 5:
            cert_type = "finalist"
        elif rank <= 10:
            cert_type = "honorable_mention"
        else:
            cert_type = "participation"
        
        # Get team members
        members = supabase.table("team_members")\
            .select("user_id")\
            .eq("team_id", entry["team_id"])\
            .execute()
        
        for member in (members.data or []):
            try:
                supabase.table("certificates").upsert({
                    "competition_id": competition_id,
                    "user_id": member["user_id"],
                    "team_id": entry["team_id"],
                    "certificate_type": cert_type,
                    "rank": rank,
                    "issued_by": current_user.id,
                    "certificate_data": {
                        "team_name": entry["team_name"],
                        "cumulative_score": entry["cumulative_score"]
                    }
                }, on_conflict="competition_id,user_id,certificate_type").execute()
                issued.append(member["user_id"])
            except Exception as e:
                logger.error(f"Certificate issue error: {e}")
    
    await log_audit(
        supabase, current_user.id, "admin", "certificates_issued",
        "competition", competition_id, competition_id,
        {"count": len(issued)},
        request
    )
    
    return {"success": True, "issued_count": len(issued)}


@router.get("/cfo/me/certificates")
async def get_my_certificates(
    current_user: User = Depends(get_current_user)
):
    """Get current user's certificates."""
    supabase = get_supabase_client()
    
    result = supabase.table("certificates")\
        .select("*, competitions(title)")\
        .eq("user_id", current_user.id)\
        .order("issued_at", desc=True)\
        .execute()
    
    return result.data or []


# ===========================================================
# PHASE 9: ANTI-CHEAT / INTEGRITY
# ===========================================================

@router.get("/admin/tasks/{task_id}/integrity-report")
async def get_task_integrity_report(
    task_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get integrity report for a task (detect duplicate file hashes)."""
    supabase = get_supabase_client()
    
    # Get all submissions for this task with hashes
    submissions = supabase.table("task_submissions")\
        .select("id, team_id, file_hash, file_name, submitted_at, teams(team_name)")\
        .eq("task_id", task_id)\
        .execute()
    
    if not submissions.data:
        return {"task_id": task_id, "submission_count": 0, "duplicates": []}
    
    # Find duplicate hashes
    hash_groups = {}
    for sub in submissions.data:
        file_hash = sub.get("file_hash")
        if file_hash:
            if file_hash not in hash_groups:
                hash_groups[file_hash] = []
            hash_groups[file_hash].append({
                "submission_id": sub["id"],
                "team_id": sub["team_id"],
                "team_name": sub.get("teams", {}).get("team_name"),
                "file_name": sub["file_name"],
                "submitted_at": sub["submitted_at"]
            })
    
    # Filter to only duplicates
    duplicates = [
        {"file_hash": h, "submissions": subs}
        for h, subs in hash_groups.items()
        if len(subs) > 1
    ]
    
    return {
        "task_id": task_id,
        "submission_count": len(submissions.data),
        "duplicate_count": sum(len(d["submissions"]) for d in duplicates),
        "duplicates": duplicates
    }


# ===========================================================
# PHASE 10: OPERATIONAL / HEALTH
# ===========================================================

@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    supabase = get_supabase_client()
    
    try:
        # Simple DB check
        result = supabase.table("competitions").select("id").limit(1).execute()
        db_ok = True
    except Exception:
        db_ok = False
    
    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected" if db_ok else "error"
    }


@router.get("/admin/audit-log")
async def get_audit_log(
    competition_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get audit log entries."""
    supabase = get_supabase_client()
    
    query = supabase.table("audit_log")\
        .select("*")\
        .order("created_at", desc=True)\
        .limit(limit)
    
    if competition_id:
        query = query.eq("competition_id", competition_id)
    if entity_type:
        query = query.eq("entity_type", entity_type)
    
    result = query.execute()
    
    return result.data or []


# ===========================================================
# COMPETITION STATUS ENHANCED
# ===========================================================

@router.get("/cfo/competitions/{competition_id}/status")
async def get_competition_status_enhanced(
    competition_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Enhanced competition status with explicit flags.
    Includes: registration_open, submissions_open, deadline info, level info.
    """
    supabase = get_supabase_client()
    
    comp = supabase.table("competitions")\
        .select("*")\
        .eq("id", competition_id)\
        .execute()
    
    if not comp.data:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    competition = comp.data[0]
    now = datetime.now(timezone.utc)
    
    # Parse dates
    def parse_date(d):
        if not d:
            return None
        return datetime.fromisoformat(str(d).replace("Z", "+00:00"))
    
    reg_start = parse_date(competition.get("registration_start"))
    reg_end = parse_date(competition.get("registration_end"))
    sub_start = parse_date(competition.get("submission_start"))
    sub_end = parse_date(competition.get("submission_end"))
    l2_deadline = parse_date(competition.get("level_2_deadline"))
    l3_deadline = parse_date(competition.get("level_3_deadline"))
    l4_deadline = parse_date(competition.get("level_4_deadline"))
    
    # Calculate status flags
    registration_open = (
        not competition.get("registration_locked", False) and
        (not reg_start or reg_start <= now) and
        (not reg_end or reg_end > now)
    )
    
    submissions_open = (
        not competition.get("submissions_locked", False) and
        (not sub_start or sub_start <= now) and
        (not sub_end or sub_end > now)
    )
    
    current_level = competition.get("current_level", 1)
    
    return {
        "competition_id": competition_id,
        "title": competition.get("title"),
        "status": competition.get("status"),
        "current_level": current_level,
        
        # Explicit flags
        "registration_open": registration_open,
        "registration_locked": competition.get("registration_locked", False),
        "submissions_open": submissions_open,
        "submissions_locked": competition.get("submissions_locked", False),
        "results_published": competition.get("results_published", False),
        
        # Deadlines
        "registration_deadline": str(reg_end) if reg_end else None,
        "level_2_deadline": str(l2_deadline) if l2_deadline else None,
        "level_3_deadline": str(l3_deadline) if l3_deadline else None,
        "level_4_deadline": str(l4_deadline) if l4_deadline else None,
        
        # Level status
        "level_2_open": current_level >= 2 and submissions_open and (not l2_deadline or l2_deadline > now),
        "level_3_open": current_level >= 3 and submissions_open and (not l3_deadline or l3_deadline > now),
        "level_4_open": current_level >= 4 and submissions_open and (not l4_deadline or l4_deadline > now),
        
        # Leaderboard mode
        "leaderboard_mode": competition.get("leaderboard_mode", "cumulative"),
        "show_judge_comments": competition.get("show_judge_comments", False)
    }
