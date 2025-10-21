# AI Data Agent - Secure Deployment Guide

## 🔒 Security Features Implemented

This deployment includes the following security enhancements:

1. ✅ **SSL/HTTPS** - Nginx reverse proxy with TLS encryption
2. ✅ **Backend Authentication** - JWT token validation on all API routes
3. ✅ **Bcrypt Password Hashing** - Secure password storage
4. ✅ **Strong Cryptographic Secrets** - Random secret generation
5. ✅ **SQL Injection Protection** - Query validation and sanitization
6. ✅ **HTTPS Enforcement** - Automatic HTTP to HTTPS redirect
7. ✅ **Security Headers** - CSP, HSTS, X-Frame-Options, etc.

---

## 📋 Prerequisites

- **Docker Desktop** installed (Windows/Mac/Linux)
- **OpenAI API Key** (required for AI features)
- **Git** (for cloning/version control)

---

## 🚀 Quick Start (Development)

### 1. Generate Secrets

```powershell
# Windows PowerShell
.\generate-secrets.ps1
```

Copy the generated secrets to your `.env` files.

### 2. Configure Environment Variables

**Frontend** (`ai-data-agent-frontend/.env.local`):
```bash
cp ai-data-agent-frontend/.env.example ai-data-agent-frontend/.env.local
# Edit and add your secrets
```

**Backend** (`agentkit-csv-agent/.env`):
```bash
cp agentkit-csv-agent/.env.example agentkit-csv-agent/.env
# Edit and add your secrets + OpenAI API key
```

### 3. Install Dependencies

```bash
# Backend
cd agentkit-csv-agent
npm install

# Frontend
cd ../ai-data-agent-frontend
npm install
```

### 4. Start Development Servers

```bash
# Option 1: Use the startup script
.\start-all.bat

# Option 2: Use npm script (from frontend directory)
cd ai-data-agent-frontend
npm run dev:all
```

---

## 🐳 Docker Deployment (Production)

### 1. Create Production Environment File

```bash
cp .env.production.example .env
```

Edit `.env` and fill in:
- All secret keys (use `generate-secrets.ps1`)
- Your OpenAI API key
- Optional: Email configuration

### 2. Build and Start Containers

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Access the Application

- **HTTPS**: https://localhost (recommended)
- **HTTP**: http://localhost (redirects to HTTPS)

### 4. Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

---

## 🔐 Security Configuration

### SSL Certificates

**Development**: Self-signed certificate (auto-generated)
- Browser will show security warning - this is normal for development

**Production**: Use Let's Encrypt

1. Update `nginx/nginx.conf` with your domain
2. Use Certbot to generate certificates:

```bash
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com
```

3. Update certificate paths in `nginx/Dockerfile`

### Environment Variables

**Critical secrets to change**:
- `NEXTAUTH_SECRET` - NextAuth session encryption
- `AUTH_SECRET` - Alternative auth secret
- `SESSION_SECRET` - Session encryption
- `JWT_SECRET` - Backend API authentication
- `OPENAI_API_KEY` - Your OpenAI API key

**Generate secure secrets**:
```bash
# PowerShell
.\generate-secrets.ps1

# Linux/Mac
openssl rand -base64 32
```

### User Management

Users are stored in `ai-data-agent-frontend/data/users.json` with bcrypt-hashed passwords.

**Add new users** (via API or directly):
```javascript
// Example: Add via code
import { createUser } from './lib/users';
await createUser('newuser', 'securepassword', 'user', 'user@example.com');
```

---

## 🔧 Configuration

### Backend API (`agentkit-csv-agent/.env`)

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-your-key
NODE_ENV=development
```

### Frontend (`ai-data-agent-frontend/.env.local`)

```bash
NEXTAUTH_SECRET=your-nextauth-secret
AUTH_SECRET=your-auth-secret
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret  # Must match backend
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80, 443 | Reverse proxy with SSL |
| frontend | 3000 | Next.js application |
| backend | 3001 | Express API server |

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service]

# Restart a service
docker-compose restart [service]

# Rebuild after code changes
docker-compose up -d --build

# Clean up everything
docker-compose down -v
```

---

## 🔍 Monitoring & Logs

### Health Checks

- **Backend**: http://localhost:3001/api/health
- **Frontend**: http://localhost:3000

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

---

## 🛡️ Security Best Practices

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate new cryptographic secrets
- [ ] Use real SSL certificates (Let's Encrypt)
- [ ] Set `NODE_ENV=production`
- [ ] Review and update CORS settings
- [ ] Enable firewall rules
- [ ] Set up monitoring/alerting
- [ ] Regular security updates
- [ ] Backup user database regularly

### Ongoing Security

1. **Keep dependencies updated**:
   ```bash
   npm audit
   npm update
   ```

2. **Monitor logs** for suspicious activity
3. **Rotate secrets** periodically
4. **Backup data** regularly
5. **Review user access** periodically

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows - Find process using port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Docker Build Fails

```bash
# Clear Docker cache
docker-compose down
docker system prune -a
docker-compose build --no-cache
```

### Authentication Issues

1. Ensure JWT_SECRET matches in both frontend and backend
2. Check that secrets are properly set in .env files
3. Clear browser cookies and try again
4. Check logs: `docker-compose logs -f frontend`

### Database Issues

```bash
# Reset backend database
docker-compose down
docker volume rm dev_backend-db
docker-compose up -d
```

---

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Docker Documentation**: https://docs.docker.com
- **Nginx Documentation**: https://nginx.org/en/docs
- **Let's Encrypt**: https://letsencrypt.org

---

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check environment variables are set correctly
4. Ensure all secrets are generated and configured

---

## 📝 License

[Your License Here]
