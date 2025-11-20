<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/User.php';

try {
    $database = new Database();
    $db = $database->connect();

    if (!$db) {
        throw new RuntimeException('Database connection failed.');
    }

    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid request payload.'
        ]);
        exit();
    }

    $username = isset($payload['username']) ? trim((string)$payload['username']) : '';
    $password = isset($payload['password']) ? (string)$payload['password'] : '';

    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing required parameters.'
        ]);
        exit();
    }

    $user = new User($db);
    $user->username = $username;
    $user->password = $password;

    if (!$user->login()) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid credentials.'
        ]);
        exit();
    }

    $role = $user->role_name ?: 'resident';

    // Set user online_status to 'online' after successful login
    try {
        $updateStatusStmt = $db->prepare("UPDATE user SET online_status = 'online' WHERE user_id = ?");
        $updateStatusStmt->execute([(int)$user->user_id]);
    } catch (PDOException $e) {
        // If online_status column doesn't exist yet, log warning but don't fail login
        if (strpos($e->getMessage(), 'online_status') !== false) {
            error_log('Warning: online_status column not found. Please run the database migration.');
        } else {
            error_log('Failed to update online_status: ' . $e->getMessage());
        }
    } catch (Exception $e) {
        // Log error but don't fail login if online_status column doesn't exist yet
        error_log('Failed to update online_status: ' . $e->getMessage());
    }

    // Issue a JWT so the client can access protected endpoints using the same login flow.
    $token = kolektrash_issue_access_token([
        'user_id' => (int)$user->user_id,
        'username' => $user->username,
        'role' => strtolower($role)
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Login Successful',
        'data' => [
            'user_id' => $user->user_id,
            'username' => $user->username,
            'email' => $user->email,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'role' => $role
        ],
        'access_token' => $token['token'],
        'token_type' => 'Bearer',
        'expires_in' => $token['expires_in']
    ]);
} catch (Throwable $e) {
    error_log('Login endpoint error: ' . $e->getMessage());
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    $logFile = $logDir . '/login_errors.log';
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
