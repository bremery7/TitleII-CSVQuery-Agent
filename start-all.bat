@echo off
echo Starting AI Data Agent...

REM Start backend in new window
start "Backend Server" cmd /k "cd /d c:\dev\agentkit-csv-agent && npm start"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "Frontend Server" cmd /k "cd /d c:\dev\ai-data-agent-frontend && npm run dev"

echo Both servers are starting in separate windows!
