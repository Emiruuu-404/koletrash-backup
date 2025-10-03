# KoleTrash Hostinger Deployment Guide

## File Upload Structure

Upload files to your Hostinger cPanel File Manager as follows:

### 1. Frontend Files (from `dist` folder)
Upload ALL contents of the `dist` folder to your **public_html** directory:
```
public_html/
├── index.html
├── vite.svg
├── marker-icon.png
├── marker-icon-2x.png
├── marker-shadow.png
└── assets/
    ├── index-CCfk_-3y.js
    ├── index-C4XSqIHd.css
    ├── slick-BlzDm7g2.svg
    └── ajax-loader-BcnMEykj.gif
```

### 2. Backend Files
Upload the entire `backend` folder to your **public_html** directory:
```
public_html/
└── backend/
    ├── api/ (all PHP files)
    ├── config/
    │   ├── database.php
    │   └── email.php
    ├── includes/
    ├── lib/
    ├── models/
    └── logs/
```

### 3. Uploads Directory
Create and upload the `uploads` folder:
```
public_html/
└── uploads/
    └── issue_reports/
```

## Before Upload - Update These Files:

### 1. Database Configuration (`backend/config/database.php`)
Replace these values with your Hostinger database details:
```php
private $host = 'localhost';
private $db_name = 'YOUR_HOSTINGER_DB_NAME';
private $username = 'YOUR_HOSTINGER_DB_USERNAME'; 
private $password = 'YOUR_HOSTINGER_DB_PASSWORD';
```

### 2. API URLs (Multiple files updated)
Replace `YOUR_DOMAIN.com` with your actual domain in all files.

### 3. Email Configuration (`backend/config/email.php`)
Replace with your Gmail credentials:
```php
define('SMTP_USERNAME', 'YOUR_EMAIL@gmail.com');
define('SMTP_PASSWORD', 'YOUR_APP_PASSWORD');
define('SMTP_FROM_EMAIL', 'YOUR_EMAIL@gmail.com');
```

## Database Setup:

1. **Create Database in Hostinger cPanel**
   - Go to MySQL Databases
   - Create new database (e.g., `u123456_kolektrash`)
   - Create user and assign to database
   - Note down the database name, username, and password

2. **Import Database Structure**
   - Export your local database structure
   - Import via phpMyAdmin in Hostinger cPanel

## File Permissions:
Set these folder permissions in cPanel File Manager:
- `uploads/` folder: 755 or 777
- `uploads/issue_reports/` folder: 755 or 777
- `backend/logs/` folder: 755 or 777

## Final Steps:
1. Upload all files as described above
2. Update database credentials in `backend/config/database.php`
3. Update your domain in all API URL configurations
4. Update email credentials in `backend/config/email.php`
5. Test the website functionality

## Testing:
After deployment, test these features:
- [ ] User login/signup
- [ ] Database connectivity
- [ ] Email functionality (forgot password)
- [ ] File uploads (issue reports)
- [ ] All CRUD operations

## Troubleshooting:
- Check error logs in cPanel
- Verify file permissions
- Test database connection separately
- Ensure all API URLs use HTTPS (not HTTP)
