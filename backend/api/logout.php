<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->connect();

    if (!$db) {
        throw new RuntimeException('Database connection failed.');
    }

    // Get user_id from JWT token or request payload
    $user_id = null;
    
    // Try to get user_id from JWT token first
    require_once __DIR__ . '/../includes/auth.php';
    $auth_header = kolektrash_get_authorization_header();
    if ($auth_header) {
        $token = kolektrash_extract_bearer_token($auth_header);
        if ($token) {
            try {
                $decoded = kolektrash_verify_token($token);
                if (isset($decoded['user_id'])) {
                    $user_id = (int)$decoded['user_id'];
                }
            } catch (Exception $e) {
                // Token invalid or expired, try to get from payload
                error_log('Token verification failed in logout: ' . $e->getMessage());
            }
        }
    }
    
    // If not from token, try to get from request payload
    if (!$user_id) {
        $payload = json_decode(file_get_contents('php://input'), true);
        if (is_array($payload) && isset($payload['user_id'])) {
            $user_id = (int)$payload['user_id'];
        }
    }

    if (!$user_id) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'User ID is required.'
        ]);
        exit();
    }

    // Set user online_status to 'offline'
    try {
        $updateStmt = $db->prepare("UPDATE user SET online_status = 'offline' WHERE user_id = ?");
        $updateStmt->execute([$user_id]);
    } catch (PDOException $e) {
        // If online_status column doesn't exist yet, log warning but don't fail
        if (strpos($e->getMessage(), 'online_status') !== false) {
            error_log('Warning: online_status column not found. Please run the database migration.');
        } else {
            throw $e; // Re-throw if it's a different error
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Logout successful. User status set to offline.'
    ]);
} catch (Throwable $e) {
    error_log('Logout endpoint error: ' . $e->getMessage());
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    $logFile = $logDir . '/logout_errors.log';
    $logEntry = sprintf(
        "[%s] %s\n%s\n\n",
        date('c'),
        $e->getMessage(),
        $e->getTraceAsString()
    );
    @file_put_contents($logFile, $logEntry, FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error. Please try again later.'
    ]);
}

