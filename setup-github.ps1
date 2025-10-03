# KolekTrash Git Setup Script
# Run this script in PowerShell as Administrator

Write-Host "🚀 KolekTrash GitHub Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Then restart PowerShell and run this script again" -ForegroundColor Yellow
    exit 1
}

# Configure Git if not already configured
$userName = git config --global user.name
$userEmail = git config --global user.email

if ([string]::IsNullOrEmpty($userName)) {
    $inputName = Read-Host "Enter your name for Git commits"
    git config --global user.name "$inputName"
    Write-Host "✅ Set Git username to: $inputName" -ForegroundColor Green
} else {
    Write-Host "✅ Git username already set: $userName" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($userEmail)) {
    $inputEmail = Read-Host "Enter your email for Git commits"
    git config --global user.email "$inputEmail"
    Write-Host "✅ Set Git email to: $inputEmail" -ForegroundColor Green
} else {
    Write-Host "✅ Git email already set: $userEmail" -ForegroundColor Green
}

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "✅ Already a Git repository" -ForegroundColor Green
} else {
    Write-Host "🔄 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Create initial commit if no commits exist
$commits = git log --oneline 2>$null
if ([string]::IsNullOrEmpty($commits)) {
    Write-Host "🔄 Creating initial commit..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit - KolekTrash v1.0.0 with improved mobile UI"
    Write-Host "✅ Initial commit created" -ForegroundColor Green
} else {
    Write-Host "✅ Repository already has commits" -ForegroundColor Green
}

# Create version tag
Write-Host "🔄 Creating version tag v1.0.0..." -ForegroundColor Yellow
git tag -a v1.0.0 -m "Release v1.0.0 - Mobile-optimized authentication system" 2>$null
Write-Host "✅ Version tag v1.0.0 created" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com and create a new repository called 'koletrash'" -ForegroundColor White
Write-Host "2. Copy the repository URL (e.g., https://github.com/yourusername/koletrash.git)" -ForegroundColor White
Write-Host "3. Run the following commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/yourusername/koletrash.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host "   git push origin v1.0.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 For future updates, use:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Description of changes'" -ForegroundColor Yellow
Write-Host "   git tag -a v1.1.0 -m 'Version 1.1.0 description'" -ForegroundColor Yellow
Write-Host "   git push origin main" -ForegroundColor Yellow
Write-Host "   git push origin v1.1.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚨 Emergency Rollback:" -ForegroundColor Red
Write-Host "   git reset --hard v1.0.0" -ForegroundColor Yellow
Write-Host "   git push --force-with-lease origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Setup completed! Your project is ready for GitHub." -ForegroundColor Green
