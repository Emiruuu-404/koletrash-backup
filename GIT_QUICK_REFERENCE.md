# 🚀 KolekTrash - Quick Git Commands Reference

## 📋 Initial Setup (One Time Only)
```bash
# Configure Git (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize repository and create first version
git init
git add .
git commit -m "Initial commit - KolekTrash v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0 - Mobile-optimized UI"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/yourusername/koletrash.git
git branch -M main
git push -u origin main
git push origin v1.0.0
```

## 🔄 Daily Development Workflow

### Save Changes & Create New Version
```bash
# Stage all changes
git add .

# Commit with description
git commit -m "Fixed mobile signup UI responsiveness"

# Create version tag (increment version number)
git tag -a v1.1.0 -m "Version 1.1.0 - Mobile signup improvements"

# Push to GitHub
git push origin main
git push origin v1.1.0
```

### Check Status
```bash
# See what files changed
git status

# See recent commits
git log --oneline -5

# See all version tags
git tag --sort=-creatordate
```

## 🚨 Emergency Rollback Commands

### Quick Rollback to Previous Version
```bash
# See available versions
git tag --sort=-creatordate

# Rollback to specific version (replace v1.0.0 with your version)
git reset --hard v1.0.0
git push --force-with-lease origin main
```

### Safe Rollback with Backup
```bash
# Create backup of current state
git checkout -b emergency-backup-$(date +%Y%m%d)
git push origin emergency-backup-$(date +%Y%m%d)

# Go back to main and rollback
git checkout main
git reset --hard v1.0.0
git push --force-with-lease origin main
```

## 📱 Version Naming Convention
- **v1.0.0** - Initial stable version
- **v1.1.0** - Minor updates (new features)
- **v1.0.1** - Bug fixes only
- **v2.0.0** - Major changes

## 🎯 Common Scenarios

### Before Making Big Changes
```bash
# Create backup branch
git checkout -b backup-before-changes
git push origin backup-before-changes

# Go back to main to make changes
git checkout main
```

### After Testing New Features
```bash
# If everything works:
git add .
git commit -m "Added new feature"
git tag -a v1.2.0 -m "Version 1.2.0 - New feature added"
git push origin main
git push origin v1.2.0
```

### If Something Breaks
```bash
# Quick fix - go back to last working version
git reset --hard v1.1.0
git push --force-with-lease origin main

# Or restore from backup branch
git checkout backup-before-changes
git checkout -b fix-branch
# Make fixes, then merge back
```

## ⚡ Super Quick Commands

```bash
# Save current work
git add . && git commit -m "Work in progress"

# Create version and push
git tag -a v1.X.0 -m "Version 1.X.0" && git push origin main && git push origin v1.X.0

# Emergency rollback
git reset --hard v1.0.0 && git push --force-with-lease origin main

# See what's different from last version
git diff HEAD~1
```

## 🔧 Troubleshooting

### If git push fails:
```bash
git pull origin main
git push origin main
```

### If you made a mistake in commit message:
```bash
git commit --amend -m "Corrected commit message"
```

### If you want to undo last commit but keep files:
```bash
git reset --soft HEAD~1
```

### If you want to see what happened recently:
```bash
git reflog
```

---

**💡 Pro Tip:** Always create a version tag before making major changes, so you can easily rollback if needed!
