"""
ModEX CFO Competition Platform
==============================
PHASES 5-10: STRATEGIC ENHANCEMENT SUITE

Phase 5: Team Governance & Realism
Phase 6: Admin Governance & Observer Mode
Phase 7: Multi-Task & Multi-Level (Extended)
Phase 8: Judging, Scoring & Fairness (Enhanced)
Phase 9: Talent Marketplace (FIFA-Style)
Phase 10: Sponsors, Gamification & Scale

This module extends the existing platform with enterprise-grade features.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import logging

from supabase_client import get_supabase_client
from dependencies.auth import get_current_user, get_admin_user, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Strategic Suite (Phase 5-10)"])


# ===========================================================
# PYDANTIC MODELS
# ===========================================================

class JoinRequestCreate(BaseModel):
    team_id: str
    message: Optional[str] = ""

class JoinRequestReview(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    review_notes: Optional[str] = ""

class TalentProfileUpdate(BaseModel):
    is_public: Optional[bool] = None
    is_open_to_offers: Optional[bool] = None
    preferred_roles: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    remote_preference: Optional[str] = None

class TalentOfferCreate(BaseModel):
    talent_id: str
    offer_type: str = "job"
    role_title: str
    role_description: Optional[str] = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    location: Optional[str] = None
    remote_option: bool = True
    contract_duration_months: Optional[int] = None
    start_date: Optional[str] = None
    benefits: Optional[Dict] = {}

class TalentOfferResponse(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected|negotiating)$")
    response_message: Optional[str] = ""
    counter_offer: Optional[Dict] = None

class CompanyProfileCreate(BaseModel):
    company_name: str
    company_type: Optional[str] = "corporation"
    industry: Optional[str] = None
    company_size: Optional[str] = None
    headquarters_location: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None

class SponsorChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    challenge_type: str = "case_study"
    reward_type: str = "badge"
    reward_value: int = 0
    reward_description: Optional[str] = ""
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    case_data: Optional[Dict] = {}


# ===========================================================
# HELPER FUNCTIONS
# ===========================================================

async def log_admin_view(
    supabase,
    admin_id: str,
    view_type: str,
    entity_type: str = None,
    entity_id: str = None,
    competition_id: str = None,
    meta: dict = None
):
    """Log admin observation for audit compliance."""
    try:
        supabase.table("admin_view_log").insert({
            "admin_id": admin_id,
            "view_type": view_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "competition_id": competition_id,
            "meta": meta or {}
        }).execute()
    except Exception as e:
        logger.error(f"Admin view log error: {e}")


async def log_team_activity(
    supabase,
    team_id: str,
    competition_id: str,
    actor_id: str,
    actor_name: str,
    event_type: str,
    event_data: dict = None
):
    """Log team activity for timeline."""
    try:
        supabase.table("team_activity_log").insert({
            "team_id": team_id,
            "competition_id": competition_id,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "event_type": event_type,
            "event_data": event_data or {}
        }).execute()
    except Exception as e:
        logger.error(f"Team activity log error: {e}")


def get_current_season() -> str:
    """Get current season code."""
    now = datetime.now()
    quarter = (now.month - 1) // 3 + 1
    return f"{now.year}-S{quarter}"


# ===========================================================
# PHASE 5: TEAM GOVERNANCE & REALISM
# ===========================================================

@router.post("/cfo/teams/{team_id}/join-request")
async def create_join_request(
    team_id: str,
    request_data: JoinRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Request to join a team (if team requires approval).
    Creates pending request for team leader to review.
    """
    supabase = get_supabase_client()
    
    # Check team exists and requires approval
    team = supabase.table("teams")\
        .select("id, team_name, competition_id, requires_approval, max_members")\
        .eq("id", team_id)\
        .execute()
    
    if not team.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_data = team.data[0]
    
    # Check if already a member
    existing = supabase.table("team_members")\
        .select("id")\
        .eq("team_id", team_id)\
        .eq("user_id", current_user.id)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="You are already a member of this team")
    
    # Check pending request
    pending = supabase.table("team_join_requests")\
        .select("id")\
        .eq("team_id", team_id)\
        .eq("user_id", current_user.id)\
        .eq("status", "pending")\
        .execute()
    
    if pending.data:
        raise HTTPException(status_code=400, detail="You already have a pending request")
    
    # Create request
    result = supabase.table("team_join_requests").insert({
        "team_id": team_id,
        "user_id": current_user.id,
        "message": request_data.message,
        "status": "pending"
    }).execute()
    
    # Log activity
    await log_team_activity(
        supabase, team_id, team_data["competition_id"],
        current_user.id, current_user.full_name or current_user.email,
        "member_joined",  # This will be updated when approved
        {"status": "pending", "message": request_data.message}
    )
    
    return {"success": True, "request": result.data[0] if result.data else None}


@router.get("/cfo/teams/{team_id}/join-status")
async def get_user_join_status(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check current user's join status for a specific team.
    
    Returns one of:
    - { "status": "none" } - No request, not a member
    - { "status": "pending" } - Request pending approval
    - { "status": "approved" } - Approved, is a member
    - { "status": "rejected" } - Request was rejected
    - { "status": "member" } - Already a team member
    
    This is the SINGLE SOURCE OF TRUTH for join status.
    Frontend must use this to determine button state.
    """
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    try:
        # First check if user is already a team member
        membership = supabase.table("team_members")\
            .select("id, role")\
            .eq("team_id", team_id)\
            .eq("user_id", current_user.id)\
            .execute()
        
        if membership.data:
            return {"status": "member", "role": membership.data[0].get("role")}
        
        # Check for existing join request
        request = supabase.table("team_join_requests")\
            .select("id, status, created_at")\
            .eq("team_id", team_id)\
            .eq("user_id", current_user.id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if request.data:
            req = request.data[0]
            return {
                "status": req["status"],
                "request_id": req["id"],
                "created_at": req["created_at"]
            }
        
        # No membership, no request
        return {"status": "none"}
        
    except Exception as e:
        logger.error(f"Error checking join status for team {team_id}: {e}")
        # Default to none on error - safest option
        return {"status": "none"}
async def get_team_join_requests(
    team_id: str,
    status: Optional[str] = Query("pending"),
    current_user: User = Depends(get_current_user)
):
    """
    Get join requests for a team (team leader only).
    
    Returns empty list [] if no requests found.
    Never returns 520 - handles all errors gracefully.
    """
    import logging
    logger = logging.getLogger(__name__)
    supabase = get_supabase_client()
    
    try:
        # Verify leader role
        membership = supabase.table("team_members")\
            .select("role")\
            .eq("team_id", team_id)\
            .eq("user_id", current_user.id)\
            .execute()
        
        if not membership.data or membership.data[0].get("role") not in ["leader", "co-leader"]:
            raise HTTPException(status_code=403, detail="Only team leaders can view join requests")
        
        # Build query with proper error handling
        query = supabase.table("team_join_requests")\
            .select("id, team_id, user_id, message, status, created_at, user_profiles(id, full_name, email, avatar_url)")\
            .eq("team_id", team_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).execute()
        
        # Always return array, never null
        return result.data if result.data else []
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching join requests for team {team_id}: {e}")
        # Return empty array instead of 520
        return []


@router.post("/cfo/teams/{team_id}/join-requests/{request_id}/review")
async def review_join_request(
    team_id: str,
    request_id: str,
    review: JoinRequestReview,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a join request (team leader only)."""
    supabase = get_supabase_client()
    
    # Verify leader role
    membership = supabase.table("team_members")\
        .select("role, teams(competition_id, max_members)")\
        .eq("team_id", team_id)\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not membership.data or membership.data[0].get("role") not in ["leader", "co-leader"]:
        raise HTTPException(status_code=403, detail="Only team leaders can review requests")
    
    team_info = membership.data[0].get("teams", {})
    competition_id = team_info.get("competition_id")
    
    # Get request
    join_request = supabase.table("team_join_requests")\
        .select("*, user_profiles(full_name, email)")\
        .eq("id", request_id)\
        .eq("team_id", team_id)\
        .eq("status", "pending")\
        .execute()
    
    if not join_request.data:
        raise HTTPException(status_code=404, detail="Join request not found or already processed")
    
    req_data = join_request.data[0]
    applicant_id = req_data["user_id"]
    applicant_name = req_data.get("user_profiles", {}).get("full_name", "Unknown")
    
    # Update request
    supabase.table("team_join_requests").update({
        "status": review.status,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_notes": review.review_notes
    }).eq("id", request_id).execute()
    
    if review.status == "approved":
        # Check team capacity
        member_count = supabase.table("team_members")\
            .select("id", count="exact")\
            .eq("team_id", team_id)\
            .execute()
        
        max_members = team_info.get("max_members", 4)
        if member_count.count >= max_members:
            raise HTTPException(status_code=400, detail="Team is full")
        
        # Add as member
        supabase.table("team_members").insert({
            "team_id": team_id,
            "user_id": applicant_id,
            "role": "member",
            "approval_status": "approved",
            "approved_by": current_user.id,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        event_type = "member_approved"
    else:
        event_type = "member_rejected"
    
    # Log activity
    await log_team_activity(
        supabase, team_id, competition_id,
        current_user.id, current_user.full_name or current_user.email,
        event_type,
        {"applicant_id": applicant_id, "applicant_name": applicant_name, "notes": review.review_notes}
    )
    
    return {"success": True, "status": review.status}


@router.get("/cfo/teams/{team_id}/leader-dashboard")
async def get_leader_dashboard(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Team leader control panel.
    Shows: members, pending requests, submission status, deadlines.
    """
    supabase = get_supabase_client()
    
    # Verify leader role
    membership = supabase.table("team_members")\
        .select("role")\
        .eq("team_id", team_id)\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not membership.data or membership.data[0].get("role") not in ["leader", "co-leader"]:
        raise HTTPException(status_code=403, detail="Only team leaders can access this dashboard")
    
    # Get team info
    team = supabase.table("teams")\
        .select("*, competitions(id, title, current_level, submissions_locked, level_2_deadline, level_3_deadline, level_4_deadline)")\
        .eq("id", team_id)\
        .execute()
    
    if not team.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_data = team.data[0]
    competition = team_data.get("competitions", {})
    
    # Get members
    members = supabase.table("team_members")\
        .select("*, user_profiles(full_name, email, avatar_url)")\
        .eq("team_id", team_id)\
        .execute()
    
    # Get pending requests count
    pending_requests = supabase.table("team_join_requests")\
        .select("id", count="exact")\
        .eq("team_id", team_id)\
        .eq("status", "pending")\
        .execute()
    
    # Get submissions
    submissions = supabase.table("task_submissions")\
        .select("id, task_id, level, status, submitted_at, tasks(title)")\
        .eq("team_id", team_id)\
        .execute()
    
    # Get task requirements
    tasks = supabase.table("tasks")\
        .select("id, title, level, deadline, is_active")\
        .eq("competition_id", competition.get("id"))\
        .eq("is_active", True)\
        .execute()
    
    return {
        "team": {
            "id": team_data["id"],
            "name": team_data["team_name"],
            "requires_approval": team_data.get("requires_approval", False)
        },
        "competition": {
            "id": competition.get("id"),
            "title": competition.get("title"),
            "current_level": competition.get("current_level", 1),
            "submissions_locked": competition.get("submissions_locked", False),
            "deadlines": {
                "level_2": competition.get("level_2_deadline"),
                "level_3": competition.get("level_3_deadline"),
                "level_4": competition.get("level_4_deadline")
            }
        },
        "members": members.data or [],
        "pending_requests_count": pending_requests.count or 0,
        "submissions": submissions.data or [],
        "required_tasks": tasks.data or [],
        "submission_readiness": {
            "total_tasks": len(tasks.data or []),
            "submitted": len(submissions.data or []),
            "is_complete": len(submissions.data or []) >= len([t for t in (tasks.data or []) if t.get("level", 1) <= competition.get("current_level", 1)])
        }
    }


@router.patch("/cfo/teams/{team_id}/settings")
async def update_team_settings(
    team_id: str,
    settings: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update team settings (leader only)."""
    supabase = get_supabase_client()
    
    # Verify leader role
    membership = supabase.table("team_members")\
        .select("role, teams(competition_id)")\
        .eq("team_id", team_id)\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not membership.data or membership.data[0].get("role") != "leader":
        raise HTTPException(status_code=403, detail="Only team leader can update settings")
    
    allowed_settings = ["requires_approval", "team_settings"]
    update_data = {k: v for k, v in settings.items() if k in allowed_settings}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid settings to update")
    
    supabase.table("teams")\
        .update(update_data)\
        .eq("id", team_id)\
        .execute()
    
    # Log activity
    competition_id = membership.data[0].get("teams", {}).get("competition_id")
    await log_team_activity(
        supabase, team_id, competition_id,
        current_user.id, current_user.full_name or current_user.email,
        "settings_changed",
        {"changes": update_data}
    )
    
    return {"success": True, "settings": update_data}


# ===========================================================
# PHASE 6: ADMIN GOVERNANCE & OBSERVER MODE
# ===========================================================

@router.get("/admin/teams/{team_id}/full-view")
async def admin_team_full_view(
    team_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user)
):
    """
    Admin read-only view of a team.
    Includes: members, submissions, scores, activity timeline.
    ALL access is logged for audit.
    """
    supabase = get_supabase_client()
    
    # Get team first to get competition_id for logging
    team = supabase.table("teams")\
        .select("*, competitions(id, title, status)")\
        .eq("id", team_id)\
        .execute()
    
    if not team.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_data = team.data[0]
    comp_id = team_data.get("competitions", {}).get("id")
    
    # Log admin view with competition context
    await log_admin_view(
        supabase, current_user.id, "team_detail",
        "team", team_id, comp_id
    )
    
    # Get members
    members = supabase.table("team_members")\
        .select("*, user_profiles(full_name, email, role)")\
        .eq("team_id", team_id)\
        .execute()
    
    # Get submissions (both legacy and task-based)
    legacy_submissions = supabase.table("team_submissions")\
        .select("*")\
        .eq("team_id", team_id)\
        .execute()
    
    task_submissions = supabase.table("task_submissions")\
        .select("*, tasks(title, level)")\
        .eq("team_id", team_id)\
        .execute()
    
    # Get scores
    scores = supabase.table("task_submission_scores")\
        .select("*, task_submissions(task_id)")\
        .in_("task_submission_id", [s["id"] for s in (task_submissions.data or [])])\
        .execute() if task_submissions.data else {"data": []}
    
    # Get activity timeline (last 50)
    activity = supabase.table("team_activity_log")\
        .select("*")\
        .eq("team_id", team_id)\
        .order("created_at", desc=True)\
        .limit(50)\
        .execute()
    
    return {
        "team": team_data,
        "members": members.data or [],
        "submissions": {
            "legacy": legacy_submissions.data or [],
            "task_based": task_submissions.data or []
        },
        "scores": scores.data if isinstance(scores, dict) else (scores.data or []),
        "activity_timeline": activity.data or [],
        "_admin_view_logged": True
    }


@router.get("/admin/teams/{team_id}/chat")
async def admin_view_team_chat(
    team_id: str,
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_admin_user)
):
    """
    Admin READ-ONLY view of team chat.
    Admin cannot send messages - only observe.
    Access is logged for audit.
    """
    supabase = get_supabase_client()
    
    # Log admin view
    await log_admin_view(
        supabase, current_user.id, "team_chat",
        "team", team_id
    )
    
    # Get team to verify it exists
    team = supabase.table("teams")\
        .select("id, team_name, competition_id")\
        .eq("id", team_id)\
        .execute()
    
    if not team.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get messages
    messages = supabase.table("chat_messages")\
        .select("*, user_profiles(full_name)")\
        .eq("team_id", team_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    
    return {
        "team_id": team_id,
        "team_name": team.data[0]["team_name"],
        "messages": messages.data or [],
        "_read_only": True,
        "_admin_view_logged": True
    }


@router.get("/admin/teams/{team_id}/activity")
async def get_team_activity_timeline(
    team_id: str,
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_admin_user)
):
    """Get team activity timeline for admin review."""
    supabase = get_supabase_client()
    
    # Log admin view
    await log_admin_view(
        supabase, current_user.id, "team_activity",
        "team", team_id
    )
    
    result = supabase.table("team_activity_log")\
        .select("*")\
        .eq("team_id", team_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    
    return result.data or []


@router.get("/admin/competitions/{competition_id}/all-teams")
async def admin_get_all_teams(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Admin view of all teams in a competition."""
    supabase = get_supabase_client()
    
    # Log admin view
    await log_admin_view(
        supabase, current_user.id, "team_list",
        "competition", competition_id, competition_id
    )
    
    teams = supabase.table("teams")\
        .select("*, team_members(count)")\
        .eq("competition_id", competition_id)\
        .execute()
    
    # Get submission counts
    submissions = supabase.table("task_submissions")\
        .select("team_id")\
        .eq("competition_id", competition_id)\
        .execute()
    
    submission_counts = {}
    for s in (submissions.data or []):
        tid = s["team_id"]
        submission_counts[tid] = submission_counts.get(tid, 0) + 1
    
    result = []
    for team in (teams.data or []):
        result.append({
            **team,
            "submission_count": submission_counts.get(team["id"], 0)
        })
    
    return result


# ===========================================================
# PHASE 8: SCORING FAIRNESS ENHANCEMENTS
# ===========================================================

@router.post("/cfo/submissions/{submission_id}/appeal")
async def create_score_appeal(
    submission_id: str,
    appeal_reason: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Submit an appeal for a score."""
    supabase = get_supabase_client()
    
    # Get submission
    submission = supabase.table("task_submissions")\
        .select("id, team_id, competition_id")\
        .eq("id", submission_id)\
        .execute()
    
    if not submission.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    sub_data = submission.data[0]
    
    # Verify user is team member
    membership = supabase.table("team_members")\
        .select("id")\
        .eq("team_id", sub_data["team_id"])\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not membership.data:
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    
    # Get current score
    score = supabase.table("task_submission_scores")\
        .select("weighted_total")\
        .eq("task_submission_id", submission_id)\
        .execute()
    
    original_score = score.data[0]["weighted_total"] if score.data else None
    
    # Create appeal
    result = supabase.table("score_appeals").insert({
        "submission_id": submission_id,
        "submission_type": "task",
        "team_id": sub_data["team_id"],
        "competition_id": sub_data["competition_id"],
        "appellant_id": current_user.id,
        "original_score": original_score,
        "appeal_reason": appeal_reason,
        "appeal_status": "pending"
    }).execute()
    
    return {"success": True, "appeal": result.data[0] if result.data else None}


@router.get("/admin/competitions/{competition_id}/appeals")
async def get_competition_appeals(
    competition_id: str,
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Get all score appeals for a competition."""
    supabase = get_supabase_client()
    
    query = supabase.table("score_appeals")\
        .select("*, teams(team_name), user_profiles(full_name)")\
        .eq("competition_id", competition_id)
    
    if status:
        query = query.eq("appeal_status", status)
    
    result = query.order("created_at", desc=True).execute()
    
    return result.data or []


@router.post("/admin/appeals/{appeal_id}/review")
async def review_score_appeal(
    appeal_id: str,
    status: str = Body(...),
    review_notes: str = Body(""),
    adjusted_score: Optional[float] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Review and resolve a score appeal."""
    supabase = get_supabase_client()
    
    update_data = {
        "appeal_status": status,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_notes": review_notes
    }
    
    if adjusted_score is not None and status == "adjusted":
        update_data["adjusted_score"] = adjusted_score
    
    result = supabase.table("score_appeals")\
        .update(update_data)\
        .eq("id", appeal_id)\
        .execute()
    
    return {"success": True, "appeal": result.data[0] if result.data else None}


# ===========================================================
# PHASE 9: TALENT MARKETPLACE (FIFA-STYLE)
# ===========================================================

@router.get("/talent/profile")
async def get_my_talent_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's talent profile."""
    supabase = get_supabase_client()
    
    result = supabase.table("talent_profiles")\
        .select("*")\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not result.data:
        # Auto-create profile
        new_profile = supabase.table("talent_profiles").insert({
            "user_id": current_user.id
        }).execute()
        return new_profile.data[0] if new_profile.data else {}
    
    return result.data[0]


@router.patch("/talent/profile")
async def update_talent_profile(
    profile_data: TalentProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update talent profile settings."""
    supabase = get_supabase_client()
    
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Upsert profile
    result = supabase.table("talent_profiles").upsert({
        "user_id": current_user.id,
        **update_data
    }, on_conflict="user_id").execute()
    
    return {"success": True, "profile": result.data[0] if result.data else None}


@router.get("/talent/browse")
async def browse_talent(
    skill: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    open_to_offers: bool = Query(True),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user)
):
    """Browse public talent profiles (for recruiters)."""
    supabase = get_supabase_client()
    
    query = supabase.table("talent_profiles")\
        .select("*, user_profiles(full_name, avatar_url)")\
        .eq("is_public", True)
    
    if open_to_offers:
        query = query.eq("is_open_to_offers", True)
    
    if min_rating:
        query = query.gte("overall_rating", min_rating)
    
    result = query.order("overall_rating", desc=True).limit(limit).execute()
    
    # Update profile views
    for profile in (result.data or []):
        supabase.table("talent_profiles")\
            .update({"profile_views": profile.get("profile_views", 0) + 1})\
            .eq("id", profile["id"])\
            .execute()
    
    return result.data or []


@router.get("/talent/{user_id}")
async def get_talent_profile(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific talent profile (if public or own)."""
    supabase = get_supabase_client()
    
    result = supabase.table("talent_profiles")\
        .select("*, user_profiles(full_name, avatar_url), user_badges(badge_id, earned_at, badge_definitions(name, icon_url, rarity))")\
        .eq("user_id", user_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = result.data[0]
    
    # Check visibility
    if not profile.get("is_public") and user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Profile is private")
    
    # Update views if not own profile
    if user_id != current_user.id:
        supabase.table("talent_profiles")\
            .update({"profile_views": profile.get("profile_views", 0) + 1})\
            .eq("user_id", user_id)\
            .execute()
    
    return profile


@router.post("/talent/offers")
async def create_talent_offer(
    offer: TalentOfferCreate,
    current_user: User = Depends(get_current_user)
):
    """Create an offer to a talent (recruiter/company only)."""
    supabase = get_supabase_client()
    
    # Verify company profile
    company = supabase.table("company_profiles")\
        .select("id, is_verified")\
        .eq("user_id", current_user.id)\
        .execute()
    
    if not company.data:
        raise HTTPException(status_code=403, detail="You need a company profile to make offers")
    
    # Check if talent is open to offers
    talent = supabase.table("talent_profiles")\
        .select("is_open_to_offers")\
        .eq("user_id", offer.talent_id)\
        .execute()
    
    if not talent.data or not talent.data[0].get("is_open_to_offers"):
        raise HTTPException(status_code=400, detail="This talent is not open to offers")
    
    # Create offer
    offer_data = {
        "talent_id": offer.talent_id,
        "company_id": current_user.id,
        "offer_type": offer.offer_type,
        "role_title": offer.role_title,
        "role_description": offer.role_description,
        "salary_min": offer.salary_min,
        "salary_max": offer.salary_max,
        "salary_currency": offer.salary_currency,
        "location": offer.location,
        "remote_option": offer.remote_option,
        "contract_duration_months": offer.contract_duration_months,
        "start_date": offer.start_date,
        "benefits": offer.benefits,
        "status": "pending"
    }
    
    result = supabase.table("talent_offers").insert(offer_data).execute()
    
    return {"success": True, "offer": result.data[0] if result.data else None}


@router.get("/talent/my-offers")
async def get_my_offers(
    current_user: User = Depends(get_current_user)
):
    """Get offers received (as talent) or sent (as company)."""
    supabase = get_supabase_client()
    
    # Offers received
    received = supabase.table("talent_offers")\
        .select("*, company_profiles(company_name, logo_url)")\
        .eq("talent_id", current_user.id)\
        .order("created_at", desc=True)\
        .execute()
    
    # Offers sent
    sent = supabase.table("talent_offers")\
        .select("*, talent_profiles(user_id, overall_rating), user_profiles(full_name)")\
        .eq("company_id", current_user.id)\
        .order("created_at", desc=True)\
        .execute()
    
    return {
        "received": received.data or [],
        "sent": sent.data or []
    }


@router.post("/talent/offers/{offer_id}/respond")
async def respond_to_offer(
    offer_id: str,
    response: TalentOfferResponse,
    current_user: User = Depends(get_current_user)
):
    """Respond to a talent offer."""
    supabase = get_supabase_client()
    
    # Verify ownership
    offer = supabase.table("talent_offers")\
        .select("id, talent_id, status")\
        .eq("id", offer_id)\
        .eq("talent_id", current_user.id)\
        .execute()
    
    if not offer.data:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer.data[0]["status"] not in ["pending", "viewed", "negotiating"]:
        raise HTTPException(status_code=400, detail="Offer cannot be responded to in current state")
    
    update_data = {
        "status": response.status,
        "talent_response": response.response_message,
        "talent_responded_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if response.counter_offer:
        update_data["counter_offer"] = response.counter_offer
        update_data["status"] = "negotiating"
    
    result = supabase.table("talent_offers")\
        .update(update_data)\
        .eq("id", offer_id)\
        .execute()
    
    return {"success": True, "offer": result.data[0] if result.data else None}


@router.post("/company/profile")
async def create_company_profile(
    profile: CompanyProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a company/recruiter profile."""
    supabase = get_supabase_client()
    
    # Check if already exists
    existing = supabase.table("company_profiles")\
        .select("id")\
        .eq("user_id", current_user.id)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Company profile already exists")
    
    profile_data = {
        "user_id": current_user.id,
        **profile.dict()
    }
    
    result = supabase.table("company_profiles").insert(profile_data).execute()
    
    return {"success": True, "profile": result.data[0] if result.data else None}


@router.get("/company/profile")
async def get_my_company_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's company profile."""
    supabase = get_supabase_client()
    
    result = supabase.table("company_profiles")\
        .select("*")\
        .eq("user_id", current_user.id)\
        .execute()
    
    return result.data[0] if result.data else None


# ===========================================================
# PHASE 10: SPONSORS, GAMIFICATION & SCALE
# ===========================================================

@router.get("/sponsors")
async def get_active_sponsors(
    current_user: User = Depends(get_current_user)
):
    """Get list of active sponsors."""
    supabase = get_supabase_client()
    
    result = supabase.table("sponsors")\
        .select("id, name, logo_url, tier, description")\
        .eq("is_active", True)\
        .order("tier")\
        .execute()
    
    return result.data or []


@router.get("/sponsors/{sponsor_id}/challenges")
async def get_sponsor_challenges(
    sponsor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get challenges from a specific sponsor."""
    supabase = get_supabase_client()
    
    result = supabase.table("sponsor_challenges")\
        .select("*")\
        .eq("sponsor_id", sponsor_id)\
        .eq("is_active", True)\
        .execute()
    
    return result.data or []


@router.get("/challenges/active")
async def get_active_challenges(
    current_user: User = Depends(get_current_user)
):
    """Get all active sponsor challenges."""
    supabase = get_supabase_client()
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = supabase.table("sponsor_challenges")\
        .select("*, sponsors(name, logo_url)")\
        .eq("is_active", True)\
        .lte("starts_at", now)\
        .gte("ends_at", now)\
        .execute()
    
    return result.data or []


@router.get("/badges")
async def get_all_badges(
    current_user: User = Depends(get_current_user)
):
    """Get all available badges."""
    supabase = get_supabase_client()
    
    result = supabase.table("badge_definitions")\
        .select("*")\
        .eq("is_active", True)\
        .order("rarity")\
        .order("points_value", desc=True)\
        .execute()
    
    return result.data or []


@router.get("/badges/my")
async def get_my_badges(
    current_user: User = Depends(get_current_user)
):
    """Get badges earned by current user."""
    supabase = get_supabase_client()
    
    result = supabase.table("user_badges")\
        .select("*, badge_definitions(code, name, description, category, icon_url, rarity, points_value), competitions(title)")\
        .eq("user_id", current_user.id)\
        .order("earned_at", desc=True)\
        .execute()
    
    return result.data or []


@router.get("/leaderboard/season")
async def get_season_leaderboard(
    season: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user)
):
    """Get seasonal points leaderboard."""
    supabase = get_supabase_client()
    
    current_season = season or get_current_season()
    
    result = supabase.table("user_points")\
        .select("*, user_profiles(full_name, avatar_url)")\
        .eq("season", current_season)\
        .order("total_points", desc=True)\
        .limit(limit)\
        .execute()
    
    # Add ranks
    leaderboard = []
    for i, entry in enumerate(result.data or []):
        leaderboard.append({
            **entry,
            "rank": i + 1
        })
    
    return {
        "season": current_season,
        "leaderboard": leaderboard
    }


@router.get("/seasons")
async def get_seasons(
    current_user: User = Depends(get_current_user)
):
    """Get all seasons."""
    supabase = get_supabase_client()
    
    result = supabase.table("seasons")\
        .select("*")\
        .order("starts_at", desc=True)\
        .execute()
    
    return result.data or []


@router.post("/admin/badges/award")
async def admin_award_badge(
    user_id: str = Body(...),
    badge_code: str = Body(...),
    competition_id: Optional[str] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Award a badge to a user."""
    supabase = get_supabase_client()
    
    # Get badge
    badge = supabase.table("badge_definitions")\
        .select("id, points_value")\
        .eq("code", badge_code)\
        .execute()
    
    if not badge.data:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    badge_data = badge.data[0]
    
    # Award badge
    try:
        supabase.table("user_badges").insert({
            "user_id": user_id,
            "badge_id": badge_data["id"],
            "competition_id": competition_id
        }).execute()
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="Badge already awarded")
        raise
    
    # Update points
    season = get_current_season()
    supabase.table("user_points").upsert({
        "user_id": user_id,
        "season": season,
        "badge_points": badge_data["points_value"],
        "total_points": badge_data["points_value"]
    }, on_conflict="user_id,season").execute()
    
    return {"success": True, "badge_code": badge_code}


@router.post("/admin/sponsors")
async def create_sponsor(
    sponsor_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_admin_user)
):
    """Admin: Create a sponsor."""
    supabase = get_supabase_client()
    
    result = supabase.table("sponsors").insert(sponsor_data).execute()
    
    return {"success": True, "sponsor": result.data[0] if result.data else None}


@router.post("/admin/sponsors/{sponsor_id}/challenges")
async def create_sponsor_challenge(
    sponsor_id: str,
    challenge: SponsorChallengeCreate,
    current_user: User = Depends(get_admin_user)
):
    """Admin: Create a sponsor challenge."""
    supabase = get_supabase_client()
    
    challenge_data = {
        "sponsor_id": sponsor_id,
        **challenge.dict()
    }
    
    result = supabase.table("sponsor_challenges").insert(challenge_data).execute()
    
    return {"success": True, "challenge": result.data[0] if result.data else None}


# ===========================================================
# TALENT PROFILE AUTO-UPDATE (After Competition)
# ===========================================================

@router.post("/admin/competitions/{competition_id}/finalize-talent")
async def finalize_talent_profiles(
    competition_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Admin: Update talent profiles after competition ends.
    Calculates: ratings, market values, awards badges.
    """
    supabase = get_supabase_client()
    
    # Get leaderboard
    leaderboard = supabase.table("leaderboard_snapshots")\
        .select("team_id, team_name, final_rank, cumulative_score")\
        .eq("competition_id", competition_id)\
        .order("final_rank")\
        .execute()
    
    if not leaderboard.data:
        raise HTTPException(status_code=400, detail="No leaderboard data found")
    
    updated_profiles = []
    badges_awarded = []
    season = get_current_season()
    
    for entry in leaderboard.data:
        # Get team members
        members = supabase.table("team_members")\
            .select("user_id")\
            .eq("team_id", entry["team_id"])\
            .execute()
        
        for member in (members.data or []):
            user_id = member["user_id"]
            rank = entry["final_rank"]
            score = entry["cumulative_score"]
            
            # Update talent profile
            try:
                # Get or create profile
                profile = supabase.table("talent_profiles")\
                    .select("*")\
                    .eq("user_id", user_id)\
                    .execute()
                
                if profile.data:
                    p = profile.data[0]
                    new_competitions = p.get("competitions_participated", 0) + 1
                    new_won = p.get("competitions_won", 0) + (1 if rank == 1 else 0)
                    new_total_score = p.get("total_score_earned", 0) + score
                    new_avg_rank = ((p.get("average_rank") or rank) * (new_competitions - 1) + rank) / new_competitions
                    new_rating = min(10, new_total_score / new_competitions / 10)
                    
                    supabase.table("talent_profiles").update({
                        "competitions_participated": new_competitions,
                        "competitions_won": new_won,
                        "total_score_earned": new_total_score,
                        "average_rank": round(new_avg_rank, 2),
                        "overall_rating": round(new_rating, 1),
                        "market_value": int(1000 * (1 + new_won * 0.5 + new_rating * 0.2)),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }).eq("user_id", user_id).execute()
                else:
                    supabase.table("talent_profiles").insert({
                        "user_id": user_id,
                        "competitions_participated": 1,
                        "competitions_won": 1 if rank == 1 else 0,
                        "total_score_earned": score,
                        "average_rank": rank,
                        "overall_rating": min(10, score / 10),
                        "market_value": int(1000 * (1 + (1 if rank == 1 else 0) * 0.5))
                    }).execute()
                
                updated_profiles.append(user_id)
                
                # Award badges
                badge_codes = []
                if rank == 1:
                    badge_codes.append("winner")
                elif rank <= 3:
                    badge_codes.append("top_3")
                elif rank <= 10:
                    badge_codes.append("top_10")
                
                # First competition badge
                if not profile.data or profile.data[0].get("competitions_participated", 0) == 0:
                    badge_codes.append("first_competition")
                
                for badge_code in badge_codes:
                    badge = supabase.table("badge_definitions")\
                        .select("id, points_value")\
                        .eq("code", badge_code)\
                        .execute()
                    
                    if badge.data:
                        try:
                            supabase.table("user_badges").insert({
                                "user_id": user_id,
                                "badge_id": badge.data[0]["id"],
                                "competition_id": competition_id
                            }).execute()
                            badges_awarded.append({"user_id": user_id, "badge": badge_code})
                            
                            # Update points
                            supabase.table("user_points").upsert({
                                "user_id": user_id,
                                "season": season,
                                "badge_points": badge.data[0]["points_value"],
                                "total_points": badge.data[0]["points_value"]
                            }, on_conflict="user_id,season").execute()
                        except Exception:
                            pass  # Badge already awarded
                
            except Exception as e:
                logger.error(f"Failed to update talent profile for {user_id}: {e}")
    
    return {
        "success": True,
        "profiles_updated": len(updated_profiles),
        "badges_awarded": badges_awarded
    }
