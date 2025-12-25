-- CFO Leadership Application System - Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing table if exists (only in dev)
-- DROP TABLE IF EXISTS cfo_applications;

-- Create expanded cfo_applications table
CREATE TABLE IF NOT EXISTS cfo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  
  -- Step 1: Leadership Profile
  experience_years TEXT NOT NULL,
  leadership_exposure TEXT NOT NULL,
  decision_ownership TEXT NOT NULL,
  leadership_willingness TEXT NOT NULL,
  commitment_level TEXT NOT NULL,
  
  -- Step 2: Judgment & Capital Allocation
  capital_allocation TEXT NOT NULL,
  capital_justification TEXT NOT NULL,
  cash_vs_profit TEXT NOT NULL,
  kpi_prioritization TEXT NOT NULL,
  
  -- Step 3: Financial Reality
  dscr_choice TEXT NOT NULL,
  dscr_impact TEXT NOT NULL,
  cost_priority TEXT NOT NULL,
  cfo_mindset TEXT NOT NULL,
  mindset_explanation TEXT NOT NULL,
  
  -- Step 4: Ethics & Ownership
  ethics_choice TEXT NOT NULL,
  culture_vs_results TEXT NOT NULL,
  why_top_100 TEXT NOT NULL,
  
  -- Scoring (internal only - never expose to users)
  total_score DECIMAL(10,2) DEFAULT 0,
  raw_score DECIMAL(10,2) DEFAULT 0,
  leadership_score DECIMAL(10,2) DEFAULT 0,
  ethics_score DECIMAL(10,2) DEFAULT 0,
  capital_score DECIMAL(10,2) DEFAULT 0,
  judgment_score DECIMAL(10,2) DEFAULT 0,
  red_flag_count INTEGER DEFAULT 0,
  red_flags JSONB DEFAULT '[]',
  auto_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Admin override
  admin_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by UUID REFERENCES user_profiles(id),
  override_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, competition_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cfo_apps_user ON cfo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cfo_apps_competition ON cfo_applications(competition_id);
CREATE INDEX IF NOT EXISTS idx_cfo_apps_status ON cfo_applications(status);
CREATE INDEX IF NOT EXISTS idx_cfo_apps_score ON cfo_applications(total_score DESC);

-- Disable RLS for now (or create proper policies)
ALTER TABLE cfo_applications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON cfo_applications TO authenticated;
GRANT ALL ON cfo_applications TO service_role;
