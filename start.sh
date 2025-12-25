#!/bin/bash

# MODEX Platform Startup Script
# This script starts both the backend (FastAPI) and frontend (React) services

set -e

echo "🚀 Starting MODEX Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Check if backend dependencies are installed
echo -e "${BLUE}Checking backend dependencies...${NC}"
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    pip3 install --break-system-packages -r requirements.txt
    cd ..
fi

# Check if frontend dependencies are installed
echo -e "${BLUE}Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install --legacy-peer-deps
    cd ..
fi

# Start backend server
echo ""
echo -e "${GREEN}✓ Starting Backend Server (Port 8000)...${NC}"
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}Warning: Backend may not be ready yet${NC}"
    fi
    sleep 1
done

# Start frontend server
echo ""
echo -e "${GREEN}✓ Starting Frontend Server (Port 3000)...${NC}"
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ MODEX Platform is starting!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  Backend:   tail -f backend.log"
echo "  Frontend:  tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait
