# AI Data Agent - Secure Deployment Guide

## Overview
This guide covers how to securely deploy your AI Data Agent application to the internet, making it accessible to authorized users while maintaining security.

---

## 🔒 Security Checklist (CRITICAL - Do Before Deployment)

### 1. Environment Variables
**Never commit these to Git!**

#### Frontend (.env.local)
```env
# Generate a strong secret (32+ characters)
NEXTAUTH_SECRET=<generate-random-32-char-string>
NEXTAUTH_URL=https://your-domain.com

# Email service (if using password reset)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=noreply@your-domain.com

# Backend API URL
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

#### Backend (.env)
```env
# OpenAI API Key
OPENAI_API_KEY=<your-openai-api-key>

# Server configuration
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com
```

### 2. Change Default Passwords
**CRITICAL:** Change all default user passwords before deployment!

Default credentials to change:
- `superadmin` / `SuperAdmin123!`
- `admin` / `Admin123!`
- `user` / `User123!`

### 3. Secure File Storage
- Move `data/users.json` to a secure location
- Set proper file permissions (read/write for app only)
- Consider using a proper database (PostgreSQL, MongoDB)

### 4. Database Security
- The DuckDB file (`entries.duckdb`) contains your data
- Ensure it's backed up regularly
- Consider encryption at rest

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend)

**Pros:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy deployment
- ✅ GitHub integration

**Cons:**
- ❌ Serverless functions have time limits
- ❌ Backend needs separate hosting

**Steps:**

1. **Prepare Frontend for Vercel**
   ```bash
   cd c:\dev\ai-data-agent-frontend
   
   # Create vercel.json
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add all environment variables from `.env.local`

### Option 2: Railway (Recommended for Full Stack)

**Pros:**
- ✅ Hosts both frontend and backend
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic HTTPS
- ✅ Database hosting
- ✅ GitHub integration

**Cons:**
- ❌ Limited free tier
- ❌ Can get expensive with scale

**Steps:**

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Deploy Backend**
   - Select `agentkit-csv-agent` folder
   - Railway will auto-detect Node.js
   - Add environment variables

4. **Deploy Frontend**
   - Create another service
   - Select `ai-data-agent-frontend` folder
   - Add environment variables

### Option 3: DigitalOcean App Platform

**Pros:**
- ✅ Full control
- ✅ Predictable pricing
- ✅ Managed databases available
- ✅ Automatic HTTPS

**Cons:**
- ❌ Minimum $5/month
- ❌ More complex setup

### Option 4: AWS (Most Scalable)

**Pros:**
- ✅ Highly scalable
- ✅ Full control
- ✅ Many services available

**Cons:**
- ❌ Complex setup
- ❌ Can be expensive
- ❌ Requires DevOps knowledge

**Services to Use:**
- **Frontend:** AWS Amplify or S3 + CloudFront
- **Backend:** Elastic Beanstalk or ECS
- **Database:** RDS (PostgreSQL) or DynamoDB
- **File Storage:** S3

### Option 5: Self-Hosted VPS (Most Control)

**Providers:**
- DigitalOcean Droplets ($6/month)
- Linode ($5/month)
- Vultr ($5/month)
- AWS EC2

**Pros:**
- ✅ Full control
- ✅ Predictable costs
- ✅ Can host everything

**Cons:**
- ❌ Requires server management
- ❌ You handle security updates
- ❌ Need to configure HTTPS

---

## 🔐 Security Best Practices

### 1. HTTPS/SSL
**CRITICAL:** Always use HTTPS in production!

**Options:**
- Let's Encrypt (Free)
- Cloudflare (Free tier includes SSL)
- Platform-provided SSL (Vercel, Railway, etc.)

### 2. Authentication
- ✅ Already using NextAuth (good!)
- ✅ Implement rate limiting on login
- ✅ Add 2FA for admin accounts (future enhancement)
- ✅ Use strong password requirements

### 3. API Security
- ✅ Already using CORS (good!)
- ✅ Add rate limiting to API endpoints
- ✅ Validate all inputs
- ✅ Use API keys for backend communication

### 4. Database Security
- ✅ Never expose database directly to internet
- ✅ Use connection pooling
- ✅ Regular backups
- ✅ Encrypt sensitive data

### 5. File Upload Security
- ✅ Validate file types (CSV only)
- ✅ Limit file sizes (already 500MB)
- ✅ Scan for malware
- ✅ Store files outside web root

### 6. Monitoring & Logging
- Set up error tracking (Sentry, LogRocket)
- Monitor API usage
- Set up alerts for suspicious activity
- Regular security audits

---

## 📦 Recommended Architecture

### Production Setup

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Users (Internet)                               │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Cloudflare (CDN + DDoS Protection)             │
│  - SSL/TLS Termination                          │
│  - Rate Limiting                                │
│  - Caching                                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js)                             │
│  - Vercel / Railway / AWS Amplify               │
│  - Port 443 (HTTPS)                             │
│  - NextAuth Session Management                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend API (Express)                          │
│  - Railway / AWS / DigitalOcean                 │
│  - Port 3001 (Internal)                         │
│  - DuckDB + OpenAI Integration                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Storage                                        │
│  - S3 / DigitalOcean Spaces (CSV files)         │
│  - Database (User data)                         │
│  - DuckDB (Query data)                          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start: Railway Deployment (Recommended)

### Step 1: Prepare Your Code

1. **Create .gitignore** (if not exists)
   ```
   node_modules/
   .env
   .env.local
   .next/
   dist/
   *.duckdb
   data/users.json
   data/sso-config.json
   ```

2. **Push to GitHub**
   ```bash
   cd c:\dev
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ai-data-agent.git
   git push -u origin main
   ```

### Step 2: Deploy Backend to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose `agentkit-csv-agent` folder
5. Add environment variables:
   ```
   OPENAI_API_KEY=your-key
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   ```
6. Deploy!

### Step 3: Deploy Frontend to Railway

1. Create new service in same project
2. Select your repository
3. Choose `ai-data-agent-frontend` folder
4. Add environment variables:
   ```
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-frontend.railway.app
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Deploy!

### Step 4: Configure Domain (Optional)

1. In Railway, go to your frontend service
2. Click "Settings" → "Domains"
3. Add custom domain or use Railway subdomain
4. Update `NEXTAUTH_URL` to match your domain

### Step 5: Test & Verify

1. Visit your frontend URL
2. Test login with admin credentials
3. Upload a CSV file
4. Run a query
5. Test user management

---

## 💰 Cost Estimates

### Minimal Setup (Small Team)
- **Railway:** $5-20/month
- **Domain:** $10-15/year
- **Total:** ~$10-25/month

### Medium Setup (Growing Team)
- **Vercel Pro:** $20/month
- **Railway:** $20-50/month
- **Database:** $15/month
- **Domain:** $10-15/year
- **Total:** ~$55-85/month

### Enterprise Setup
- **AWS/Azure:** $200-1000+/month
- **CDN:** $50-200/month
- **Monitoring:** $50-100/month
- **Total:** $300-1500+/month

---

## 🔄 Backup Strategy

### What to Backup
1. **User data** (`data/users.json`)
2. **SSO config** (`data/sso-config.json`)
3. **DuckDB database** (`entries.duckdb`)
4. **Uploaded CSV files** (`data/*.csv`)
5. **Environment variables** (store securely)

### Backup Schedule
- **Daily:** Automated database backups
- **Weekly:** Full system backup
- **Before deployment:** Always backup

### Backup Script
Run this before any major changes:
```powershell
.\create-backup.ps1
```

---

## 📋 Pre-Deployment Checklist

- [ ] Change all default passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Set up proper environment variables
- [ ] Test authentication flow
- [ ] Test file upload
- [ ] Test query functionality
- [ ] Set up error monitoring
- [ ] Configure CORS properly
- [ ] Set up SSL/HTTPS
- [ ] Create backup of current system
- [ ] Document admin credentials (securely)
- [ ] Set up monitoring/alerts
- [ ] Test on mobile devices
- [ ] Load test with expected traffic
- [ ] Create rollback plan

---

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Verify CORS configuration in `server.ts`

2. **Authentication Fails**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure cookies are enabled

3. **API Not Connecting**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend is running
   - Verify CORS settings

4. **File Upload Fails**
   - Check file size limits
   - Verify storage permissions
   - Check disk space

---

## 📞 Next Steps

1. **Run the backup script:**
   ```powershell
   cd c:\dev
   .\create-backup.ps1
   ```

2. **Choose your deployment platform**
   - Railway (easiest)
   - Vercel + separate backend
   - Self-hosted VPS

3. **Follow the deployment steps** for your chosen platform

4. **Test thoroughly** before sharing with users

5. **Set up monitoring** to catch issues early

---

## 🔗 Useful Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Let's Encrypt SSL](https://letsencrypt.org/)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

**Remember:** Security is not a one-time task. Regularly update dependencies, monitor for vulnerabilities, and keep backups current.
