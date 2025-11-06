# Quick Deployment Steps - AI Data Agent

## 🔥 CRITICAL: Do This First!

### 1. Create Backup
```powershell
cd c:\dev
.\create-backup.ps1
```

### 2. Change Default Passwords
Login and change these immediately:
- superadmin / SuperAdmin123!
- admin / Admin123!
- user / User123!

### 3. Generate Secrets
```powershell
# Generate NEXTAUTH_SECRET (run in PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🚀 Recommended: Railway (Easiest)

### Total Time: ~20 minutes

**Step 1: Push to GitHub**
```bash
cd c:\dev
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-data-agent.git
git push -u origin main
```

**Step 2: Deploy Backend**
1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repo → Choose `agentkit-csv-agent` folder
5. Add variables:
   - `OPENAI_API_KEY` = your-key
   - `NODE_ENV` = production
   - `PORT` = 3001
6. Copy the backend URL (e.g., `https://backend-xxx.railway.app`)

**Step 3: Deploy Frontend**
1. Same Railway project → "New Service"
2. Select your repo → Choose `ai-data-agent-frontend` folder
3. Add variables:
   - `NEXTAUTH_SECRET` = (generated secret)
   - `NEXTAUTH_URL` = (will be your frontend URL)
   - `NEXT_PUBLIC_API_URL` = (backend URL from step 2)
4. Copy the frontend URL
5. Go back and update `NEXTAUTH_URL` with frontend URL
6. Update backend's `FRONTEND_URL` with frontend URL

**Step 4: Test**
1. Visit your frontend URL
2. Login with admin credentials
3. Upload a CSV
4. Run a query

**Done!** 🎉

---

## 💰 Cost: Railway

- **Free tier:** $5 credit/month
- **Hobby plan:** $5/month (if you exceed free tier)
- **Estimated:** $5-15/month for small team

---

## 🔒 Security Checklist

Before sharing with anyone:

- [ ] Changed all default passwords
- [ ] Set strong NEXTAUTH_SECRET
- [ ] HTTPS is enabled (Railway does this automatically)
- [ ] Tested login/logout
- [ ] Tested file upload
- [ ] Tested queries
- [ ] Verified only admins can manage users
- [ ] Backed up your local system

---

## 📱 Share With Users

Once deployed, share:

**URL:** https://your-app.railway.app

**Instructions for users:**
1. Go to the URL
2. Login with credentials provided by admin
3. Upload CSV files (if admin)
4. Ask questions in natural language
5. View results and insights

---

## 🆘 If Something Goes Wrong

**Rollback:**
1. Railway → Your service → "Deployments"
2. Click on previous working deployment
3. Click "Redeploy"

**Check Logs:**
1. Railway → Your service → "Logs"
2. Look for errors

**Restore Backup:**
```powershell
# Your backup is at:
c:\dev-backup-YYYY-MM-DD_HHMMSS
```

---

## 📞 Need Help?

See full guide: `DEPLOYMENT_GUIDE.md`

**Common Issues:**
- CORS errors → Check FRONTEND_URL in backend
- Login fails → Check NEXTAUTH_SECRET and NEXTAUTH_URL
- API errors → Check NEXT_PUBLIC_API_URL in frontend
