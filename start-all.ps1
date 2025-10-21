# Start both frontend and backend servers
Write-Host "Starting AI Data Agent..." -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\dev\agentkit-csv-agent; Write-Host 'Starting Backend...' -ForegroundColor Green; npm start"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\dev\ai-data-agent-frontend; Write-Host 'Starting Frontend...' -ForegroundColor Blue; npm run dev"

Write-Host "Both servers are starting in separate windows!" -ForegroundColor Cyan
