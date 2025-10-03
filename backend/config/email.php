<?php
// Email configuration for PHPMailer
// Gmail SMTP settings

// Gmail account credentials
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'YOUR_EMAIL@gmail.com');  // Replace with your Gmail
define('SMTP_PASSWORD', 'YOUR_APP_PASSWORD');     // Replace with your Gmail app password
define('SMTP_FROM_EMAIL', 'YOUR_EMAIL@gmail.com'); // Replace with your Gmail
define('SMTP_FROM_NAME', 'KoleTrash System');

// Email settings
define('EMAIL_CHARSET', 'UTF-8');
define('EMAIL_ENCODING', 'base64');

// Note: For Gmail, you need to:
// 1. Enable 2-factor authentication
// 2. Generate an "App Password" (not your regular password)
// 3. Use that app password in SMTP_PASSWORD above
?>
