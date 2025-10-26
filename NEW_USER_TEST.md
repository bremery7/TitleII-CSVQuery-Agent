# New User Testing Guide

## Test as a Fresh GitHub Clone

This guide simulates a new user experience pulling from GitHub.

### Prerequisites
- Node.js 20+
- Git
- OpenAI API Key
- Docker Desktop (optional, for Docker testing)

### Step 1: Clone from GitHub

```powershell
# Navigate to your temp folder
cd $env:TEMP\your-test-folder

# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2: Generate Secrets

```powershell
# Generate JWT secrets
.\generate-secrets.ps1
```

This will output two secrets - save them for the next steps.

### Step 3: Configure Backend

```powershell
# Copy environment template
cd agentkit-csv-agent
copy .env.example .env

# Edit .env and add:
# - OPENAI_API_KEY=your_openai_key_here
# - JWT_SECRET=<secret from generate-secrets.ps1>
# - PORT=3001
# - FRONTEND_URL=http://localhost:3000
```

### Step 4: Configure Frontend

```powershell
# Copy environment template
cd ..\ai-data-agent-frontend
copy .env.example .env.local

# Edit .env.local and add:
# - NEXTAUTH_SECRET=<secret from generate-secrets.ps1>
# - JWT_SECRET=<same as backend JWT_SECRET>
# - NEXT_PUBLIC_API_URL=http://localhost:3001
# - NEXTAUTH_URL=http://localhost:3000
```

### Step 5: Install Dependencies

```powershell
# Install backend dependencies
cd ..\agentkit-csv-agent
npm install

# Install frontend dependencies
cd ..\ai-data-agent-frontend
npm install
```

### Step 6: Start the Application

```powershell
# Option 1: Use the startup script (from root)
cd ..
.\start-all.bat

# Option 2: Start manually
# Terminal 1 - Backend:
cd agentkit-csv-agent
npm run dev

# Terminal 2 - Frontend:
cd ai-data-agent-frontend
npm run dev
```

### Step 7: Test the Application

1. **Open browser**: http://localhost:3000
2. **Login**: 
   - Username: `admin`
   - Password: `admin123`
3. **Upload a CSV file**
4. **Query your data** using natural language
5. **Export results** to Excel

### Step 8: Verify Everything Works

**Backend Health Check**:
```powershell
Invoke-RestMethod -Uri http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Docker Testing (Alternative)

If you want to test the full Docker deployment:

```powershell
# 1. Configure production environment
copy .env.production.example .env

# Edit .env and add all secrets:
# - OPENAI_API_KEY
# - JWT_SECRET
# - NEXTAUTH_SECRET
# - POSTGRES_PASSWORD (if using)

# 2. Start with Docker
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Access application
# Open: https://localhost
# Login: admin / admin123

# 5. Stop when done
docker-compose down
```

## Common Issues

### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F
```

### Dependencies Not Installing
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### Environment Variables Not Loading
- Make sure `.env` files are in the correct directories
- Restart the dev servers after changing `.env` files
- Check for typos in variable names

## Clean Up After Testing

```powershell
# Stop all processes (Ctrl+C in terminals)

# Remove test folder
cd ..
rm -r -force YOUR_REPO_NAME
```

## What to Test

- [ ] Clone repository successfully
- [ ] Generate secrets
- [ ] Install dependencies (no errors)
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Login to application
- [ ] Upload CSV file
- [ ] Query data with natural language
- [ ] View results in table
- [ ] Export to Excel
- [ ] Logout

## Expected Behavior

✅ **Success Indicators**:
- Backend starts on port 3001
- Frontend starts on port 3000
- No console errors
- Login works
- CSV upload works
- Queries return results
- Charts render properly

❌ **Failure Indicators**:
- Port conflicts
- Missing environment variables
- OpenAI API errors (check API key)
- Authentication failures (check JWT_SECRET matches)
- CORS errors (check FRONTEND_URL)

## Notes

- Default credentials should be changed in production
- This is a development setup - see DEPLOYMENT.md for production
- Keep your OpenAI API key secure
- CSV files are stored in `agentkit-csv-agent/uploads/`
