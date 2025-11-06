# 🚂 Railway Deployment Guide

**Deploy your AI Data Agent to Railway in under 2 hours.**

Railway is the recommended platform for quick, secure cloud deployment with minimal configuration.

---

## 🎯 Why Railway?

- ✅ **Docker Support** - Use your existing containers
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Free Tier** - $5 credit/month to start
- ✅ **GitHub Integration** - Deploy on push
- ✅ **Simple Environment Variables** - Easy configuration
- ✅ **Persistent Volumes** - Data persists across deployments
- ✅ **Built-in Monitoring** - Logs and metrics included

**Cost:** $10-30/month (after free tier)

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Completed `PRE_DEPLOYMENT_CHECKLIST.md`
- [ ] Generated production secrets
- [ ] Changed default passwords
- [ ] Created backup
- [ ] GitHub account
- [ ] Code pushed to GitHub repository

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

**1.1 Push to GitHub (if not already done)**

```powershell
cd c:\dev-cloud

# Initialize Git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Railway deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/ai-data-agent.git

# Push to GitHub
git push -u origin main
```

**1.2 Verify .gitignore**

Ensure these are NOT in your repository:
- `.env`
- `.env.local`
- `*.duckdb`
- `data/users.json`
- `node_modules/`

---

### Step 2: Create Railway Account

**2.1 Sign Up**
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

**2.2 Verify Account**
- You'll get $5 free credit per month
- Add payment method for usage beyond free tier

---

### Step 3: Create New Project

**3.1 Create Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `ai-data-agent` repository
4. Railway will scan your repository

---

### Step 4: Deploy Backend Service

**4.1 Add Backend Service**
1. Click "New Service"
2. Select "GitHub Repo"
3. Choose your repository
4. Set **Root Directory:** `agentkit-csv-agent`
5. Railway will auto-detect Dockerfile

**4.2 Configure Backend Environment Variables**

Click on the backend service → "Variables" tab

Add these variables:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=<your-openai-api-key>
JWT_SECRET=<your-generated-jwt-secret>
FRONTEND_URL=https://${RAILWAY_PUBLIC_DOMAIN}
```

**Note:** `FRONTEND_URL` will be updated after frontend deployment

**4.3 Configure Backend Settings**

1. Go to "Settings" tab
2. **Health Check Path:** `/api/health`
3. **Restart Policy:** Always
4. Click "Deploy"

**4.4 Get Backend URL**

1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://backend-production-xxxx.up.railway.app`)
4. Save this for frontend configuration

---

### Step 5: Deploy Frontend Service

**5.1 Add Frontend Service**
1. Click "New Service" in your project
2. Select "GitHub Repo"
3. Choose your repository
4. Set **Root Directory:** `ai-data-agent-frontend`
5. Railway will auto-detect Dockerfile

**5.2 Configure Frontend Environment Variables**

Click on the frontend service → "Variables" tab

Add these variables:

```env
NODE_ENV=production
NEXTAUTH_SECRET=<your-generated-nextauth-secret>
AUTH_SECRET=<your-generated-auth-secret>
SESSION_SECRET=<your-generated-session-secret>
JWT_SECRET=<your-generated-jwt-secret>
NEXTAUTH_URL=https://${RAILWAY_PUBLIC_DOMAIN}
NEXT_PUBLIC_API_URL=<backend-url-from-step-4.4>
```

**Important:** Replace `<backend-url-from-step-4.4>` with actual backend URL

**5.3 Configure Frontend Settings**

1. Go to "Settings" tab
2. **Health Check Path:** `/` (or leave empty)
3. **Restart Policy:** Always
4. Click "Deploy"

**5.4 Get Frontend URL**

1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://frontend-production-xxxx.up.railway.app`)
4. This is your application URL!

---

### Step 6: Update Backend CORS

**6.1 Update Backend Environment**

Go back to backend service → "Variables" tab

Update `FRONTEND_URL` with the actual frontend URL:

```env
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
```

**6.2 Redeploy Backend**

Click "Deploy" to apply changes

---

### Step 7: Configure Persistent Volumes

**7.1 Backend Volume (for DuckDB and CSV files)**

1. Go to backend service
2. Click "Volumes" tab
3. Click "New Volume"
4. **Mount Path:** `/app/data`
5. Click "Add"

**7.2 Frontend Volume (for user data)**

1. Go to frontend service
2. Click "Volumes" tab
3. Click "New Volume"
4. **Mount Path:** `/app/data`
5. Click "Add"

**Note:** Volumes persist data across deployments

---

### Step 8: Configure Custom Domain (Optional)

**8.1 Add Custom Domain**

1. Purchase domain from Namecheap, Google Domains, etc.
2. In Railway frontend service → "Settings" → "Domains"
3. Click "Custom Domain"
4. Enter your domain (e.g., `app.yourdomain.com`)

**8.2 Configure DNS**

Add CNAME record in your domain provider:

```
Type: CNAME
Name: app (or your subdomain)
Value: <railway-provided-value>
TTL: 3600
```

**8.3 Update Environment Variables**

Update `NEXTAUTH_URL` in frontend:

```env
NEXTAUTH_URL=https://app.yourdomain.com
```

Update `FRONTEND_URL` in backend:

```env
FRONTEND_URL=https://app.yourdomain.com
```

Redeploy both services.

---

### Step 9: Test Your Deployment

**9.1 Access Application**

Open your Railway frontend URL in browser:
- Railway domain: `https://frontend-production-xxxx.up.railway.app`
- OR custom domain: `https://app.yourdomain.com`

**9.2 Test Functionality**

- [ ] HTTPS is working (green padlock)
- [ ] Login page loads
- [ ] Login with admin credentials works
- [ ] Dashboard loads
- [ ] Upload CSV file
- [ ] Run a query
- [ ] Results display correctly
- [ ] Export to Excel works
- [ ] User management works

**9.3 Check Security Headers**

Visit: https://securityheaders.com

Enter your Railway URL and verify security headers are present.

---

### Step 10: Set Up Monitoring

**10.1 Railway Built-in Monitoring**

Railway provides:
- **Logs:** View in "Deployments" tab
- **Metrics:** CPU, Memory, Network usage
- **Alerts:** Configure in project settings

**10.2 Add External Monitoring (Recommended)**

**Sentry (Error Tracking):**
1. Sign up at https://sentry.io
2. Create new project
3. Get DSN
4. Add to environment variables:
   ```env
   SENTRY_DSN=<your-sentry-dsn>
   ```
5. Update code to use Sentry (optional enhancement)

**UptimeRobot (Uptime Monitoring):**
1. Sign up at https://uptimerobot.com
2. Add new monitor
3. Enter your Railway URL
4. Set check interval (5 minutes)
5. Configure alerts

---

## 💰 Cost Management

### Free Tier
- $5 credit per month
- Covers small deployments
- ~500 hours of service time

### Paid Usage
- **Starter:** $5/month (after free credit)
- **Pro:** $20/month (more resources)
- **Pay as you go:** Based on usage

**Typical Costs:**
- Small team (< 100 users): $10-20/month
- Medium team (100-1000 users): $20-50/month
- Large team (1000+ users): $50-100+/month

### Cost Optimization Tips
1. Use sleep mode for non-production environments
2. Monitor resource usage regularly
3. Optimize Docker images (smaller = cheaper)
4. Use caching effectively
5. Set up usage alerts

---

## 🔧 Troubleshooting

### Issue: Deployment Fails

**Check:**
1. Build logs in Railway dashboard
2. Dockerfile syntax
3. Environment variables set correctly
4. Port configuration (3000 for frontend, 3001 for backend)

**Solution:**
```bash
# Test Docker build locally
cd agentkit-csv-agent
docker build -t backend-test .

cd ../ai-data-agent-frontend
docker build -t frontend-test .
```

---

### Issue: "Cannot connect to API"

**Check:**
1. Backend service is running
2. `NEXT_PUBLIC_API_URL` in frontend matches backend URL
3. CORS configured correctly in backend

**Solution:**
- Verify backend URL in frontend environment variables
- Check backend logs for CORS errors
- Ensure `FRONTEND_URL` in backend matches frontend URL

---

### Issue: "Authentication Failed"

**Check:**
1. `JWT_SECRET` matches in frontend and backend
2. `NEXTAUTH_SECRET` is set in frontend
3. Cookies are enabled in browser

**Solution:**
- Verify all secrets are set correctly
- Clear browser cookies
- Check browser console for errors

---

### Issue: "File Upload Fails"

**Check:**
1. Volume mounted correctly (`/app/data`)
2. Disk space available
3. File size under 500MB

**Solution:**
- Check volume configuration in Railway
- Monitor disk usage
- Check backend logs

---

### Issue: "Database Connection Error"

**Check:**
1. DuckDB file path correct
2. Volume persisting data
3. Permissions correct

**Solution:**
- Verify volume mount path
- Check backend logs
- Restart backend service

---

## 📊 Monitoring & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Verify backups

### Weekly
- [ ] Review resource usage
- [ ] Check for security updates
- [ ] Review user activity

### Monthly
- [ ] Update dependencies
- [ ] Review costs
- [ ] Test backup restoration
- [ ] Security audit

---

## 🔄 Updating Your Application

### Deploy New Changes

**Option 1: Automatic (Recommended)**
1. Push changes to GitHub
2. Railway auto-deploys on push
3. Monitor deployment in Railway dashboard

**Option 2: Manual**
1. Go to Railway dashboard
2. Click service → "Deployments"
3. Click "Deploy"

### Rollback

If deployment fails:
1. Go to "Deployments" tab
2. Find previous successful deployment
3. Click "Redeploy"

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit secrets to Git
- ✅ Use Railway's environment variable management
- ✅ Rotate secrets quarterly
- ✅ Use different secrets for dev/staging/prod

### Access Control
- ✅ Limit Railway project access
- ✅ Use strong passwords
- ✅ Enable 2FA on Railway account
- ✅ Review access logs regularly

### Monitoring
- ✅ Set up error alerts
- ✅ Monitor failed login attempts
- ✅ Track API usage
- ✅ Review security logs

---

## 📞 Getting Help

### Railway Support
- **Documentation:** https://docs.railway.app
- **Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

### Application Issues
- Check `DEPLOYMENT_GUIDE.md`
- Review `SECURITY-CHECKLIST.md`
- Check Docker logs
- Review error messages

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Application accessible via HTTPS
- [ ] SSL certificate valid
- [ ] Login works with new passwords
- [ ] File upload works
- [ ] Query functionality works
- [ ] User management works
- [ ] No console errors
- [ ] Security headers present
- [ ] Monitoring configured
- [ ] Backups set up
- [ ] Domain configured (if applicable)
- [ ] Team members can access
- [ ] Documentation updated

---

## 🎉 Success!

Your AI Data Agent is now running on Railway!

**Next Steps:**
1. Share URL with team
2. Set up automated backups
3. Configure monitoring alerts
4. Plan for scaling (if needed)
5. Consider custom domain
6. Review security regularly

**Your Application URL:**
- Railway: `https://frontend-production-xxxx.up.railway.app`
- Custom: `https://app.yourdomain.com` (if configured)

---

## 🚀 Advanced: Staging Environment

Create a staging environment for testing:

1. Create new Railway project
2. Deploy same services
3. Use different environment variables
4. Test changes before production
5. Use GitHub branches for staging

**Benefits:**
- Test changes safely
- Catch bugs before production
- Train users on new features

---

**Need help?** Check the Railway Discord or review the deployment logs in the Railway dashboard.

**Ready for production?** Make sure you've completed the post-deployment checklist above!
