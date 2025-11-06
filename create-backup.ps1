# Backup Script for AI Data Agent Project
# Creates a timestamped backup of the entire c:\dev directory

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupPath = "c:\dev-backup-$timestamp"

Write-Host "========================================"
Write-Host "  AI Data Agent - Backup Script"
Write-Host "========================================"
Write-Host ""
Write-Host "Source: c:\dev"
Write-Host "Destination: $backupPath"
Write-Host ""
Write-Host "Starting backup..."

try {
    # Create backup
    Copy-Item -Path "c:\dev" -Destination $backupPath -Recurse -Force
    
    Write-Host ""
    Write-Host "Backup completed successfully!"
    Write-Host ""
    Write-Host "Backup location: $backupPath"
    Write-Host ""
    
    # Calculate size
    $size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Backup size: $([math]::Round($size, 2)) MB"
    
} catch {
    Write-Host ""
    Write-Host "Backup failed!"
    Write-Host "Error: $_"
}

Write-Host ""
Write-Host "Done!"
