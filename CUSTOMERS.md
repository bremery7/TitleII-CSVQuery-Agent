# 📋 Customer Deployment Tracking

This document tracks all deployed customer instances.

---

## Active Customers

### Template (Copy for each new customer)
```markdown
## Customer Name
- **Railway Project:** customer-name-ai-agent
- **Frontend URL:** https://frontend-production-xxxx.railway.app
- **Backend URL:** https://backend-production-xxxx.railway.app
- **Custom Domain:** (if applicable)
- **Users:** X users
- **CSV Files:** X files
- **Status:** Active/Inactive
- **Deployed Date:** YYYY-MM-DD
- **Last Updated:** YYYY-MM-DD
- **Monthly Cost:** $XX
- **Billing:** $XX/month
- **Notes:** Any special configuration or notes
```

---

## Example: Customer A
- **Railway Project:** customer-a-ai-agent
- **Frontend URL:** https://customer-a-frontend.railway.app
- **Backend URL:** https://customer-a-backend.railway.app
- **Custom Domain:** app.customera.com
- **Users:** 3 users
- **CSV Files:** 5 files
- **Status:** Active
- **Deployed Date:** 2025-11-04
- **Last Updated:** 2025-11-04
- **Monthly Cost:** $15
- **Billing:** $75/month
- **Notes:** Initial deployment, customer has admin access

---

## Example: Customer B
- **Railway Project:** customer-b-ai-agent
- **Frontend URL:** https://customer-b-frontend.railway.app
- **Backend URL:** https://customer-b-backend.railway.app
- **Custom Domain:** None
- **Users:** 2 users
- **CSV Files:** 2 files
- **Status:** Active
- **Deployed Date:** 2025-11-05
- **Last Updated:** 2025-11-05
- **Monthly Cost:** $12
- **Billing:** $50/month
- **Notes:** Using Railway subdomain

---

## Deployment Checklist

For each new customer:

- [ ] Generate unique secrets for customer
- [ ] Create Railway project with naming: `customer-[name]-ai-agent`
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Configure environment variables
- [ ] Test deployment (login, upload, query)
- [ ] Provide customer with URL and initial admin credentials
- [ ] Customer changes admin password
- [ ] Customer creates their users
- [ ] Customer uploads their data
- [ ] Update this tracking document
- [ ] Set up billing/invoicing

---

## Cost Summary

| Customer | Monthly Cost | Monthly Billing | Profit |
|----------|-------------|----------------|--------|
| Customer A | $15 | $75 | $60 |
| Customer B | $12 | $50 | $38 |
| **Total** | **$27** | **$125** | **$98** |

---

## Notes

### Deployment Time
- **First customer:** 2-4 hours (includes learning)
- **Subsequent customers:** 30-45 minutes each

### Maintenance
- **Updates:** Deploy to all customer projects when updating code
- **Monitoring:** Check Railway dashboard for each customer
- **Support:** Each customer manages their own users and data

### Scaling Plan
- **0-10 customers:** Multiple Railway projects (current approach)
- **10-20 customers:** Consider automation scripts
- **20+ customers:** Consider migrating to single multi-tenant app

---

## Customer Onboarding Process

1. **Pre-Deployment**
   - Collect customer requirements (users, data size)
   - Agree on pricing
   - Generate secrets

2. **Deployment**
   - Create Railway project
   - Deploy services
   - Configure environment

3. **Handoff**
   - Provide URL
   - Provide initial admin credentials
   - Provide quick start guide

4. **Customer Setup**
   - Customer logs in
   - Customer changes password
   - Customer creates users
   - Customer uploads data

5. **Post-Deployment**
   - Monitor for issues
   - Provide support as needed
   - Set up billing

---

## Support Contact Info

For each customer, maintain:
- Primary contact name
- Email
- Phone (optional)
- Preferred support channel

---

## Inactive/Archived Customers

### Customer X (Archived)
- **Railway Project:** Deleted
- **Status:** Inactive
- **Deactivated Date:** YYYY-MM-DD
- **Reason:** Contract ended
- **Data Backup:** Location of final backup

---

**Last Updated:** 2025-11-04  
**Total Active Customers:** 0  
**Total Monthly Revenue:** $0  
**Total Monthly Costs:** $0  
**Total Monthly Profit:** $0
