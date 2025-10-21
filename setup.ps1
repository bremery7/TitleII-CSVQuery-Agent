# AI Data Agent - Quick Setup Script
# This script helps you set up the application for first-time use

Write-Host "`n==============================================`n" -ForegroundColor Cyan
Write-Host "  AI Data Agent - Setup Wizard`n" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "Checking prerequisites...`n" -ForegroundColor Yellow

$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "⚠️  Docker is not installed!" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop`n" -ForegroundColor White
    $skipDocker = $true
} else {
    Write-Host "✓ Docker is installed`n" -ForegroundColor Green
    $skipDocker = $false
}

# Check if Node.js is installed
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "⚠️  Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js 20+ from: https://nodejs.org`n" -ForegroundColor White
    exit 1
} else {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed ($nodeVersion)`n" -ForegroundColor Green
}

# Ask user for deployment type
Write-Host "Select deployment type:" -ForegroundColor Yellow
Write-Host "  1. Development (local Node.js)" -ForegroundColor White
Write-Host "  2. Production (Docker)" -ForegroundColor White
$deployType = Read-Host "`nEnter choice (1 or 2)"

if ($deployType -eq "2" -and $skipDocker) {
    Write-Host "`n❌ Cannot proceed with Docker deployment - Docker is not installed`n" -ForegroundColor Red
    exit 1
}

# Generate secrets
Write-Host "`n==============================================`n" -ForegroundColor Cyan
Write-Host "Generating cryptographic secrets...`n" -ForegroundColor Yellow

function Generate-Secret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$NEXTAUTH_SECRET = Generate-Secret 32
$AUTH_SECRET = Generate-Secret 32
$SESSION_SECRET = Generate-Secret 32
$JWT_SECRET = Generate-Secret 32

Write-Host "✓ Secrets generated`n" -ForegroundColor Green

# Get OpenAI API Key
Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "OpenAI API Key is required for AI features" -ForegroundColor Yellow
$OPENAI_API_KEY = Read-Host "Enter your OpenAI API key (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($OPENAI_API_KEY)) {
    Write-Host "⚠️  Warning: No OpenAI API key provided. AI features will not work.`n" -ForegroundColor Yellow
    $OPENAI_API_KEY = "sk-your-openai-api-key-here"
}

# Create environment files
Write-Host "`n==============================================`n" -ForegroundColor Cyan
Write-Host "Creating environment files...`n" -ForegroundColor Yellow

if ($deployType -eq "1") {
    # Development setup
    
    # Backend .env
    $backendEnv = @"
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=$JWT_SECRET
OPENAI_API_KEY=$OPENAI_API_KEY
NODE_ENV=development
"@
    Set-Content -Path "agentkit-csv-agent\.env" -Value $backendEnv
    Write-Host "✓ Created agentkit-csv-agent\.env" -ForegroundColor Green
    
    # Frontend .env.local
    $frontendEnv = @"
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
AUTH_SECRET=$AUTH_SECRET
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
"@
    Set-Content -Path "ai-data-agent-frontend\.env.local" -Value $frontendEnv
    Write-Host "✓ Created ai-data-agent-frontend\.env.local`n" -ForegroundColor Green
    
    # Install dependencies
    Write-Host "==============================================`n" -ForegroundColor Cyan
    Write-Host "Installing dependencies (this may take a few minutes)...`n" -ForegroundColor Yellow
    
    Write-Host "Installing backend dependencies..." -ForegroundColor White
    Set-Location agentkit-csv-agent
    npm install
    Set-Location ..
    
    Write-Host "`nInstalling frontend dependencies..." -ForegroundColor White
    Set-Location ai-data-agent-frontend
    npm install
    Set-Location ..
    
    Write-Host "`n✓ Dependencies installed`n" -ForegroundColor Green
    
    # Success message
    Write-Host "==============================================`n" -ForegroundColor Cyan
    Write-Host "✅ Setup Complete!`n" -ForegroundColor Green
    Write-Host "To start the application, run:`n" -ForegroundColor White
    Write-Host "  .\start-all.bat" -ForegroundColor Cyan
    Write-Host "  OR" -ForegroundColor White
    Write-Host "  cd ai-data-agent-frontend && npm run dev:all`n" -ForegroundColor Cyan
    Write-Host "Then visit: http://localhost:3000`n" -ForegroundColor White
    Write-Host "Default login: admin / admin123`n" -ForegroundColor Yellow
    
} else {
    # Production (Docker) setup
    
    $dockerEnv = @"
# Production Environment Variables
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
AUTH_SECRET=$AUTH_SECRET
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
OPENAI_API_KEY=$OPENAI_API_KEY
"@
    Set-Content -Path ".env" -Value $dockerEnv
    Write-Host "✓ Created .env for Docker`n" -ForegroundColor Green
    
    # Success message
    Write-Host "==============================================`n" -ForegroundColor Cyan
    Write-Host "✅ Setup Complete!`n" -ForegroundColor Green
    Write-Host "To start the application with Docker, run:`n" -ForegroundColor White
    Write-Host "  docker-compose up -d`n" -ForegroundColor Cyan
    Write-Host "Then visit: https://localhost`n" -ForegroundColor White
    Write-Host "Default login: admin / admin123`n" -ForegroundColor Yellow
    Write-Host "Note: Browser will show SSL warning (self-signed cert)`n" -ForegroundColor Yellow
}

Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT SECURITY REMINDERS:`n" -ForegroundColor Red
Write-Host "  1. Change the default admin password immediately" -ForegroundColor White
Write-Host "  2. Never commit .env files to version control" -ForegroundColor White
Write-Host "  3. Use different secrets for production" -ForegroundColor White
Write-Host "  4. Keep your OpenAI API key secure`n" -ForegroundColor White
Write-Host "==============================================`n" -ForegroundColor Cyan

Write-Host "For more information, see:" -ForegroundColor White
Write-Host "  - README.md (overview)" -ForegroundColor Cyan
Write-Host "  - DEPLOYMENT.md (detailed deployment guide)`n" -ForegroundColor Cyan
