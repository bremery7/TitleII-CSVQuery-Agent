# Docker Setup Guide - Complete Stack

This guide will help you deploy the entire AI Data Agent application (Frontend + Backend + Nginx) using Docker.

## Prerequisites

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker is running before proceeding

2. **Git** (to clone the repository)

3. **OpenAI API Key**
   - Get one from: https://platform.openai.com/api-keys

## Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/bremery7/csv-query-agent.git
cd csv-query-agent
```

### Step 2: Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

### Step 3: Edit .env File

Open `.env` in a text editor and update these values:

```env
# REQUIRED: Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# REQUIRED: Generate random secrets (or use the ones below)
NEXTAUTH_SECRET=8f3a9d2e7b1c4f6a5e8d9c2b7a4f1e6d3c9b8a5f2e7d4c1b6a9f3e8d2c5b7a4f
SESSION_SECRET=2d7f9a4e1c8b6d3f5a9e2c7b4d1f8a6e3c9b5d2f7a4e1c8b6d3f9a5e2c7b4d1f
JWT_SECRET=5c8b3f9a2e7d4c1b6a9f3e8d2c5b7a4f1e6d3c9b8a5f2e7d4c1b6a9f3e8d2c5b
AUTH_SECRET=7a4f1e6d3c9b8a5f2e7d4c1b6a9f3e8d2c5b7a4f8f3a9d2e7b1c4f6a5e8d9c2b

# URLs (these are correct for Docker)
NEXTAUTH_URL=https://localhost
NEXT_PUBLIC_API_URL=http://backend:3001
FRONTEND_URL=http://frontend:3000
```

**Important:** Only change the `OPENAI_API_KEY`. The secrets above are randomly generated and safe to use.

### Step 4: Start Everything

```bash
docker-compose up
```

This will:
- ✅ Build all Docker images (first time takes 5-10 minutes)
- ✅ Install all dependencies automatically
- ✅ Start the backend API server
- ✅ Start the frontend Next.js application
- ✅ Start Nginx reverse proxy with SSL
- ✅ Connect everything together

### Step 5: Access the Application

Open your browser to:
- **Main App**: https://localhost (or http://localhost)
- **Backend API**: http://localhost:3001/api/health

**Note:** You may see a security warning about the SSL certificate. This is normal for local development. Click "Advanced" and "Proceed to localhost".

### Step 6: Login

Default credentials:
- **Admin**: username: `admin`, password: `admin123`
- **User**: username: `user`, password: `user123`

## Stopping the Application

Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose down
```

To also remove all data:

```bash
docker-compose down -v
```

## Troubleshooting

### "Port already in use" Error

If ports 80, 443, 3000, or 3001 are already in use:

1. Stop other applications using those ports
2. Or modify the ports in `docker-compose.yml`

### "Cannot connect to Docker daemon" Error

Make sure Docker Desktop is running.

### Build Fails

If the build fails:

1. Make sure you have a stable internet connection
2. Try cleaning Docker cache:
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up --build
   ```

### Frontend Won't Load

1. Check that all services are running:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   ```

## Development vs Production

### For Local Development (Current Setup)

The current `docker-compose.yml` is configured for local development with:
- Self-signed SSL certificates
- Default admin credentials
- Debug logging enabled

### For Production Deployment

You'll need to:
1. Use real SSL certificates (Let's Encrypt)
2. Change all default passwords
3. Set `NODE_ENV=production`
4. Update `NEXTAUTH_URL` to your domain
5. Use a proper database for user management

## Architecture

```
┌─────────────────────────────────────────┐
│         Nginx (Port 80/443)             │
│     SSL Termination & Routing           │
└──────────┬──────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼─────┐
│Frontend │ │ Backend │
│Next.js  │ │ Express │
│Port 3000│ │Port 3001│
└─────────┘ └─────────┘
     │           │
     └─────┬─────┘
           │
      ┌────▼────┐
      │ DuckDB  │
      │ SQLite  │
      └─────────┘
```

## What Gets Installed

Docker automatically installs:
- Node.js 20
- All npm dependencies
- DuckDB database
- Nginx web server
- SSL certificates

**You don't need to install anything manually!**

## File Structure

```
csv-query-agent/
├── docker-compose.yml          # Main Docker configuration
├── .env                        # Your secrets (DO NOT COMMIT)
├── .env.example               # Template for .env
├── agentkit-csv-agent/        # Backend API
│   ├── Dockerfile
│   └── server.ts
├── ai-data-agent-frontend/    # Frontend App
│   ├── Dockerfile
│   └── app/
└── nginx/                     # Reverse Proxy
    ├── Dockerfile
    └── nginx.conf
```

## Next Steps

1. Upload CSV files through the UI
2. Query your data using natural language
3. Export results to Excel
4. Manage users (admin only)

## Support

For issues:
1. Check the logs: `docker-compose logs`
2. Verify .env file has correct values
3. Make sure Docker Desktop is running
4. Open an issue on GitHub

## Security Notes

- Change default passwords immediately
- Never commit `.env` file to Git
- Use strong random secrets in production
- Keep your OpenAI API key secure
