# API Connection Fix - Completed

## Date: November 4, 2025

## Problem Identified
The frontend was calling backend APIs (upload, files, database-info, query) on `localhost:3000` (Next.js) instead of `localhost:3001` (Express backend), resulting in 404 errors.

## Root Cause
All backend API calls were using relative paths like `/api/upload` instead of using the `NEXT_PUBLIC_API_URL` environment variable to point to the Express backend server.

## Files Fixed

### 1. `components/MultiFileUpload.tsx`
**Changed:** `/api/upload` → `${apiUrl}/api/upload`
- Now uses `NEXT_PUBLIC_API_URL` environment variable
- Falls back to `http://localhost:3001` if not set

### 2. `components/FileManager.tsx`
**Changed:** 
- `/api/files` (GET) → `${apiUrl}/api/files`
- `/api/files` (DELETE) → `${apiUrl}/api/files`

### 3. `components/DatabaseInfo.tsx`
**Changed:** `/api/database-info` → `${apiUrl}/api/database-info`

### 4. `app/page.tsx`
**Changed:**
- `/api/database-info` → `${apiUrl}/api/database-info`
- `/api/query` → `${apiUrl}/api/query`
- `/api/upload` → `${apiUrl}/api/upload`

## API Routing Architecture

### Frontend (Next.js - Port 3000)
Handles authentication and user management:
- ✅ `/api/auth/[...nextauth]` - NextAuth authentication
- ✅ `/api/users` - User management (admin only)
- ✅ `/api/users/[id]` - Update user
- ✅ `/api/change-password` - Change password
- ✅ `/api/sso-status` - SSO configuration status

### Backend (Express - Port 3001)
Handles data operations:
- ✅ `/api/upload` - CSV file upload
- ✅ `/api/files` - List/delete uploaded files
- ✅ `/api/database-info` - Database schema information
- ✅ `/api/query` - Natural language queries

## Environment Configuration

The `.env.local` file contains:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

This tells the frontend where to find the backend API.

## Starting the Application

### Option 1: Use the start script
```powershell
cd c:\dev
.\start-all.bat
```
This starts both servers in separate windows.

### Option 2: Manual start
```powershell
# Terminal 1 - Backend
cd c:\dev\agentkit-csv-agent
npm start

# Terminal 2 - Frontend
cd c:\dev\ai-data-agent-frontend
npm run dev
```

## Verification Checklist

After starting both servers, verify:

1. **Backend running on port 3001**
   - Check terminal for "Server running on port 3001"
   - Test: `http://localhost:3001/api/database-info`

2. **Frontend running on port 3000**
   - Check terminal for "Ready on http://localhost:3000"
   - Open browser to `http://localhost:3000`

3. **Features working:**
   - ✅ Login/logout
   - ✅ Upload CSV files
   - ✅ View uploaded files
   - ✅ Delete files
   - ✅ View database info
   - ✅ Query data
   - ✅ Manage users (admin only)

## Troubleshooting

### "Upload failed" or 404 errors
- **Cause**: Backend server not running
- **Solution**: Start the backend server on port 3001

### "Manage Users" page is blank
- **Cause**: This is correct! User management calls Next.js APIs, not backend
- **Solution**: This should work now (it's a different API)

### CORS errors
- **Cause**: Backend not configured to accept requests from frontend
- **Solution**: Check backend CORS configuration allows `http://localhost:3000`

### Connection refused
- **Cause**: Backend server crashed or not started
- **Solution**: Check backend terminal for errors, restart if needed

## Next Steps

1. **Start both servers** using `start-all.bat` or manually
2. **Refresh your browser** to load the updated frontend code
3. **Test upload functionality** - should now work
4. **Test user management** - should show user list

## Status: ✅ FIXED

All API calls now correctly route to the backend server. You just need to ensure both servers are running.
