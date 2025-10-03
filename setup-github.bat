@echo off
echo.
echo ========================================
echo   KolekTrash GitHub Setup Script
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    echo Then restart Command Prompt and run this script again
    pause
    exit /b 1
)

echo [INFO] Git is installed and ready
echo.

REM Check if already a git repository
if exist ".git" (
    echo [INFO] Already a Git repository
) else (
    echo [INFO] Initializing Git repository...
    git init
    echo [SUCCESS] Git repository initialized
)
echo.

REM Configure Git (you'll need to run these manually)
echo [MANUAL STEP] Please run these commands if not already configured:
echo   git config --global user.name "Your Name"
echo   git config --global user.email "your.email@example.com"
echo.

REM Create initial commit
echo [INFO] Creating initial commit...
git add .
git commit -m "Initial commit - KolekTrash v1.0.0 with mobile-optimized UI"
echo [SUCCESS] Initial commit created
echo.

REM Create version tag
echo [INFO] Creating version tag v1.0.0...
git tag -a v1.0.0 -m "Release v1.0.0 - Mobile-optimized authentication system"
echo [SUCCESS] Version tag v1.0.0 created
echo.

echo ========================================
echo           NEXT STEPS
echo ========================================
echo.
echo 1. Go to https://github.com and create a new repository
echo    Name it: koletrash
echo    Make it Private (recommended)
echo    Do NOT initialize with README
echo.
echo 2. After creating the repository, copy the URL and run:
echo    git remote add origin https://github.com/yourusername/koletrash.git
echo    git branch -M main
echo    git push -u origin main
echo    git push origin v1.0.0
echo.
echo 3. For future updates:
echo    git add .
echo    git commit -m "Description of changes"
echo    git tag -a v1.1.0 -m "Version description"
echo    git push origin main
echo    git push origin v1.1.0
echo.
echo 4. Emergency rollback:
echo    git reset --hard v1.0.0
echo    git push --force-with-lease origin main
echo.
echo [SUCCESS] Setup completed! Your project is ready for GitHub.
echo.
pause
