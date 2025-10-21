# Clean Start - Remove Git History

## The Problem
Large files from `node_modules` are stuck in your Git history from old commits.

## Solution: Start Fresh

### Step 1: Delete the .git folder (removes all history)
```bash
cd c:\dev
Remove-Item -Recurse -Force .git
```

### Step 2: Initialize a new Git repository
```bash
git init
```

### Step 3: Verify .gitignore is correct
Make sure `.gitignore` contains:
```
node_modules/
**/node_modules/
.next/
*.duckdb
*.duckdb.wal
.env
.env.local
```

### Step 4: Add only the files you want
```bash
# Add root files
git add .gitignore
git add README.md
git add docker-compose.yml
git add *.md

# Add backend (will automatically skip node_modules due to .gitignore)
git add agentkit-csv-agent/

# Add frontend (will automatically skip node_modules and .next)
git add ai-data-agent-frontend/
```

### Step 5: Check what's staged
```bash
git status
```

**IMPORTANT**: Verify you do NOT see:
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.node` files
- ❌ `.duckdb` files

You SHOULD see:
- ✅ Source code files (`.ts`, `.tsx`, `.js`)
- ✅ Configuration files (`package.json`, `tsconfig.json`)
- ✅ Documentation (`.md` files)
- ✅ Docker files (`Dockerfile`, `docker-compose.yml`)

### Step 6: Create initial commit
```bash
git commit -m "Initial commit: AI Data Agent

- Backend API server with DuckDB integration
- Frontend Next.js application
- Docker support for both services
- Comprehensive documentation
- Authentication and security features"
```

### Step 7: Connect to GitHub
```bash
git remote add origin https://github.com/bremery7/csv-query-agent.git
git branch -M main
```

### Step 8: Force push (overwrites GitHub repo)
```bash
git push -u origin main --force
```

## Why This Works

- Deleting `.git` removes ALL history including large files
- Starting fresh with proper `.gitignore` ensures `node_modules` is never added
- Force push replaces everything on GitHub with your clean repository

## After Pushing

When someone clones your repo, they will:
1. `git clone https://github.com/bremery7/csv-query-agent.git`
2. `cd csv-query-agent/agentkit-csv-agent && npm install`
3. `cd ../ai-data-agent-frontend && npm install`

This is the correct workflow - dependencies are downloaded, not stored in Git!

## Alternative: Keep History and Use BFG

If you want to keep your commit history, you can use BFG Repo-Cleaner:
https://rtyley.github.io/bfg-repo-cleaner/

But for a new project, starting fresh is simpler and faster.
