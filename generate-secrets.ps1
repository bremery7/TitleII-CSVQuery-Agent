# Generate Strong Cryptographic Secrets for AI Data Agent
# Run this script to generate secure random secrets for your .env files

Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "  AI Data Agent - Secret Generator`n" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

function Generate-Secret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "Generated Secrets (copy these to your .env file):`n" -ForegroundColor Green

Write-Host "NEXTAUTH_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host (Generate-Secret 32)

Write-Host "SESSION_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host (Generate-Secret 32)

Write-Host "JWT_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host (Generate-Secret 32)

Write-Host "AUTH_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host (Generate-Secret 32)

Write-Host "`n==============================================`n" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "  1. Copy these secrets to your .env files" -ForegroundColor White
Write-Host "  2. NEVER commit .env files to Git" -ForegroundColor White
Write-Host "  3. Use different secrets for dev/staging/production" -ForegroundColor White
Write-Host "  4. Store production secrets securely (e.g., password manager)" -ForegroundColor White
Write-Host "`n==============================================`n" -ForegroundColor Cyan
