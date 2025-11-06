# ✅ Pre-Deployment Checklist

**Complete these steps before deploying to the cloud.**

---

## 🚨 Critical Security Steps (MUST DO)

### 1. Generate Production Secrets ⚠️

```powershell
cd c:\dev-cloud
.\generate-secrets.ps1
```

This will generate:
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`
- `SESSION_SECRET`
- `JWT_SECRET`

**Save these securely!** You'll need them for deployment.

---

### 2. Change Default Passwords ⚠️

**Current default credentials (MUST CHANGE):**

| Username | Current Password | Status |
|----------|-----------------|--------|
| superadmin | SuperAdmin123! | ⚠️ CHANGE |
| admin | Admin123! | ⚠️ CHANGE |
| user | User123! | ⚠️ CHANGE |

**How to change:**
1. Start the application locally
2. Log in as admin
3. Go to User Management
4. Change all passwords
5. OR manually edit `ai-data-agent-frontend/data/users.json`

---

### 3. Configure Environment Variables ⚠️

**Create `.env` file in root directory:**

```bash
cp .env.production.example .env
```

**Fill in these required values:**

```env
# CRITICAL - Get from OpenAI
OPENAI_API_KEY=sk-...

# CRITICAL - Use generated secrets from step 1
NEXTAUTH_SECRET=<paste-generated-secret>
AUTH_SECRET=<paste-generated-secret>
SESSION_SECRET=<paste-generated-secret>
JWT_SECRET=<paste-generated-secret>

# OPTIONAL - Email service (for password reset)
# RESEND_API_KEY=re_...
# EMAIL_FROM=noreply@yourdomain.com
```

**⚠️ NEVER commit `.env` to Git!**

---

### 4. Verify .gitignore

Ensure these files are NOT committed:

```
.env
.env.local
.env.production
*.duckdb
data/users.json
data/sso-config.json
node_modules/
```

Check your `.gitignore` file includes these patterns.

---

### 5. Test Locally with Production Config

```powershell
# Build and start with production settings
docker-compose up -d

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Test the application
# Open browser to https://localhost
# Login with your NEW admin password
# Upload a CSV file
# Run a query
# Verify everything works

# Stop services
docker-compose down
```

---

### 6. Create Backup

```powershell
.\create-backup.ps1
```

This backs up:
- User database
- DuckDB files
- CSV files
- Configuration files

**Store backup in a safe location!**

---

## 📋 Pre-Flight Checklist

Before deploying, verify each item:

### Security
- [ ] All secrets generated (32+ characters each)
- [ ] All default passwords changed
- [ ] `.env` file created and filled
- [ ] `.env` NOT committed to Git
- [ ] OpenAI API key configured
- [ ] Backup created

### Code Preparation
- [ ] Code pushed to GitHub (or Git provider)
- [ ] `.gitignore` configured correctly
- [ ] No sensitive data in repository
- [ ] Docker builds successfully locally
- [ ] Application works with production config

### Testing
- [ ] Login works with new passwords
- [ ] File upload works
- [ ] Query functionality works
- [ ] User management works
- [ ] HTTPS redirect works (in Docker)
- [ ] No console errors

### Documentation
- [ ] Admin credentials documented (securely)
- [ ] Deployment platform chosen
- [ ] Domain name purchased (if needed)
- [ ] Monitoring plan in place

---

## 🚀 Ready to Deploy?

### Option 1: Railway (Easiest - Recommended)

**Time:** 2-4 hours  
**Cost:** $10-20/month  
**Difficulty:** ⭐ Easy

**Next Steps:**
1. Create Railway account: https://railway.app
2. Connect GitHub repository
3. Deploy backend service (agentkit-csv-agent)
4. Deploy frontend service (ai-data-agent-frontend)
5. Add environment variables
6. Test deployment

**See:** `CLOUD_DEPLOYMENT_PLAN.md` for detailed Railway instructions

---

### Option 2: AWS ECS/Fargate (Most Scalable)

**Time:** 1-2 days  
**Cost:** $50-200/month  
**Difficulty:** ⭐⭐⭐ Complex

**Next Steps:**
1. Set up AWS account
2. Install AWS CLI
3. Create ECS cluster
4. Configure load balancer
5. Deploy containers
6. Set up RDS database (optional)

**See:** `CLOUD_DEPLOYMENT_PLAN.md` for AWS architecture

---

### Option 3: DigitalOcean App Platform (Balanced)

**Time:** 4-6 hours  
**Cost:** $20-60/month  
**Difficulty:** ⭐⭐ Medium

**Next Steps:**
1. Create DigitalOcean account
2. Create new App
3. Connect GitHub repository
4. Configure services
5. Add environment variables
6. Deploy

**See:** `DEPLOYMENT_GUIDE.md` for DigitalOcean instructions

---

### Option 4: Self-Hosted VPS (Maximum Control)

**Time:** 4-8 hours  
**Cost:** $10-40/month  
**Difficulty:** ⭐⭐⭐ Complex

**Next Steps:**
1. Provision VPS (Ubuntu 22.04)
2. Install Docker & Docker Compose
3. Configure firewall
4. Set up Let's Encrypt SSL
5. Deploy using docker-compose
6. Configure monitoring

**See:** `CLOUD_DEPLOYMENT_PLAN.md` for VPS setup

---

## 📞 Post-Deployment Checklist

After deploying, verify:

- [ ] Application accessible via HTTPS
- [ ] SSL certificate valid (not self-signed)
- [ ] Login works
- [ ] File upload works
- [ ] Query functionality works
- [ ] No console errors
- [ ] Security headers present (check: securityheaders.com)
- [ ] Rate limiting working
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] Domain configured (if applicable)
- [ ] DNS records correct
- [ ] Error tracking set up

---

## 🆘 Common Issues

### Issue: "Cannot connect to API"
**Solution:** 
- Check `NEXT_PUBLIC_API_URL` in frontend
- Verify backend is running
- Check CORS settings

### Issue: "Authentication failed"
**Solution:**
- Verify `JWT_SECRET` matches in frontend and backend
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies

### Issue: "OpenAI API error"
**Solution:**
- Verify `OPENAI_API_KEY` is correct
- Check API key has credits
- Verify API key permissions

### Issue: "File upload fails"
**Solution:**
- Check file size (max 500MB)
- Verify file is CSV format
- Check disk space

---

## 📚 Additional Resources

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Cloud Deployment Plan:** `CLOUD_DEPLOYMENT_PLAN.md`
- **Security Checklist:** `SECURITY-CHECKLIST.md`
- **Docker Setup:** `DOCKER_SETUP.md`
- **Main README:** `README.md`

---

## ✅ Quick Command Reference

```powershell
# Generate secrets
.\generate-secrets.ps1

# Create backup
.\create-backup.ps1

# Test locally
docker-compose up -d
docker-compose logs -f
docker-compose down

# Check running containers
docker ps

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

---

**🎯 Bottom Line:**

1. ✅ Generate secrets
2. ✅ Change passwords
3. ✅ Configure `.env`
4. ✅ Test locally
5. ✅ Create backup
6. ✅ Deploy to chosen platform
7. ✅ Test in production
8. ✅ Set up monitoring

**You're ready to deploy! 🚀**
