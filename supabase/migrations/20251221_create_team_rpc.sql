-- Atomic Team Creation Function
-- Creates team - leader member is auto-added by database trigger
-- The trigger on teams table automatically inserts leader into team_members

CREATE OR REPLACE FUNCTION create_team_with_leader(
  p_team_name TEXT,
  p_competition_id UUID,
  p_user_id UUID,
  p_user_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_team teams;
BEGIN
  -- Insert team (leader_id determines who is the leader/CFO)
  -- NOTE: A database trigger automatically adds the leader to team_members
  INSERT INTO teams (team_name, competition_id, leader_id)
  VALUES (p_team_name, p_competition_id, p_user_id)
  RETURNING * INTO v_team;

  -- Update the auto-created team_member with user_name (trigger doesn't have access to it)
  UPDATE team_members 
  SET user_name = p_user_name
  WHERE team_id = v_team.id AND user_id = p_user_id;

  -- Return the created team as JSON
  RETURN row_to_json(v_team);
END;
$$;
