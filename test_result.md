backend:
  - task: "Admin Task Management - GET /api/admin/competitions/{id}/tasks"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin task listing endpoint"

  - task: "Admin Task Management - POST /api/admin/competitions/{id}/tasks"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin task creation with level, file types, constraints"

  - task: "Admin Task Management - PATCH /api/admin/competitions/{id}/tasks/{task_id}"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin task update endpoint"

  - task: "Admin Task Management - DELETE /api/admin/competitions/{id}/tasks/{task_id}"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin task deletion endpoint"

  - task: "Admin Scoring Criteria - GET /api/admin/competitions/{id}/criteria"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin scoring criteria listing"

  - task: "Admin Scoring Criteria - POST /api/admin/competitions/{id}/criteria"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin scoring criteria creation with weights"

  - task: "Admin Scoring Criteria - PATCH /api/admin/competitions/{id}/criteria/{criterion_id}"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin scoring criteria update"

  - task: "Admin Level Control - PATCH /api/admin/competitions/{id}"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin level advancement (current_level field)"

  - task: "Admin Level Control - POST /api/admin/competitions/{id}/create-level-tasks"
    implemented: true
    working: "NA"
    file: "admin_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Admin predefined level task creation"

  - task: "Judge Endpoints - GET /api/cfo/judge/competitions"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Judge assigned competitions listing"

  - task: "Judge Endpoints - GET /api/cfo/judge/competitions/{id}/criteria"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Judge criteria for scoring"

  - task: "Judge Endpoints - GET /api/cfo/judge/competitions/{id}/submissions"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Judge submissions to review"

  - task: "Judge Endpoints - GET /api/cfo/judge/submissions/{id}/my-scores"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Judge own scores retrieval"

  - task: "Judge Endpoints - POST /api/cfo/judge/submissions/{id}/scores"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Judge criteria-based scoring submission"

  - task: "Participant Task Endpoints - GET /api/cfo/competitions/{id}/tasks"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Participant task viewing by competition"

  - task: "Participant Task Endpoints - GET /api/cfo/teams/{id}/submissions"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Team submissions listing"

  - task: "Participant Task Endpoints - POST /api/cfo/teams/{id}/submissions/task"
    implemented: true
    working: "NA"
    file: "cfo_competition.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Ready for testing - Team task submission with file upload"

frontend:
  - task: "Admin Dashboard - Levels & Tasks Tab"
    implemented: true
    working: "NA"
    file: "admin/index.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Frontend testing not required per system instructions"

  - task: "Judge Dashboard - Criteria-based Scoring"
    implemented: true
    working: "NA"
    file: "judge/index.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Frontend testing not required per system instructions"

  - task: "Team Details - Tasks Tab"
    implemented: true
    working: "NA"
    file: "teams/[id].js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Frontend testing not required per system instructions"

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Admin Task Management - GET /api/admin/competitions/{id}/tasks"
    - "Admin Task Management - POST /api/admin/competitions/{id}/tasks"
    - "Admin Scoring Criteria - GET /api/admin/competitions/{id}/criteria"
    - "Admin Scoring Criteria - POST /api/admin/competitions/{id}/criteria"
    - "Judge Endpoints - GET /api/cfo/judge/competitions"
    - "Participant Task Endpoints - GET /api/cfo/competitions/{id}/tasks"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Starting Phase 2-4 Multi-Level Competition Engine testing. Focus on admin task management, scoring criteria, judge endpoints, and participant task endpoints."

## Phase 5-10 Testing - Multi-Level Competition Engine

### Endpoints Implemented (Phase 5-10)

#### Phase 5: Task Submissions
- GET /api/cfo/competitions/{id}/tasks - Get tasks with submission status
- GET /api/cfo/tasks/{id}/my-submission - Get current user's submission
- POST /api/cfo/tasks/{id}/submit - Submit file to task
- GET /api/admin/competitions/{id}/task-submissions - Admin view all submissions
- GET /api/admin/tasks/{id}/submissions - Admin view task submissions
- POST /api/admin/task-submissions/{id}/lock - Lock submission

#### Phase 6: Judge Workflow
- POST /api/admin/competitions/{id}/judges - Assign judge
- GET /api/admin/competitions/{id}/judges - List judges
- DELETE /api/admin/competitions/{id}/judges/{judge_id} - Remove judge
- GET /api/judge/competitions - Judge's assigned competitions
- GET /api/judge/competitions/{id}/submissions - Submissions to review
- GET /api/judge/competitions/{id}/criteria - Scoring criteria
- GET /api/judge/task-submissions/{id}/my-scores - My scores
- POST /api/judge/task-submissions/{id}/score - Submit scores

#### Phase 7: Leaderboards
- GET /api/cfo/competitions/{id}/leaderboard - Get leaderboard (if published)
- POST /api/admin/competitions/{id}/publish-results - Publish results
- GET /api/admin/competitions/{id}/export-results - Export CSV/JSON

#### Phase 8: Certificates
- POST /api/admin/competitions/{id}/issue-certificates - Issue certificates
- GET /api/cfo/me/certificates - Get my certificates

#### Phase 9: Integrity
- GET /api/admin/tasks/{id}/integrity-report - Duplicate file detection

#### Phase 10: Operations
- GET /api/health - Health check
- GET /api/admin/audit-log - Audit trail
- GET /api/cfo/competitions/{id}/status - Enhanced status

### Database Tables Created
- task_submissions - Per-task submissions (Levels 2-4)
- task_score_entries - Criteria scores per judge
- task_submission_scores - Weighted totals
- team_level_scores - Aggregated level scores
- leaderboard_snapshots - Published rankings
- certificates - Competition certificates
- audit_log - Action audit trail

### Test Checklist
1. [READY] Team submits for Level 2 task -> task_submissions row created
2. [READY] Duplicate submission rejected (unique constraint)
3. [READY] Deadline passed -> clear error
4. [READY] Lock submissions -> rejects all submits
5. [READY] Judge assignment required -> cannot score without assignment
6. [READY] Judge scoring stores per-criterion entries + weighted total
7. [READY] Leaderboard returns correct ordering + tie-break
8. [READY] Results hidden until publish
9. [READY] Export results works
10. [READY] Audit log captures key actions
