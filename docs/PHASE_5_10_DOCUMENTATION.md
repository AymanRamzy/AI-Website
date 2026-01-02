# ModEX CFO Competition Platform
## Phases 5-10: Strategic Enhancement Suite Documentation

---

## 📋 ENDPOINT LIST

### Phase 5: Team Governance & Realism

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cfo/teams/{team_id}/join-request` | User | Request to join a team |
| GET | `/api/cfo/teams/{team_id}/join-requests` | Leader | Get pending join requests |
| POST | `/api/cfo/teams/{team_id}/join-requests/{id}/review` | Leader | Approve/reject request |
| GET | `/api/cfo/teams/{team_id}/leader-dashboard` | Leader | Team leader control panel |
| PATCH | `/api/cfo/teams/{team_id}/settings` | Leader | Update team settings |

### Phase 6: Admin Governance & Observer Mode

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/teams/{team_id}/full-view` | Admin | Complete team view (logged) |
| GET | `/api/admin/teams/{team_id}/chat` | Admin | READ-ONLY chat view (logged) |
| GET | `/api/admin/teams/{team_id}/activity` | Admin | Activity timeline |
| GET | `/api/admin/competitions/{id}/all-teams` | Admin | All teams in competition |

### Phase 7: Multi-Task Submissions (from phase5_10_router)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cfo/competitions/{id}/tasks` | User | Tasks with submission status |
| POST | `/api/cfo/tasks/{id}/submit` | User | Submit file to task |
| GET | `/api/cfo/tasks/{id}/my-submission` | User | Get my team's submission |
| GET | `/api/admin/competitions/{id}/task-submissions` | Admin | All task submissions |
| POST | `/api/admin/task-submissions/{id}/lock` | Admin | Lock submission |

### Phase 8: Scoring & Fairness

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cfo/submissions/{id}/appeal` | User | Create score appeal |
| GET | `/api/admin/competitions/{id}/appeals` | Admin | List appeals |
| POST | `/api/admin/appeals/{id}/review` | Admin | Review appeal |
| POST | `/api/judge/task-submissions/{id}/score` | Judge | Submit criteria scores |
| GET | `/api/judge/competitions/{id}/criteria` | Judge | Get scoring criteria |

### Phase 9: Talent Marketplace (FIFA-Style)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/talent/profile` | User | Get my talent profile |
| PATCH | `/api/talent/profile` | User | Update talent profile |
| GET | `/api/talent/browse` | User | Browse public talent |
| GET | `/api/talent/{user_id}` | User | View talent profile |
| POST | `/api/talent/offers` | Company | Create talent offer |
| GET | `/api/talent/my-offers` | User | Get received/sent offers |
| POST | `/api/talent/offers/{id}/respond` | User | Respond to offer |
| POST | `/api/company/profile` | User | Create company profile |
| GET | `/api/company/profile` | User | Get company profile |

### Phase 10: Sponsors, Gamification & Scale

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sponsors` | User | List active sponsors |
| GET | `/api/sponsors/{id}/challenges` | User | Sponsor challenges |
| GET | `/api/challenges/active` | User | Active challenges |
| GET | `/api/badges` | User | All available badges |
| GET | `/api/badges/my` | User | My earned badges |
| GET | `/api/leaderboard/season` | User | Season leaderboard |
| GET | `/api/seasons` | User | List seasons |
| POST | `/api/admin/badges/award` | Admin | Award badge to user |
| POST | `/api/admin/sponsors` | Admin | Create sponsor |
| POST | `/api/admin/sponsors/{id}/challenges` | Admin | Create challenge |
| POST | `/api/admin/competitions/{id}/finalize-talent` | Admin | Update talent after competition |

---

## 🛡️ SECURITY NOTES

### OWASP Compliance

1. **Authentication & Authorization**
   - All endpoints require authentication via session cookies
   - Role-based access: User, Leader, Judge, Admin
   - IDOR protection: Users can only access their own data

2. **Admin Observer Mode**
   - Admin can VIEW but NOT MODIFY team chats
   - All admin views are logged to `admin_view_log`
   - No admin endpoints for sending messages

3. **Judge Restrictions**
   - Judges can only score assigned competitions
   - `blind_judging` flag hides team names by default
   - Judges cannot view team chats
   - Scoring locked after results published

4. **Data Validation**
   - File uploads validated: type, size, hash
   - Score range enforced: 0-100
   - Enum values validated via DB constraints

5. **Audit Trail**
   - `audit_log` table captures all critical actions
   - `team_activity_log` tracks team events
   - `admin_view_log` tracks admin observations

### RLS Policies

All new tables have Row Level Security enabled:
- `service_role`: Full access for backend
- `authenticated`: Scoped access per user role
- Team data: Only members can view
- Talent profiles: Public flag controls visibility
- Admin views: Logged but not restricted

---

## 📊 DATABASE TABLES CREATED

### Phase 5: Team Governance
- `team_join_requests` - Pending join requests
- `team_members.approval_status` - Member approval workflow

### Phase 6: Admin Governance
- `team_activity_log` - Team timeline events
- `admin_view_log` - Admin observation audit

### Phase 7: Multi-Task (Already existed)
- `task_submissions` - Per-task file submissions

### Phase 8: Scoring
- `task_score_entries` - Per-criterion judge scores
- `task_submission_scores` - Weighted score summaries
- `scoring_locks` - Lock scoring per task
- `score_appeals` - Score appeal requests

### Phase 9: Talent Marketplace
- `talent_profiles` - User talent profiles
- `talent_offers` - Job offers
- `transfer_windows` - Seasonal windows
- `company_profiles` - Recruiter profiles

### Phase 10: Gamification
- `sponsors` - Sponsor accounts
- `sponsor_challenges` - Micro-cases
- `badge_definitions` - Badge catalog
- `user_badges` - Earned badges
- `user_points` - Season points
- `seasons` - Season definitions

---

## 🔄 ROLLBACK PLAN

### Level 1: Feature Disable (No Data Loss)
```sql
-- Disable new features without deleting data
ALTER TABLE team_members 
  ALTER COLUMN approval_status SET DEFAULT 'approved';

-- Set all pending to approved
UPDATE team_members SET approval_status = 'approved' 
WHERE approval_status = 'pending';

-- Disable talent marketplace
UPDATE talent_profiles SET is_public = false, is_open_to_offers = false;

-- Cancel all pending offers
UPDATE talent_offers SET status = 'withdrawn' WHERE status = 'pending';
```

### Level 2: Router Disable
```python
# In server.py, comment out:
# app.include_router(strategic_router)

# All strategic endpoints become 404, data preserved
```

### Level 3: Table Preservation (Extreme)
```sql
-- Rename tables instead of dropping
ALTER TABLE talent_profiles RENAME TO talent_profiles_backup;
ALTER TABLE talent_offers RENAME TO talent_offers_backup;
-- etc.

-- Data preserved, can be restored later
```

### Recovery Steps
1. Restart backend after code changes
2. Run data migration scripts if needed
3. Verify RLS policies are intact
4. Test critical flows (auth, submissions)

---

## ✅ ACCEPTANCE TEST CHECKLIST

### Phase 5: Team Governance
- [ ] User can request to join a team
- [ ] Team leader sees pending requests
- [ ] Leader can approve/reject requests
- [ ] Approved member appears in team
- [ ] Rejected user cannot access team

### Phase 6: Admin Observer
- [ ] Admin can view any team details
- [ ] Admin can view team chat (read-only)
- [ ] Admin view is logged in admin_view_log
- [ ] Activity timeline shows events

### Phase 7: Multi-Task
- [ ] Tasks display with submission status
- [ ] File upload validates type/size
- [ ] Deadline enforcement works
- [ ] Lock prevents new submissions

### Phase 8: Scoring
- [ ] Judge can submit criteria scores
- [ ] Weighted total calculated correctly
- [ ] User can create appeal
- [ ] Admin can review appeal

### Phase 9: Talent Marketplace
- [ ] User can create/update talent profile
- [ ] Company can create profile
- [ ] Company can send offer
- [ ] Talent can accept/reject/negotiate

### Phase 10: Gamification
- [ ] Badges display correctly
- [ ] Admin can award badge
- [ ] Points update on badge award
- [ ] Season leaderboard works
- [ ] Sponsor challenges display

---

## 🧪 CURL TEST EXAMPLES

```bash
# Get API URL
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Health check
curl -s "$API_URL/api/health" | jq

# Get badges (public)
curl -s "$API_URL/api/badges" | jq

# Get seasons
curl -s "$API_URL/api/seasons" | jq

# Talent browse (requires auth)
curl -s -b cookies.txt "$API_URL/api/talent/browse?open_to_offers=true" | jq

# Admin view team (requires admin auth)
curl -s -b cookies.txt "$API_URL/api/admin/teams/{team_id}/full-view" | jq
```

---

## 📝 MINIMAL UI NOTES

### Priority UI Components Needed:

1. **Team Leader Dashboard** (`/team/leader`)
   - Pending requests list with approve/reject buttons
   - Submission status summary
   - Deadline warnings

2. **Admin Team Viewer** (`/admin/team/:id`)
   - Read-only tabs: Members, Chat, Submissions, Scores
   - Activity timeline
   - "Admin View" badge prominently displayed

3. **Talent Profile Page** (`/talent/profile`)
   - Profile form with public/open toggles
   - Skills radar chart
   - Badges showcase

4. **Talent Marketplace** (`/talent/browse`)
   - Search/filter talent
   - Card-based profile previews
   - "Make Offer" button

5. **Badges & Achievements** (`/achievements`)
   - Badge grid with rarity colors
   - Progress indicators
   - Season points display

### Design Principles:
- Reuse existing UI components
- Minimal new pages (max 5)
- Backend-first: All logic in API
- Progressive enhancement

---

## 🎯 PRODUCTION READINESS

### For 100-1,000 Teams:

1. **Database Indexes** - All created in migration
2. **RLS Policies** - Enforced at DB level
3. **Rate Limiting** - Existing middleware applies
4. **Audit Logging** - Complete coverage
5. **Error Handling** - Explicit messages
6. **Feature Flags** - Can disable via DB toggles

### Monitoring:
- `/api/health` endpoint with DB check
- Audit logs for suspicious activity
- Admin view logs for compliance

---

*Generated: Phase 5-10 Strategic Enhancement Suite*
*Platform: ModEX CFO Competition*
*Version: 1.0.0*
