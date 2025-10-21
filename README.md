# 🤖 AI Data Agent

A secure, full-stack AI-powered data analysis application with natural language querying capabilities.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 🛡️ **Enterprise Security** - SSL/HTTPS, SQL injection protection, security headers
- 📊 **CSV Data Analysis** - Upload and query CSV files using natural language
- 🤖 **AI-Powered Queries** - OpenAI integration for intelligent SQL generation
- 📈 **Data Visualization** - Interactive charts and tables
- 📥 **Export Capabilities** - Export query results to Excel
- 🐳 **Docker Ready** - One-command deployment with Docker Compose

## 🏗️ Architecture

```
┌─────────────────┐
│  Nginx (SSL)    │  ← HTTPS/SSL Termination
│  Port 80/443    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌─▼────────┐
│Frontend│ │ Backend  │
│Next.js │ │ Express  │
│Port 3000│ │Port 3001│
└────────┘ └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop (for production deployment)
- OpenAI API Key

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dev
   ```

2. **Generate secrets**
   ```powershell
   .\generate-secrets.ps1
   ```

3. **Configure environment variables**
   ```bash
   # Frontend
   cp ai-data-agent-frontend/.env.example ai-data-agent-frontend/.env.local
   
   # Backend
   cp agentkit-csv-agent/.env.example agentkit-csv-agent/.env
   ```
   
   Edit both files and add your secrets and OpenAI API key.

4. **Install dependencies**
   ```bash
   # Backend
   cd agentkit-csv-agent
   npm install
   
   # Frontend
   cd ../ai-data-agent-frontend
   npm install
   ```

5. **Start development servers**
   ```bash
   # Option 1: Use startup script
   .\start-all.bat
   
   # Option 2: Use npm (from frontend directory)
   npm run dev:all
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Default login: `admin` / `admin123`

## 🐳 Docker Deployment

### Quick Deploy

```bash
# 1. Create .env file
cp .env.production.example .env
# Edit .env and add your secrets

# 2. Start all services
docker-compose up -d

# 3. Access via HTTPS
# https://localhost
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔒 Security Features

### Implemented Security Measures

1. **SSL/HTTPS Encryption**
   - Nginx reverse proxy with TLS
   - Automatic HTTP to HTTPS redirect
   - Self-signed certs for dev, Let's Encrypt for production

2. **Authentication & Authorization**
   - JWT token-based authentication
   - Bcrypt password hashing (10 rounds)
   - Session management with secure cookies
   - Protected API routes

3. **SQL Injection Protection**
   - Query validation and sanitization
   - Whitelist of allowed SQL operations
   - Table name validation
   - Suspicious query logging

4. **Security Headers**
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection

5. **Rate Limiting**
   - API rate limiting (100 req/15min)
   - Login rate limiting (5 req/min)
   - Per-IP tracking

6. **Input Validation**
   - File upload restrictions (CSV only, 500MB max)
   - SQL query validation
   - Environment variable validation

## 📁 Project Structure

```
dev/
├── agentkit-csv-agent/          # Backend API
│   ├── src/
│   │   ├── middleware/          # Auth middleware
│   │   ├── tools/               # Database tools
│   │   └── utils/               # SQL sanitizer
│   ├── server.ts                # Express server
│   ├── Dockerfile               # Backend container
│   └── .env.example             # Backend env template
│
├── ai-data-agent-frontend/      # Frontend App
│   ├── app/                     # Next.js app directory
│   ├── lib/                     # User management
│   ├── Dockerfile               # Frontend container
│   └── .env.example             # Frontend env template
│
├── nginx/                       # Reverse Proxy
│   ├── nginx.conf               # Nginx configuration
│   └── Dockerfile               # Nginx container
│
├── docker-compose.yml           # Docker orchestration
├── generate-secrets.ps1         # Secret generator
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

**Backend** (`agentkit-csv-agent/.env`):
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key (required)
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend** (`ai-data-agent-frontend/.env.local`):
- `NEXTAUTH_SECRET` - NextAuth encryption key
- `JWT_SECRET` - Must match backend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - Frontend URL

### Generating Secrets

```powershell
# Windows
.\generate-secrets.ps1

# Linux/Mac
openssl rand -base64 32
```

## 📊 Usage

### Upload CSV Files

1. Log in to the application
2. Navigate to the upload section
3. Select CSV file(s) to upload
4. Files are automatically loaded into DuckDB

### Query Data

1. Enter natural language query (e.g., "Show me all sales from last month")
2. AI generates and executes SQL query
3. View results in interactive table
4. Export to Excel if needed

### Manage Users

- Default admin user: `admin` / `admin123`
- Change password after first login
- Users stored in `data/users.json` with bcrypt hashing

## 🛠️ Development

### Tech Stack

**Frontend**:
- Next.js 14
- React 18
- NextAuth.js
- TailwindCSS
- Recharts

**Backend**:
- Node.js 20
- Express 5
- DuckDB
- OpenAI API
- JWT

**Infrastructure**:
- Docker & Docker Compose
- Nginx
- Let's Encrypt (production)

### Running Tests

```bash
# Backend
cd agentkit-csv-agent
npm test

# Frontend
cd ai-data-agent-frontend
npm test
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run type-check
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Docker build fails**:
```bash
docker-compose down
docker system prune -a
docker-compose build --no-cache
```

**Authentication not working**:
- Ensure JWT_SECRET matches in frontend and backend
- Clear browser cookies
- Check environment variables are set

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

## 📝 API Documentation

### Authentication

```bash
POST /api/auth/signin
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Query Data

```bash
POST /api/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Show me all records where amount > 1000"
}
```

### Upload CSV

```bash
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

csvFile: <file>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md)
- Review logs: `docker-compose logs -f`
- Open an issue on GitHub

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- DuckDB for fast data processing
- Next.js team for the framework
- All open source contributors

---

**⚠️ Security Notice**: This application handles sensitive data. Always use HTTPS in production, change default passwords, and keep dependencies updated.
