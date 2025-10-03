<?php
// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

// Turn on error display temporarily for debugging
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Debug: Check if database config file exists
if (!file_exists('../config/database.php')) {
    echo json_encode(['status' => 'error', 'message' => 'Database config file not found']);
    exit;
}

// Debug: Check if database config file exists
if (!file_exists('../config/database.php')) {
    echo json_encode(['status' => 'error', 'message' => 'Database config file not found']);
    exit;
}

require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    
    if (!$pdo) {
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
        exit;
    }
} catch(Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Debug: Check raw input
$rawInput = file_get_contents('php://input');
error_log("Raw input: " . $rawInput);

$input = json_decode($rawInput, true);

// Debug: Check JSON parsing
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON parse error: " . json_last_error_msg());
    $input = $_POST;
}

$action = $input['action'] ?? '';

// Debug: Log the received data
error_log("Received input: " . print_r($input, true));
error_log("Action: " . $action);
error_log("POST data: " . print_r($_POST, true));

switch ($action) {
    case 'send_reset_code':
        handleSendResetCode($pdo, $input);
        break;
    case 'verify_reset_code':
        handleVerifyResetCode($pdo, $input);
        break;
    case 'reset_password':
        handleResetPassword($pdo, $input);
        break;
    case 'test':
        echo json_encode(['status' => 'success', 'message' => 'API is working', 'received_action' => $action]);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action: ' . $action, 'received_data' => $input]);
        break;
}

function handleSendResetCode($pdo, $input) {
    $email = $input['email'] ?? '';
    
    if (empty($email)) {
        echo json_encode(['status' => 'error', 'message' => 'Email is required']);
        return;
    }
    
    // Check if email exists in user table
    $stmt = $pdo->prepare("SELECT u.user_id, u.username, u.role_id, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Email not found in our system']);
        return;
    }
    
    // Generate 6-digit reset code
    $resetCode = sprintf('%06d', mt_rand(0, 999999));
    $expiryTime = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    
    // Store reset code in database
    $stmt = $pdo->prepare("INSERT INTO password_resets (email, reset_code, expiry_time, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE reset_code = ?, expiry_time = ?, created_at = NOW()");
    $stmt->execute([$email, $resetCode, $expiryTime, $resetCode, $expiryTime]);
    
    // Send email with reset code
    try {
        require_once '../lib/EmailHelper.php';
        $emailHelper = new EmailHelper();
        $emailHelper->sendPasswordResetCode($email, $user['username'], $resetCode, $expiryTime);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Reset code sent successfully to your email',
            'data' => [
                'email' => $email,
                'expiry_time' => $expiryTime
            ]
        ]);
    } catch (Exception $e) {
        // If email fails, still return success but log the error
        error_log("Email sending failed: " . $e->getMessage());
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Reset code generated successfully (email delivery failed)',
            'data' => [
                'reset_code' => $resetCode, // Fallback: return code in response
                'expiry_time' => $expiryTime,
                'email_error' => $e->getMessage()
            ]
        ]);
    }
}

function handleVerifyResetCode($pdo, $input) {
    $email = $input['email'] ?? '';
    $resetCode = $input['reset_code'] ?? '';
    
    if (empty($email) || empty($resetCode)) {
        echo json_encode(['status' => 'error', 'message' => 'Email and reset code are required']);
        return;
    }
    
    // Check if reset code is valid and not expired
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expiry_time > NOW() AND used = 0");
    $stmt->execute([$email, $resetCode]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reset) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid or expired reset code']);
        return;
    }
    
    // Mark code as verified (but not used yet)
    $stmt = $pdo->prepare("UPDATE password_resets SET verified = 1 WHERE id = ?");
    $stmt->execute([$reset['id']]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Reset code verified successfully'
    ]);
}

function handleResetPassword($pdo, $input) {
    $email = $input['email'] ?? '';
    $resetCode = $input['reset_code'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($email) || empty($resetCode) || empty($newPassword)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        return;
    }
    
    if (strlen($newPassword) < 6) {
        echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters long']);
        return;
    }
    
    // Verify reset code again
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expiry_time > NOW() AND verified = 1 AND used = 0");
    $stmt->execute([$email, $resetCode]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reset) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid or expired reset code']);
        return;
    }
    
    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update user's password
    $stmt = $pdo->prepare("UPDATE user SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);
    
    // Mark reset code as used
    $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
    $stmt->execute([$reset['id']]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Password reset successfully'
    ]);
}
?>
