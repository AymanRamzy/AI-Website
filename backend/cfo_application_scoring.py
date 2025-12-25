"""
CFO Application System - Scoring and Filtering Logic
Handles the 4-step CFO leadership application with auto-scoring
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

# =========================================================
# STEP 1: Leadership Profile Questions & Scoring
# =========================================================

class ExperienceYears(str, Enum):
    LESS_THAN_2 = "less_than_2"
    TWO_TO_FIVE = "2_to_5"
    FIVE_TO_TEN = "5_to_10"
    MORE_THAN_10 = "more_than_10"

class LeadershipExposure(str, Enum):
    NONE = "none"
    TEAM_LEAD = "team_lead"
    DEPARTMENT_HEAD = "department_head"
    C_SUITE = "c_suite"

class DecisionOwnership(str, Enum):
    AVOID = "avoid"
    DELEGATE = "delegate"
    OWN_WITH_SUPPORT = "own_with_support"
    FULL_OWNERSHIP = "full_ownership"

class LeadershipWillingness(str, Enum):
    NOT_INTERESTED = "not_interested"
    MAYBE_LATER = "maybe_later"
    READY_WITH_GUIDANCE = "ready_with_guidance"
    FULLY_READY = "fully_ready"

# NEW: Merged CFO Readiness & Commitment Question
class CFOReadinessCommitment(str, Enum):
    NOT_READY = "not_ready"  # HARD GATE - Reject submission
    EXPLORING = "exploring"
    READY_WITH_CONDITIONS = "ready_with_conditions"
    FULLY_READY = "fully_ready"

class CommitmentLevel(str, Enum):
    EXPLORING = "exploring"
    PARTIALLY_COMMITTED = "partially_committed"
    HIGHLY_COMMITTED = "highly_committed"
    ALL_IN = "all_in"

# =========================================================
# STEP 2: Judgment & Capital Allocation
# =========================================================

class CapitalAllocationChoice(str, Enum):
    SAFE_INVESTMENT = "safe_investment"
    MODERATE_RISK = "moderate_risk"
    GROWTH_INVESTMENT = "growth_investment"
    AGGRESSIVE_EXPANSION = "aggressive_expansion"

# =========================================================
# STEP 3: Financial Reality Under Pressure
# =========================================================

class DSCRChoice(str, Enum):
    PRIORITIZE_DEBT = "prioritize_debt"
    BALANCE_BOTH = "balance_both"
    PRIORITIZE_GROWTH = "prioritize_growth"
    RENEGOTIATE = "renegotiate"

class CostPriority(str, Enum):
    CUT_PEOPLE = "cut_people"
    CUT_MARKETING = "cut_marketing"
    OPTIMIZE_OPERATIONS = "optimize_operations"
    RENEGOTIATE_VENDORS = "renegotiate_vendors"

class CFOMindset(str, Enum):
    NUMBER_CRUNCHER = "number_cruncher"
    BUSINESS_PARTNER = "business_partner"
    STRATEGIC_ADVISOR = "strategic_advisor"
    CHIEF_VALUE_OFFICER = "chief_value_officer"

# =========================================================
# STEP 4: Ethics & Final Ownership (HARD DISQUALIFIER)
# =========================================================

class EthicsChoice(str, Enum):
    REPORT_IMMEDIATELY = "report_immediately"
    INVESTIGATE_FIRST = "investigate_first"
    CONSULT_LEGAL = "consult_legal"
    ADJUST_QUIETLY = "adjust_quietly"  # DISQUALIFIER
    DO_NOTHING = "do_nothing"  # DISQUALIFIER

class CultureVsResults(str, Enum):
    RESULTS_FIRST = "results_first"
    CULTURE_FIRST = "culture_first"
    BALANCE_BOTH = "balance_both"
    DEPENDS_ON_SITUATION = "depends_on_situation"

# =========================================================
# APPLICATION DATA MODELS
# =========================================================

class CFOApplicationStep1(BaseModel):
    experience_years: ExperienceYears
    leadership_exposure: LeadershipExposure
    decision_ownership: DecisionOwnership
    leadership_willingness: LeadershipWillingness
    commitment_level: CommitmentLevel
    # NEW: Merged readiness & commitment question
    cfo_readiness_commitment: Optional[CFOReadinessCommitment] = None

class CFOApplicationStep2(BaseModel):
    capital_allocation: CapitalAllocationChoice
    capital_justification: str = Field(..., max_length=300)  # Max 3 lines
    cash_vs_profit: str = Field(..., max_length=500)
    kpi_prioritization: str = Field(..., max_length=500)

class CFOApplicationStep3(BaseModel):
    dscr_choice: DSCRChoice
    dscr_impact: str = Field(..., max_length=200)
    cost_priority: CostPriority
    cfo_mindset: CFOMindset
    mindset_explanation: str = Field(..., max_length=150)

class CFOApplicationStep4(BaseModel):
    ethics_choice: EthicsChoice
    culture_vs_results: CultureVsResults
    why_top_100: str = Field(..., max_length=300)  # Max 3 lines

class CFOFullApplication(BaseModel):
    competition_id: str
    step1: CFOApplicationStep1
    step2: CFOApplicationStep2
    step3: CFOApplicationStep3
    step4: CFOApplicationStep4
    # CV Upload (required)
    cv_url: Optional[str] = None
    cv_uploaded_at: Optional[str] = None

# =========================================================
# SCORING WEIGHTS
# =========================================================

SCORING_WEIGHTS = {
    "leadership": 1.2,
    "ethics": 1.3,
    "capital_allocation": 1.2,
    "technical_finance": 0.8,
    "judgment": 1.0,
    "commitment": 1.0
}

# =========================================================
# SCORING LOGIC
# =========================================================

def score_step1(step1: CFOApplicationStep1) -> Dict:
    """Score Leadership Profile - returns score and red flags"""
    score = 0
    red_flags = []
    
    # Experience years scoring
    exp_scores = {
        ExperienceYears.LESS_THAN_2: 5,
        ExperienceYears.TWO_TO_FIVE: 15,
        ExperienceYears.FIVE_TO_TEN: 25,
        ExperienceYears.MORE_THAN_10: 30
    }
    score += exp_scores.get(step1.experience_years, 0)
    
    # Leadership exposure scoring
    exposure_scores = {
        LeadershipExposure.NONE: 0,
        LeadershipExposure.TEAM_LEAD: 15,
        LeadershipExposure.DEPARTMENT_HEAD: 25,
        LeadershipExposure.C_SUITE: 35
    }
    score += exposure_scores.get(step1.leadership_exposure, 0)
    
    # Decision ownership scoring
    ownership_scores = {
        DecisionOwnership.AVOID: 0,
        DecisionOwnership.DELEGATE: 10,
        DecisionOwnership.OWN_WITH_SUPPORT: 20,
        DecisionOwnership.FULL_OWNERSHIP: 30
    }
    score += ownership_scores.get(step1.decision_ownership, 0)
    if step1.decision_ownership == DecisionOwnership.AVOID:
        red_flags.append("avoids_decisions")
    
    # Leadership willingness scoring
    willingness_scores = {
        LeadershipWillingness.NOT_INTERESTED: 0,
        LeadershipWillingness.MAYBE_LATER: 5,
        LeadershipWillingness.READY_WITH_GUIDANCE: 15,
        LeadershipWillingness.FULLY_READY: 25
    }
    score += willingness_scores.get(step1.leadership_willingness, 0)
    
    # Commitment level scoring
    commitment_scores = {
        CommitmentLevel.EXPLORING: 5,
        CommitmentLevel.PARTIALLY_COMMITTED: 10,
        CommitmentLevel.HIGHLY_COMMITTED: 20,
        CommitmentLevel.ALL_IN: 25
    }
    score += commitment_scores.get(step1.commitment_level, 0)
    
    # NEW: CFO Readiness & Commitment scoring (merged question)
    # Replaces both willingness and commitment weights
    if step1.cfo_readiness_commitment:
        readiness_scores = {
            CFOReadinessCommitment.NOT_READY: 0,  # Hard gate - should not reach here
            CFOReadinessCommitment.EXPLORING: 10,
            CFOReadinessCommitment.READY_WITH_CONDITIONS: 25,
            CFOReadinessCommitment.FULLY_READY: 40
        }
        score += readiness_scores.get(step1.cfo_readiness_commitment, 0)
        
        # Hard gate: NOT_READY = auto-exclude
        if step1.cfo_readiness_commitment == CFOReadinessCommitment.NOT_READY:
            red_flags.append("not_ready_for_cfo")
            return {
                "raw_score": 0,
                "weighted_score": 0,
                "red_flags": ["not_ready_for_cfo"],
                "auto_exclude": True,
                "exclusion_reason": "Applicant indicated they are not ready for CFO responsibilities"
            }
    
    # Auto-exclude check: lowest willingness AND lowest commitment
    auto_exclude = (
        step1.leadership_willingness == LeadershipWillingness.NOT_INTERESTED and
        step1.commitment_level == CommitmentLevel.EXPLORING
    )
    
    if auto_exclude:
        red_flags.append("low_willingness_commitment")
    
    return {
        "raw_score": score,
        "weighted_score": score * SCORING_WEIGHTS["leadership"],
        "red_flags": red_flags,
        "auto_exclude": auto_exclude
    }

def score_step2(step2: CFOApplicationStep2) -> Dict:
    """Score Judgment & Capital Allocation"""
    score = 0
    red_flags = []
    
    # Capital allocation choice
    capital_scores = {
        CapitalAllocationChoice.SAFE_INVESTMENT: 10,
        CapitalAllocationChoice.MODERATE_RISK: 20,
        CapitalAllocationChoice.GROWTH_INVESTMENT: 25,
        CapitalAllocationChoice.AGGRESSIVE_EXPANSION: 15  # Too risky without context
    }
    score += capital_scores.get(step2.capital_allocation, 0)
    
    # Text answer quality (basic check - length and substance)
    if len(step2.capital_justification.strip()) < 50:
        red_flags.append("weak_justification")
        score += 5
    elif len(step2.capital_justification.strip()) >= 100:
        score += 20
    else:
        score += 15
    
    if len(step2.cash_vs_profit.strip()) < 50:
        red_flags.append("weak_cash_profit_answer")
        score += 5
    elif len(step2.cash_vs_profit.strip()) >= 100:
        score += 20
    else:
        score += 15
    
    if len(step2.kpi_prioritization.strip()) < 50:
        score += 5
    elif len(step2.kpi_prioritization.strip()) >= 100:
        score += 20
    else:
        score += 15
    
    return {
        "raw_score": score,
        "weighted_score": score * SCORING_WEIGHTS["capital_allocation"],
        "red_flags": red_flags,
        "auto_exclude": False
    }

def score_step3(step3: CFOApplicationStep3) -> Dict:
    """Score Financial Reality Under Pressure"""
    score = 0
    red_flags = []
    
    # DSCR choice
    dscr_scores = {
        DSCRChoice.PRIORITIZE_DEBT: 15,
        DSCRChoice.BALANCE_BOTH: 25,
        DSCRChoice.PRIORITIZE_GROWTH: 10,
        DSCRChoice.RENEGOTIATE: 20
    }
    score += dscr_scores.get(step3.dscr_choice, 0)
    
    # Cost priority
    cost_scores = {
        CostPriority.CUT_PEOPLE: 5,  # Last resort mentality
        CostPriority.CUT_MARKETING: 10,
        CostPriority.OPTIMIZE_OPERATIONS: 25,
        CostPriority.RENEGOTIATE_VENDORS: 20
    }
    score += cost_scores.get(step3.cost_priority, 0)
    if step3.cost_priority == CostPriority.CUT_PEOPLE:
        red_flags.append("people_first_cut")
    
    # CFO mindset
    mindset_scores = {
        CFOMindset.NUMBER_CRUNCHER: 10,
        CFOMindset.BUSINESS_PARTNER: 20,
        CFOMindset.STRATEGIC_ADVISOR: 25,
        CFOMindset.CHIEF_VALUE_OFFICER: 30
    }
    score += mindset_scores.get(step3.cfo_mindset, 0)
    
    # Text quality
    if len(step3.dscr_impact.strip()) >= 50:
        score += 10
    if len(step3.mindset_explanation.strip()) >= 50:
        score += 10
    
    return {
        "raw_score": score,
        "weighted_score": score * SCORING_WEIGHTS["technical_finance"],
        "red_flags": red_flags,
        "auto_exclude": False
    }

def score_step4(step4: CFOApplicationStep4) -> Dict:
    """Score Ethics & Final Ownership - HARD DISQUALIFIER"""
    score = 0
    red_flags = []
    auto_exclude = False
    
    # Ethics choice - CRITICAL
    ethics_scores = {
        EthicsChoice.REPORT_IMMEDIATELY: 35,
        EthicsChoice.INVESTIGATE_FIRST: 30,
        EthicsChoice.CONSULT_LEGAL: 25,
        EthicsChoice.ADJUST_QUIETLY: 0,  # DISQUALIFIER
        EthicsChoice.DO_NOTHING: 0  # DISQUALIFIER
    }
    score += ethics_scores.get(step4.ethics_choice, 0)
    
    # Auto-exclude for unethical choices
    if step4.ethics_choice in [EthicsChoice.ADJUST_QUIETLY, EthicsChoice.DO_NOTHING]:
        auto_exclude = True
        red_flags.append("ethics_failure")
    
    # Culture vs results
    culture_scores = {
        CultureVsResults.RESULTS_FIRST: 10,
        CultureVsResults.CULTURE_FIRST: 20,
        CultureVsResults.BALANCE_BOTH: 30,
        CultureVsResults.DEPENDS_ON_SITUATION: 15
    }
    score += culture_scores.get(step4.culture_vs_results, 0)
    
    # Final motivation - length and substance
    if len(step4.why_top_100.strip()) < 100:
        red_flags.append("weak_motivation")
        score += 10
    elif len(step4.why_top_100.strip()) >= 200:
        score += 35
    else:
        score += 25
    
    return {
        "raw_score": score,
        "weighted_score": score * SCORING_WEIGHTS["ethics"],
        "red_flags": red_flags,
        "auto_exclude": auto_exclude
    }

def calculate_total_score(application: CFOFullApplication) -> Dict:
    """Calculate total score with all components"""
    
    step1_result = score_step1(application.step1)
    step2_result = score_step2(application.step2)
    step3_result = score_step3(application.step3)
    step4_result = score_step4(application.step4)
    
    # Aggregate
    total_raw = (
        step1_result["raw_score"] +
        step2_result["raw_score"] +
        step3_result["raw_score"] +
        step4_result["raw_score"]
    )
    
    total_weighted = (
        step1_result["weighted_score"] +
        step2_result["weighted_score"] +
        step3_result["weighted_score"] +
        step4_result["weighted_score"]
    )
    
    all_red_flags = (
        step1_result["red_flags"] +
        step2_result["red_flags"] +
        step3_result["red_flags"] +
        step4_result["red_flags"]
    )
    
    # Red flag penalty (5 points per flag after first 2)
    red_flag_penalty = max(0, (len(all_red_flags) - 2) * 5)
    
    # Auto-exclude if any step triggers it
    auto_exclude = (
        step1_result["auto_exclude"] or
        step4_result["auto_exclude"]  # Ethics is hardest
    )
    
    final_score = total_weighted - red_flag_penalty
    
    return {
        "total_raw_score": total_raw,
        "total_weighted_score": total_weighted,
        "red_flag_penalty": red_flag_penalty,
        "final_score": final_score,
        "red_flags": all_red_flags,
        "red_flag_count": len(all_red_flags),
        "auto_exclude": auto_exclude,
        "exclusion_reason": "ethics_or_commitment_failure" if auto_exclude else None,
        "section_scores": {
            "leadership": step1_result["weighted_score"],
            "capital_allocation": step2_result["weighted_score"],
            "financial_judgment": step3_result["weighted_score"],
            "ethics": step4_result["weighted_score"]
        },
        "tie_breakers": {
            "leadership_score": step1_result["weighted_score"],
            "ethics_score": step4_result["weighted_score"],
            "capital_score": step2_result["weighted_score"],
            "motivation_length": len(application.step4.why_top_100.strip())
        }
    }

def determine_status(rank: int, auto_exclude: bool) -> str:
    """Determine applicant status based on rank"""
    if auto_exclude:
        return "excluded"
    if rank <= 100:
        return "qualified"
    if rank <= 150:
        return "reserve"
    return "not_selected"
