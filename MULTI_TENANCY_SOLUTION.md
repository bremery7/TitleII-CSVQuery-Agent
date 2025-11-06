# 🏢 Multi-Tenancy Solution for AI Data Agent

## Overview

You want to support **multiple isolated instances** where each customer/group has:
- Their own users
- Their own CSV files
- Their own data (completely separate)
- No visibility into other instances

This is called **multi-tenancy**, and there are **3 approaches** to implement this.

---

## 🎯 Your Requirements

### Example Scenario
- **Customer A:** 3 users, 5 CSV files
- **Customer B:** 2 users, 2 CSV files
- **Requirement:** Complete isolation between customers

---

## 📊 Solution Comparison

| Approach | Isolation | Cost | Complexity | Recommended For |
|----------|-----------|------|------------|----------------|
| **1. Multiple Railway Projects** | ✅ Complete | 💰💰💰 High | ⭐ Easy | 2-5 customers |
| **2. Tenant ID in Single App** | ⚠️ Logical | 💰 Low | ⭐⭐ Medium | 5-50 customers |
| **3. Subdomain Routing** | ✅ Complete | 💰💰 Medium | ⭐⭐⭐ Complex | 10+ customers |

---

## 🚀 Solution 1: Multiple Railway Projects (RECOMMENDED)

### How It Works
Deploy a **separate instance** of your application for each customer on Railway.

```
Customer A:
  - Railway Project: "customer-a-ai-agent"
  - URL: https://customer-a.railway.app
  - Users: 3 users in their own users.json
  - Data: 5 CSV files in their own data folder
  - Database: Their own entries.duckdb

Customer B:
  - Railway Project: "customer-b-ai-agent"
  - URL: https://customer-b.railway.app
  - Users: 2 users in their own users.json
  - Data: 2 CSV files in their own data folder
  - Database: Their own entries.duckdb
```

### ✅ Pros
- **Complete isolation** - No code changes needed
- **Simple to implement** - Just deploy multiple times
- **Secure** - Impossible for data to leak between customers
- **Independent scaling** - Each customer can have different resources
- **Easy to manage** - Each customer is a separate Railway project
- **Custom domains** - Each customer can have their own domain

### ❌ Cons
- **Higher cost** - Pay for each instance ($10-20/month per customer)
- **Manual deployment** - Need to deploy for each new customer
- **Duplicate code** - Each instance runs the same code

### 💰 Cost
- **Per customer:** $10-20/month
- **5 customers:** $50-100/month
- **10 customers:** $100-200/month

### 🛠️ Implementation Steps

**Step 1: Deploy First Customer**
```powershell
# Deploy for Customer A
cd c:\dev-cloud
git checkout -b customer-a
# Update environment variables for Customer A
# Deploy to Railway as "customer-a-ai-agent"
```

**Step 2: Deploy Second Customer**
```powershell
# Deploy for Customer B
git checkout -b customer-b
# Update environment variables for Customer B
# Deploy to Railway as "customer-b-ai-agent"
```

**Step 3: Manage Customers**
- Each customer gets their own Railway project
- Each customer gets their own URL
- Each customer manages their own users
- You can set up custom domains per customer

### 📋 Management
Create a simple spreadsheet to track customers:

| Customer | Railway Project | URL | Users | Status |
|----------|----------------|-----|-------|--------|
| Customer A | customer-a-ai-agent | https://customer-a.railway.app | 3 | Active |
| Customer B | customer-b-ai-agent | https://customer-b.railway.app | 2 | Active |

### ⚡ Quick Start (This Approach)

**For each new customer:**
1. Create new Railway project
2. Deploy your code
3. Set environment variables
4. Give customer their URL
5. Customer creates their own users
6. Customer uploads their own CSV files

**Time per customer:** 30 minutes  
**Maintenance:** Minimal

---

## 🔧 Solution 2: Tenant ID in Single App (Code Changes Required)

### How It Works
Modify the application to support multiple tenants in a **single deployment**.

```
Single Railway Deployment:
  - URL: https://ai-agent.railway.app
  
Data Structure:
  /data/
    /tenant-a/
      users.json
      entries.duckdb
      file1.csv
      file2.csv
    /tenant-b/
      users.json
      entries.duckdb
      file1.csv
```

### Changes Required

**1. Add Tenant ID to User Model**
```typescript
// lib/users.ts
export interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  tenantId: string; // NEW
  createdAt: string;
}
```

**2. Modify Authentication**
```typescript
// Login flow must capture tenant ID
// Option A: Subdomain (tenant-a.yourdomain.com)
// Option B: Login form field (user enters tenant ID)
// Option C: Email domain mapping (user@companya.com → tenant-a)
```

**3. Modify File Storage**
```typescript
// server.ts
const dataFolderPath = path.resolve(`./data/${tenantId}`);
const dbPath = path.resolve(`./data/${tenantId}/entries.duckdb`);
```

**4. Add Tenant Middleware**
```typescript
// middleware/tenant.ts
export function extractTenant(req, res, next) {
  // Get tenant from subdomain, token, or session
  req.tenantId = getTenantFromRequest(req);
  next();
}
```

### ✅ Pros
- **Lower cost** - Single deployment for all customers
- **Centralized management** - One codebase to maintain
- **Easier updates** - Deploy once, updates all customers

### ❌ Cons
- **Complex implementation** - Requires significant code changes
- **Logical isolation only** - Bug could leak data between tenants
- **Single point of failure** - If app goes down, all customers affected
- **Shared resources** - One customer's load affects others

### 💰 Cost
- **Total:** $20-50/month (regardless of customer count)
- **Per customer:** Decreases as you add more

### 🛠️ Implementation Effort
- **Development time:** 2-3 days
- **Testing time:** 1-2 days
- **Risk:** Medium (data isolation bugs)

---

## 🌐 Solution 3: Subdomain Routing with Separate Containers

### How It Works
Use a **reverse proxy** to route subdomains to separate container instances.

```
Nginx/Traefik Reverse Proxy:
  customer-a.yourdomain.com → Container 1 (Customer A)
  customer-b.yourdomain.com → Container 2 (Customer B)
  customer-c.yourdomain.com → Container 3 (Customer C)
```

### Architecture
```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (Nginx/Traefik)│
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
    │  Container 1  │  │ Container 2  │  │ Container 3 │
    │  Customer A   │  │ Customer B   │  │ Customer C  │
    │  3 users      │  │ 2 users      │  │ 5 users     │
    │  5 CSV files  │  │ 2 CSV files  │  │ 3 CSV files │
    └───────────────┘  └──────────────┘  └─────────────┘
```

### ✅ Pros
- **Complete isolation** - Separate containers per customer
- **Professional appearance** - Custom subdomains
- **Moderate cost** - Shared infrastructure
- **Scalable** - Can add customers easily

### ❌ Cons
- **Complex setup** - Requires reverse proxy configuration
- **DevOps knowledge** - Need to manage infrastructure
- **Not available on Railway free tier** - Need VPS or Kubernetes

### 💰 Cost
- **VPS/Kubernetes:** $40-100/month
- **Per customer:** Marginal cost

### 🛠️ Implementation
Requires:
- VPS or Kubernetes cluster
- Nginx/Traefik configuration
- Docker Compose or Kubernetes manifests
- Domain with wildcard DNS

---

## 🎯 Recommendation: Solution 1 (Multiple Railway Projects)

### Why This is Best for You

**1. Quick to Implement**
- No code changes required
- Deploy today using existing setup
- 30 minutes per customer

**2. Complete Security**
- Physical isolation between customers
- No risk of data leakage
- Each customer has own database

**3. Easy to Manage**
- Simple to add new customers
- Easy to remove customers
- Independent scaling

**4. Cost Effective for Small Scale**
- If you have 2-10 customers: $20-200/month
- Predictable pricing
- Can charge customers more than it costs

**5. Professional**
- Each customer gets own URL
- Can set up custom domains
- Looks professional

### When to Switch

**Switch to Solution 2 (Tenant ID) when:**
- You have 20+ customers
- Cost becomes prohibitive
- You need centralized management
- You have development resources

**Switch to Solution 3 (Subdomain Routing) when:**
- You have 50+ customers
- You need professional infrastructure
- You have DevOps team
- Cost optimization is critical

---

## 📋 Implementation Plan (Solution 1)

### Phase 1: Deploy First Customer (Today)

**Step 1: Prepare Repository**
```powershell
cd c:\dev-cloud

# Create a customers tracking document
New-Item -Path "CUSTOMERS.md" -ItemType File
```

**Step 2: Deploy Customer A**
1. Go to Railway.app
2. Create new project: "customer-a-ai-agent"
3. Deploy backend and frontend
4. Set environment variables
5. Note the URL: `https://customer-a-production-xxxx.railway.app`

**Step 3: Set Up Customer A**
1. Give customer the URL
2. Customer logs in with admin/admin123
3. Customer changes password
4. Customer creates their 3 users
5. Customer uploads their 5 CSV files

**Step 4: Document**
Update `CUSTOMERS.md`:
```markdown
# Customer Tracking

## Customer A
- **Railway Project:** customer-a-ai-agent
- **URL:** https://customer-a-production-xxxx.railway.app
- **Users:** 3
- **CSV Files:** 5
- **Status:** Active
- **Deployed:** 2025-11-04
```

### Phase 2: Deploy Customer B (Tomorrow)

Repeat the same process:
1. Create new Railway project: "customer-b-ai-agent"
2. Deploy backend and frontend
3. Set environment variables
4. Give customer their URL
5. Document in `CUSTOMERS.md`

### Phase 3: Automate (Optional)

Create a deployment script:
```powershell
# deploy-customer.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$CustomerName
)

Write-Host "Deploying for customer: $CustomerName"
# Script to automate Railway deployment
# (Railway CLI commands)
```

---

## 💡 Pricing Strategy

### Cost Analysis
- **Your cost per customer:** $10-20/month
- **Your time per customer:** 30 minutes setup

### Pricing Options

**Option 1: Fixed Monthly Fee**
- Charge $50-100/month per customer
- Covers your costs + profit
- Simple for customers

**Option 2: Tiered Pricing**
- **Small:** $50/month (up to 5 users, 10 CSV files)
- **Medium:** $100/month (up to 10 users, 25 CSV files)
- **Large:** $200/month (unlimited)

**Option 3: Per-User Pricing**
- $20/user/month
- Customer A (3 users): $60/month
- Customer B (2 users): $40/month

### Profit Margin
- **Cost:** $10-20/month
- **Charge:** $50-100/month
- **Profit:** $30-80/month per customer
- **10 customers:** $300-800/month profit

---

## 🔐 Security Considerations

### Solution 1 (Multiple Projects) - SECURE ✅
- **Data isolation:** Complete (separate databases)
- **User isolation:** Complete (separate user files)
- **Network isolation:** Complete (separate deployments)
- **Risk of data leakage:** None
- **Compliance:** Easy (data is physically separated)

### Solution 2 (Tenant ID) - REQUIRES CARE ⚠️
- **Data isolation:** Logical only
- **User isolation:** Code-enforced
- **Network isolation:** None
- **Risk of data leakage:** Medium (if bugs exist)
- **Compliance:** Harder (need to prove isolation)

---

## 🚀 Quick Start Guide

### Deploy Your First Customer Today

**1. Complete Pre-Deployment Checklist**
```powershell
cd c:\dev-cloud
.\generate-secrets.ps1
# Change default passwords
# Create .env file
```

**2. Deploy to Railway**
- Follow `RAILWAY_DEPLOYMENT.md`
- Name project: "customer-a-ai-agent"
- Deploy backend + frontend

**3. Test**
- Log in with admin credentials
- Create test users
- Upload test CSV
- Run test query

**4. Hand Off to Customer**
- Give them the URL
- Give them admin credentials
- They change password
- They create their users
- They upload their data

**Time:** 2-4 hours for first customer  
**Time:** 30 minutes for subsequent customers

---

## 📊 Comparison Summary

### For 5 Customers

**Solution 1 (Multiple Projects):**
- Cost: $50-100/month
- Setup time: 2.5 hours total
- Maintenance: Low
- Security: Excellent
- **RECOMMENDED** ✅

**Solution 2 (Tenant ID):**
- Cost: $20-50/month
- Setup time: 3-5 days development
- Maintenance: Medium
- Security: Good (if implemented correctly)

**Solution 3 (Subdomain Routing):**
- Cost: $40-100/month
- Setup time: 1-2 weeks
- Maintenance: High
- Security: Excellent

---

## ❓ FAQ

### Q: Can customers see each other's data?
**A (Solution 1):** No, completely impossible. Separate deployments.

### Q: What if I get 100 customers?
**A:** At 100 customers, switch to Solution 2 (Tenant ID) to reduce costs.

### Q: Can I migrate later?
**A:** Yes! Start with Solution 1, migrate to Solution 2 when you have 20+ customers.

### Q: How do I update all customers?
**A (Solution 1):** Update code, redeploy each Railway project (can be automated).

### Q: Can customers have custom domains?
**A:** Yes! Railway supports custom domains per project.

---

## 🎯 Next Steps

1. **Read this document** ✅
2. **Choose Solution 1** (Multiple Railway Projects)
3. **Follow** `RAILWAY_DEPLOYMENT.md`
4. **Deploy** first customer
5. **Test** thoroughly
6. **Deploy** second customer
7. **Scale** as needed

---

## 📞 Need Help?

- **Implementation questions:** Review this document
- **Railway deployment:** See `RAILWAY_DEPLOYMENT.md`
- **Security concerns:** See `SECURITY-CHECKLIST.md`
- **Cost optimization:** Consider Solution 2 after 20+ customers

---

**Bottom Line:** Use **Solution 1 (Multiple Railway Projects)** for quick, secure, isolated instances. It's the fastest path to supporting multiple customers with complete data isolation.
