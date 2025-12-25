# ModEX Platform

## Overview
ModEX is a financial modeling excellence platform that provides training, consulting, competitions, and community features for finance professionals. Built with a React frontend and Python FastAPI backend with Supabase integration.

## Project Structure
```
├── frontend/           # React frontend (Create React App with CRACO)
│   ├── src/
│   │   ├── components/ # UI components (Radix UI based)
│   │   ├── pages/      # Page components (including AdminDashboard)
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom hooks
│   │   └── lib/        # Utility functions
│   ├── public/         # Static assets
│   └── plugins/        # CRACO plugins
├── backend/            # Python FastAPI backend
│   ├── server.py       # Main FastAPI application
│   ├── cfo_competition.py # CFO Competition API
│   ├── admin_router.py # Admin dashboard API endpoints
│   ├── auth.py         # Authentication logic (with admin role check)
│   ├── models.py       # Pydantic models
│   ├── chat_service.py # Chat API endpoints
│   ├── socketio_server.py # Socket.IO server
│   └── supabase_client.py # Supabase client
└── supabase/           # Database migrations
    └── migrations/     # SQL migration files
```

## Tech Stack

### Frontend
- React 18
- Create React App with CRACO
- Tailwind CSS
- Radix UI components
- React Router v7

### Backend
- Python 3.11
- FastAPI
- Supabase (PostgreSQL)
- Uvicorn

## Running the Project

The backend serves both the API and the frontend static files on port 5000.

### Production (Backend serves frontend)
```bash
cd frontend && npm run build  # Build frontend first
cd backend && uvicorn server:app --host 0.0.0.0 --port 5000
```

### Local Development (separate servers)
For local development with hot reload, set `REACT_APP_BACKEND_URL` to point to the backend:
```bash
# Terminal 1 - Backend
cd backend && uvicorn server:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend (with env var)
cd frontend && REACT_APP_BACKEND_URL=http://localhost:8000 npm start
```

## Supabase Configuration (REQUIRED)

### Environment Variables (Already Set)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase API key
- `REACT_APP_BACKEND_URL` - Backend API URL

### Database Setup
Run BOTH SQL migrations in your Supabase SQL Editor:

1. **Initial Schema** - `supabase/migrations/20251217094222_create_initial_schema.sql`
2. **Admin Features** - `supabase/migrations/20251218_add_cfo_applications_admin.sql`

Tables created:
- `user_profiles` - User accounts with role and CFO qualification status
- `competitions` - Competition listings
- `competition_participants` - User registrations
- `teams` - Competition teams
- `team_members` - Team membership
- `cfo_applications` - CFO qualification applications with scoring
- `judge_assignments` - Judge-to-competition assignments
- `tasks` - Competition tasks
- `submissions` - Team submissions
- `scores` - Judge scoring
- `admin_audit_log` - Admin action tracking

## API Endpoints

### Authentication
- `POST /api/cfo/auth/register` - Register new user
- `POST /api/cfo/auth/login` - Login user
- `GET /api/cfo/auth/me` - Get current user

### Competitions
- `GET /api/cfo/competitions` - List all competitions
- `GET /api/cfo/competitions/{id}` - Get competition details
- `POST /api/cfo/competitions/{id}/register` - Register for competition

### Teams
- `POST /api/cfo/teams` - Create new team
- `POST /api/cfo/teams/join` - Join existing team
- `GET /api/cfo/teams/my-team` - Get user's current team

### Admin (requires admin role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/{id}` - Update user role
- `GET /api/admin/competitions` - List competitions
- `POST /api/admin/competitions` - Create competition
- `PATCH /api/admin/competitions/{id}` - Update competition
- `DELETE /api/admin/competitions/{id}` - Delete competition
- `GET /api/admin/cfo-applications` - List CFO applications
- `PATCH /api/admin/cfo-applications/{id}` - Review application (approve/reject)
- `POST /api/admin/cfo-applications/bulk-approve` - Auto-approve top N applicants
- `GET /api/admin/judges` - List judges
- `POST /api/admin/judge-assignments` - Assign judge to competition

## User Roles
- `participant` - Default role, can join competitions
- `judge` - Can score submissions
- `admin` - Full access to admin dashboard

## User Flows

### Participant Flow
1. Register/Login → Dashboard
2. View competitions → Register for competition
3. Create or Join Team → Submit work

### Admin Flow
1. Login as admin → Navigate to /admin
2. Manage users, competitions, CFO applications, judges

## Recent Changes (Dec 2024)
- Added Admin Dashboard with user/competition/CFO application management
- Added CFO application system with auto-scoring
- Added judge assignment system
- Added admin role authorization
- Fixed all LSP type errors
- Fixed CORS/proxy issues - backend now serves frontend static files
- Improved registration endpoint with better error handling
- Login endpoint auto-creates missing user profiles
- All frontend API calls use configurable REACT_APP_BACKEND_URL with same-origin fallback
