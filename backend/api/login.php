<?php
file_put_contents(__DIR__ . '/debug.log', "login.php reached\n", FILE_APPEND);

ini_set('display_errors', 0); // Suppress errors in output
ini_set('log_errors', 1);     // Log errors to server logs
error_reporting(E_ALL);       // Report all errors (for logging)

// Headers - Allow all origins for development
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    file_put_contents(__DIR__ . '/debug.log', "After require_once\n", FILE_APPEND);

    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../models/User.php';

    file_put_contents(__DIR__ . '/debug.log', "After DB connect\n", FILE_APPEND);

    // Instantiate DB & connect
    $database = new Database();
    $db = $database->connect();

    if (!$db) {
        throw new Exception('Database connection failed.');
    }

    file_put_contents(__DIR__ . '/debug.log', "After User object\n", FILE_APPEND);

    // Instantiate user object
    $user = new User($db);

    file_put_contents(__DIR__ . '/debug.log', "After User instantiation\n", FILE_APPEND);

    // Get raw posted data
    $json_input = file_get_contents('php://input');
    $data = json_decode($json_input);

    // Always return debug info to see what's happening
    $debug_info = [
        'raw_input' => $json_input,
        'decoded_data' => $data,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
    ];

    if (!$data) {
        file_put_contents(__DIR__ . '/debug.log', "Invalid JSON payload: {$json_input}\n", FILE_APPEND);
    }

    // Check if username and password are set
    if (!$data || !isset($data->username) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing Required Parameters'
        ]);
        exit();
    }

    $user->username = $data->username;
    $user->password = $data->password;

    // Login user
    if ($user->login()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Login Successful',
            'data' => [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'role' => $user->role_name
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid Credentials'
        ]);
    }
} catch (Throwable $e) {
    error_log('Login endpoint error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error. Please try again later.'
    ]);
}
