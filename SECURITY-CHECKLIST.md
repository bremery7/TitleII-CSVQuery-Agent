# 🔒 Security Checklist

Use this checklist before deploying to production.

## ✅ Pre-Deployment Security Checklist

### Authentication & Authorization

- [ ] Changed default admin password from `admin123`
- [ ] Generated strong cryptographic secrets (32+ characters)
- [ ] All secrets are unique (not reused across environments)
- [ ] JWT_SECRET matches between frontend and backend
- [ ] `.env` files are NOT committed to Git
- [ ] User passwords are bcrypt hashed (verified in `lib/users.ts`)

### SSL/HTTPS Configuration

- [ ] SSL certificates configured (Let's Encrypt for production)
- [ ] HTTP to HTTPS redirect enabled
- [ ] HSTS header configured (max-age=31536000)
- [ ] Self-signed certificates replaced with valid certs

### Environment Variables

- [ ] All secrets generated using `generate-secrets.ps1` or `openssl rand -base64 32`
- [ ] `NODE_ENV=production` set for production
- [ ] OpenAI API key configured
- [ ] CORS origins restricted to your domain
- [ ] No hardcoded credentials in code

### API Security

- [ ] All sensitive API routes protected with `authenticateToken` middleware
- [ ] Rate limiting configured (100 req/15min for API, 5 req/min for login)
- [ ] SQL injection protection enabled
- [ ] File upload restrictions in place (CSV only, 500MB max)
- [ ] Input validation on all endpoints

### Security Headers

- [ ] Content-Security-Policy (CSP) configured
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy configured
- [ ] Strict-Transport-Security (HSTS) enabled

### Database & Data

- [ ] DuckDB files not exposed publicly
- [ ] CSV upload directory secured
- [ ] User database (`data/users.json`) has restricted permissions
- [ ] Sensitive data encrypted at rest
- [ ] Regular backups configured

### Docker Configuration

- [ ] Docker images built from official base images
- [ ] No secrets in Dockerfile or docker-compose.yml
- [ ] Volumes configured for persistent data
- [ ] Health checks enabled
- [ ] Container runs as non-root user (frontend)
- [ ] Resource limits set (optional but recommended)

### Network Security

- [ ] Firewall rules configured
- [ ] Only necessary ports exposed (80, 443)
- [ ] Internal services not publicly accessible
- [ ] VPN/private network for admin access (if applicable)

### Monitoring & Logging

- [ ] Security event logging enabled
- [ ] Failed login attempts tracked
- [ ] Suspicious SQL queries logged
- [ ] Log rotation configured
- [ ] Monitoring/alerting set up

### Code Security

- [ ] Dependencies updated (`npm audit`)
- [ ] No known vulnerabilities (`npm audit fix`)
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules configured
- [ ] Code review completed

### Operational Security

- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Incident response plan created
- [ ] Security contact information documented
- [ ] Regular security updates scheduled

## 🔍 Security Testing

### Before Going Live

- [ ] Test authentication flow
- [ ] Verify JWT token expiration
- [ ] Test rate limiting
- [ ] Attempt SQL injection (should be blocked)
- [ ] Test file upload restrictions
- [ ] Verify HTTPS redirect works
- [ ] Check security headers (use securityheaders.com)
- [ ] Test with invalid/expired tokens
- [ ] Verify CORS restrictions
- [ ] Test password reset flow (if implemented)

### Penetration Testing (Recommended)

- [ ] Run automated security scanner (e.g., OWASP ZAP)
- [ ] Test for common vulnerabilities (OWASP Top 10)
- [ ] Verify session management
- [ ] Test for XSS vulnerabilities
- [ ] Check for exposed sensitive data
- [ ] Test authentication bypass attempts

## 📋 Post-Deployment

### Immediate Actions

- [ ] Change all default passwords
- [ ] Verify SSL certificate is valid
- [ ] Test application functionality
- [ ] Monitor logs for errors
- [ ] Verify backups are working
- [ ] Document any custom configurations

### Ongoing Maintenance

- [ ] Weekly: Review logs for suspicious activity
- [ ] Monthly: Update dependencies (`npm update`)
- [ ] Monthly: Review user access
- [ ] Quarterly: Rotate secrets
- [ ] Quarterly: Security audit
- [ ] Yearly: Penetration testing

## 🚨 Security Incident Response

### If You Suspect a Breach

1. **Immediately**:
   - Take affected services offline
   - Preserve logs
   - Document everything

2. **Investigate**:
   - Review logs for unauthorized access
   - Check for data exfiltration
   - Identify attack vector

3. **Remediate**:
   - Patch vulnerabilities
   - Rotate all secrets
   - Force password resets
   - Update security measures

4. **Communicate**:
   - Notify affected users
   - Report to authorities (if required)
   - Document lessons learned

## 📞 Security Contacts

- **Security Team**: [Your contact]
- **Emergency Contact**: [Emergency contact]
- **Hosting Provider**: [Provider support]

## 📚 Security Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **Security Headers**: https://securityheaders.com
- **SSL Test**: https://www.ssllabs.com/ssltest/

## ⚠️ Known Limitations

Document any known security limitations or trade-offs:

1. Self-signed certificates in development (expected)
2. [Add any other limitations]

## 🔄 Version History

- **v1.0** - Initial secure deployment (2025-10-20)
  - SSL/HTTPS implemented
  - Authentication added
  - SQL injection protection
  - Security headers configured

---

**Last Updated**: 2025-10-20  
**Next Review**: [Set date]  
**Reviewed By**: [Your name]
