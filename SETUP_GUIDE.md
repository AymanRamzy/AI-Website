# MODEX Platform Setup Guide

## Quick Start

### Linux/Mac
```bash
./start.sh
```

### Windows
```bash
start.bat
```

The startup script will automatically:
- Install backend dependencies (if needed)
- Install frontend dependencies (if needed)
- Start the backend server on port 8000
- Start the frontend server on port 3000

## Manual Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip3 install -r requirements.txt

# Start the server
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm start
```

Frontend will be available at: http://localhost:3000

## Environment Variables

### Backend
The backend uses environment variables from `/backend/.env` (optional):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `CORS_ORIGINS` - Allowed CORS origins (default: *)

### Frontend
The frontend uses environment variables from `/frontend/.env`:
- `REACT_APP_BACKEND_URL` - Backend API URL (default: http://localhost:8000)

## Accessing the Application

1. **Open your browser** and navigate to http://localhost:3000
2. **Register an account** or login
3. **Explore the platform**:
   - Browse competitions
   - Create or join teams
   - Use team chat and video features

## Troubleshooting

### Backend won't start
- Check if Python 3.8+ is installed: `python3 --version`
- Check if port 8000 is available: `lsof -i :8000`
- View backend logs: `tail -f backend.log`

### Frontend won't start
- Check if Node.js 14+ is installed: `node --version`
- Check if port 3000 is available: `lsof -i :3000`
- View frontend logs: `tail -f frontend.log`
- Clear npm cache: `npm cache clean --force`

### Connection errors
- Ensure both backend and frontend are running
- Check that `REACT_APP_BACKEND_URL` in `frontend/.env` points to `http://localhost:8000`
- Check browser console for CORS errors

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

The production build will be in `frontend/build/`.

## Database

This application uses Supabase for data persistence. The database connection is configured through environment variables.

To view the database schema, check: `/supabase/migrations/`

## Support

For issues or questions, please check:
- Backend API docs: http://localhost:8000/docs
- Frontend README: `/frontend/README.md`
- Backend README: `/backend/README.md` (if available)
