# 🚀 Quick Start

## One Command to Rule Them All

### Linux/Mac
```bash
./start.sh
```

### Windows
```bash
start.bat
```

That's it! The platform will:
1. ✓ Check and install dependencies
2. ✓ Start backend on http://localhost:8000
3. ✓ Start frontend on http://localhost:3000
4. ✓ Open your browser automatically

## What You'll See

```
═══════════════════════════════════════════════════
✓ MODEX Platform is starting!
═══════════════════════════════════════════════════

Services:
  Frontend:  http://localhost:3000
  Backend:   http://localhost:8000
  API Docs:  http://localhost:8000/docs
```

## First Time Setup

If this is your first time:
1. Wait for both servers to start (~30 seconds)
2. Navigate to http://localhost:3000
3. Click "Register" and create an account
4. Start exploring competitions and teams!

## Troubleshooting

**Port already in use?**
```bash
# Find and kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Services won't start?**
Check the logs:
```bash
tail -f backend.log
tail -f frontend.log
```

**Need help?**
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## Stopping the Services

Press `Ctrl+C` in the terminal where you ran `./start.sh`

Or manually:
```bash
# Linux/Mac
killall -9 uvicorn node

# Windows
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```
