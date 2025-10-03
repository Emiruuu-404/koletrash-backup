# KOLEKTRASH Backend Setup

This directory contains the PHP backend for the KOLEKTRASH application.

## Prerequisites

1. **XAMPP/WAMP/MAMP** - Local server environment with PHP and MySQL
2. **PHP 7.4+** with PDO extension enabled
3. **MySQL 5.7+** or **MariaDB 10.2+**

## Setup Instructions

### 1. Database Setup

1. Start your local server (XAMPP/WAMP/MAMP)
2. Open phpMyAdmin (usually at `http://localhost/phpmyadmin`)
3. Create a new database or import the SQL file:
   - Go to "Import" tab
   - Choose the `database_setup.sql` file
   - Click "Go" to execute

Alternatively, you can run the SQL commands manually:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS kolektrash_db;
USE kolektrash_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    barangay VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('resident', 'admin', 'barangay_head', 'truck_driver') DEFAULT 'resident',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_barangay (barangay)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Configuration

1. Update the database configuration in `config/database.php` if needed:
   ```php
   private $host = "localhost";        // Your database host
   private $db_name = "kolektrash_db"; // Your database name
   private $username = "root";         // Your database username
   private $password = "";             // Your database password
   ```

### 3. File Structure

Place the entire `backend` folder in your web server's document root:
- For XAMPP: `C:\xampp\htdocs\koletrash\backend\`
- For WAMP: `C:\wamp64\www\koletrash\backend\`
- For MAMP: `/Applications/MAMP/htdocs/koletrash/backend/`

### 4. API Endpoints

#### Signup
- **URL**: `http://localhost/koletrash/backend/signup.php`
- **Method**: POST
- **Content-Type**: application/json
- **Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "barangay": "North Centro (Poblacion)",
    "password": "password123"
  }
  ```

### 5. Testing

You can test the API using tools like:
- **Postman**
- **cURL**
- **Browser Developer Tools**

Example cURL command:
```bash
curl -X POST http://localhost/koletrash/backend/signup.php \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "username": "testuser",
    "barangay": "North Centro (Poblacion)",
    "password": "password123"
  }'
```

### 6. Frontend Integration

The React frontend is configured to connect to the backend at:
```javascript
const API_BASE_URL = 'http://localhost/koletrash/backend';
```

Make sure this URL matches your local server setup.

## Security Features

- **Password Hashing**: Passwords are hashed using PHP's `password_hash()` function
- **SQL Injection Prevention**: Uses PDO prepared statements
- **Input Validation**: Server-side validation for all inputs
- **Duplicate Prevention**: Checks for existing email and username before registration

## Troubleshooting

### Common Issues

1. **Connection Error**: Check if MySQL is running and credentials are correct
2. **CORS Error**: Make sure the backend URL in `authService.js` matches your setup
3. **404 Error**: Verify the backend folder is in the correct web server directory
4. **Database Error**: Ensure the database and table exist

### Debug Mode

To enable debug mode, add this to the top of PHP files:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## File Structure

```
backend/
├── config/
│   └── database.php          # Database connection configuration
├── signup.php               # User registration API endpoint
├── database_setup.sql       # Database schema
└── README.md               # This file
``` 
