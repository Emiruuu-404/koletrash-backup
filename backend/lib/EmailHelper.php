<?php
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../config/email.php';

class EmailHelper {
    private $mailer;
    
    public function __construct() {
        $this->mailer = new PHPMailer(true);
        $this->setupSMTP();
    }
    
    private function setupSMTP() {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = SMTP_HOST;
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = SMTP_USERNAME;
            $this->mailer->Password = SMTP_PASSWORD;
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = SMTP_PORT;
            $this->mailer->CharSet = EMAIL_CHARSET;
            $this->mailer->Encoding = EMAIL_ENCODING;
            
            // SSL/TLS settings to fix certificate issues
            $this->mailer->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            // Debug SMTP connection
            $this->mailer->SMTPDebug = 2; // Enable debug output
            $this->mailer->Debugoutput = 'error_log'; // Log to error log
            
            // Default sender
            $this->mailer->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            
        } catch (Exception $e) {
            throw new Exception("Email setup failed: " . $e->getMessage());
        }
    }
    
    public function sendPasswordResetCode($email, $username, $resetCode, $expiryTime) {
        try {
            // Recipient
            $this->mailer->addAddress($email);
            
            // Subject
            $this->mailer->Subject = 'Password Reset Code - KoleTrash System';
            
            // HTML Body
            $htmlBody = $this->getPasswordResetHTML($username, $resetCode, $expiryTime);
            $this->mailer->isHTML(true);
            $this->mailer->Body = $htmlBody;
            
            // Plain text body
            $textBody = $this->getPasswordResetText($username, $resetCode, $expiryTime);
            $this->mailer->AltBody = $textBody;
            
            // Send email
            $this->mailer->send();
            
            return true;
            
        } catch (Exception $e) {
            throw new Exception("Failed to send email: " . $e->getMessage());
        }
    }
    
    private function getPasswordResetHTML($username, $resetCode, $expiryTime) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Password Reset Code</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .code-box { background: #333; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; }
                .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class='content'>
                    <p>Hello <strong>{$username}</strong>,</p>
                    
                    <p>We received a request to reset your password for your KoleTrash System account.</p>
                    
                    <p>Your password reset code is:</p>
                    
                    <div class='code-box'>
                        {$resetCode}
                    </div>
                    
                    <div class='warning'>
                        <strong>⚠️ Important:</strong>
                        <ul>
                            <li>This code will expire in 15 minutes</li>
                            <li>If you didn't request this, please ignore this email</li>
                            <li>Never share this code with anyone</li>
                        </ul>
                    </div>
                    
                    <p><strong>Expires at:</strong> {$expiryTime}</p>
                    
                    <p>Enter this code in the password reset form to continue with your password reset.</p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <p>Best regards,<br>
                    <strong>KoleTrash System Team</strong></p>
                </div>
                <div class='footer'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getPasswordResetText($username, $resetCode, $expiryTime) {
        return "
Password Reset Request - KoleTrash System

Hello {$username},

We received a request to reset your password for your KoleTrash System account.

Your password reset code is: {$resetCode}

IMPORTANT:
- This code will expire in 15 minutes
- If you didn't request this, please ignore this email
- Never share this code with anyone

Expires at: {$expiryTime}

Enter this code in the password reset form to continue with your password reset.

If you have any questions, please contact our support team.

Best regards,
KoleTrash System Team

This is an automated message. Please do not reply to this email.
        ";
    }
}
?>
