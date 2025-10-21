# GitHub Setup Guide

## Current Repository Structure

You have a monorepo at `c:\dev` containing:
- `agentkit-csv-agent/` - Backend API server
- `ai-data-agent-frontend/` - Frontend application

## Option 1: Push as Monorepo (Recommended)

Keep both frontend and backend in one repository.

### Steps:

1. **Navigate to the root directory**
   ```bash
   cd c:\dev
   ```

2. **Stage all backend changes**
   ```bash
   git add agentkit-csv-agent/
   ```

3. **Commit the changes**
   ```bash
   git commit -m "Add backend API server with Docker support

   - Express server with DuckDB integration
   - Natural language query processing with OpenAI
   - Multi-CSV file support with UNION queries
   - Excel export functionality
   - SQL injection protection
   - Docker and docker-compose configuration
   - Comprehensive documentation"
   ```

4. **Create GitHub repository**
   - Go to https://github.com/new
   - Name it (e.g., "ai-data-agent" or "csv-query-agent")
   - Don't initialize with README (you already have one)
   - Click "Create repository"

5. **Add remote and push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Option 2: Separate Backend Repository

If you want the backend in its own repository:

### Steps:

1. **Navigate to backend directory**
   ```bash
   cd c:\dev\agentkit-csv-agent
   ```

2. **Initialize new git repository**
   ```bash
   git init
   ```

3. **Add all files**
   ```bash
   git add .
   ```

4. **Create initial commit**
   ```bash
   git commit -m "Initial commit: AgentKit CSV Agent backend

   - Express server with DuckDB integration
   - Natural language query processing with OpenAI
   - Multi-CSV file support with UNION queries
   - Excel export functionality
   - SQL injection protection
   - Docker and docker-compose configuration
   - Comprehensive documentation"
   ```

5. **Create GitHub repository**
   - Go to https://github.com/new
   - Name it "agentkit-csv-agent"
   - Don't initialize with README
   - Click "Create repository"

6. **Add remote and push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/agentkit-csv-agent.git
   git branch -M main
   git push -u origin main
   ```

## After Pushing to GitHub

### Update README with correct repository URL

Replace `<your-repo-url>` in README.md and QUICK_START.md with your actual GitHub URL:
```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Add Repository Description

On GitHub, add a description:
```
AI-powered CSV data analysis tool with natural language queries. Built with Express, DuckDB, and OpenAI.
```

### Add Topics/Tags

Add these topics to your repository:
- `csv`
- `data-analysis`
- `openai`
- `duckdb`
- `natural-language-processing`
- `express`
- `typescript`
- `docker`

### Create Releases

After pushing, create a release:
1. Go to "Releases" on GitHub
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: "Initial Release"
5. Description: Brief overview of features

## Docker Hub (Optional)

To share your Docker image:

1. **Build and tag**
   ```bash
   docker build -t YOUR_USERNAME/agentkit-csv-agent:latest .
   ```

2. **Login to Docker Hub**
   ```bash
   docker login
   ```

3. **Push image**
   ```bash
   docker push YOUR_USERNAME/agentkit-csv-agent:latest
   ```

4. **Update README** with Docker Hub instructions:
   ```bash
   docker pull YOUR_USERNAME/agentkit-csv-agent:latest
   docker run -p 3001:3001 --env-file .env YOUR_USERNAME/agentkit-csv-agent:latest
   ```

## Recommended: Add GitHub Actions

Create `.github/workflows/docker-build.yml` for automated Docker builds:

```yaml
name: Docker Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: docker build -t agentkit-csv-agent .
```

## Next Steps

1. Push your code to GitHub
2. Update README with actual repository URL
3. Add repository description and topics
4. Create a release
5. Share with others!
