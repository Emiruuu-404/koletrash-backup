#!/bin/bash
# Version Management Script for KolekTrash

# Create a new version tag
create_version() {
    echo "Current version tags:"
    git tag --sort=-creatordate | head -10
    
    echo ""
    read -p "Enter new version (e.g., v1.0.0): " version
    
    git tag -a $version -m "Release $version"
    git push origin $version
    echo "Created and pushed version $version"
}

# List all versions
list_versions() {
    echo "All version tags:"
    git tag --sort=-creatordate
}

# Rollback to specific version
rollback_version() {
    echo "Available versions:"
    git tag --sort=-creatordate | head -10
    
    echo ""
    read -p "Enter version to rollback to (e.g., v1.0.0): " version
    
    # Create backup branch of current state
    current_date=$(date +"%Y%m%d_%H%M%S")
    git checkout -b "backup_before_rollback_$current_date"
    git push origin "backup_before_rollback_$current_date"
    
    # Rollback to specified version
    git checkout main
    git reset --hard $version
    git push --force-with-lease origin main
    
    echo "Rolled back to $version"
    echo "Backup created in branch: backup_before_rollback_$current_date"
}

# Menu
echo "KolekTrash Version Management"
echo "1. Create new version"
echo "2. List versions"
echo "3. Rollback to version"
read -p "Choose option (1-3): " choice

case $choice in
    1) create_version ;;
    2) list_versions ;;
    3) rollback_version ;;
    *) echo "Invalid option" ;;
esac
