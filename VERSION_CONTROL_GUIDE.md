# KolekTrash - Version Control & Deployment Guide

## 🚀 Quick Setup Commands

### Initial Setup
```bash
# After installing Git
git init
git add .
git commit -m "Initial commit - KolekTrash v1.0"
git remote add origin https://github.com/yourusername/koletrash.git
git push -u origin main
```

### Create Stable Version
```bash
# Tag current stable version
git tag -a v1.0.0 -m "Stable release v1.0.0 - Initial production version"
git push origin v1.0.0
```

## 🔄 Safe Development Workflow

### 1. Before Making Changes
```bash
# Create backup of current working version
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# Go back to main and create feature branch
git checkout main
git checkout -b feature/mobile-ui-improvements
```

### 2. After Making Changes
```bash
# Stage and commit changes
git add .
git commit -m "Improve mobile responsiveness for auth components"

# Push feature branch
git push origin feature/mobile-ui-improvements
```

### 3. Deploy to Production
```bash
# Merge feature to main
git checkout main
git merge feature/mobile-ui-improvements

# Create new version tag
git tag -a v1.1.0 -m "Release v1.1.0 - Mobile UI improvements"
git push origin main
git push origin v1.1.0
```

## 🚨 Emergency Rollback Commands

### Quick Rollback to Previous Version
```bash
# List recent versions
git tag --sort=-creatordate | head -5

# Rollback to specific version (replace v1.0.0 with your version)
git checkout main
git reset --hard v1.0.0
git push --force-with-lease origin main
```

### Rollback with Backup
```bash
# Create backup before rollback
git checkout -b emergency-backup-$(date +%Y%m%d-%H%M)
git push origin emergency-backup-$(date +%Y%m%d-%H%M)

# Rollback
git checkout main
git reset --hard v1.0.0
git push --force-with-lease origin main
```

## 📋 Version Naming Convention

- **v1.0.0** - Major release (breaking changes)
- **v1.1.0** - Minor release (new features)
- **v1.1.1** - Patch release (bug fixes)

## 🏷️ Recommended Tags

- `v1.0.0-stable` - First working version
- `v1.1.0-mobile-optimized` - After mobile improvements
- `v1.2.0-auth-enhanced` - After auth improvements
- `v2.0.0-production` - Production ready version

## 📱 Branch Strategy

- **main** - Production code
- **development** - Development/testing
- **feature/feature-name** - Individual features
- **hotfix/issue-name** - Emergency fixes
- **backup-YYYYMMDD** - Backup branches

## ⚡ Quick Commands Reference

```bash
# Check current status
git status

# See commit history
git log --oneline -10

# List all branches
git branch -a

# List all tags
git tag --sort=-creatordate

# Switch to different version
git checkout v1.0.0

# Return to latest
git checkout main

# Check differences
git diff HEAD~1

# Undo last commit (keep files)
git reset --soft HEAD~1

# Undo last commit (remove files)
git reset --hard HEAD~1
```

## 🔧 Emergency Recovery

If something goes wrong:

1. **Don't Panic** - Git saves everything
2. **Check git log** to see what happened
3. **Use git reflog** to see all recent actions
4. **Restore from backup branch** if needed
5. **Contact team** before force pushing

```bash
# See all recent actions
git reflog

# Restore from reflog entry
git reset --hard HEAD@{2}
```
