<?php
require_once 'config/database.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Update existing users with proper barangay assignments
    $updates = [
        ['username' => 'Emeir', 'barangay' => 'North Centro (Poblacion)'],
        ['username' => 'Emiruuu', 'barangay' => 'South Centro (Poblacion)'], 
        ['username' => 'garbage', 'barangay' => 'North Centro (Poblacion)'],
        ['username' => 'truck', 'barangay' => 'North Centro (Poblacion)'],
        ['username' => 'barangay', 'barangay' => 'North Centro (Poblacion)']
    ];
    
    foreach ($updates as $update) {
        $stmt = $pdo->prepare("UPDATE users SET assignedArea = ? WHERE username = ?");
        $stmt->execute([$update['barangay'], $update['username']]);
        echo "Updated user " . $update['username'] . " with barangay: " . $update['barangay'] . "\n";
    }
    
    // Show all users with their assigned areas
    $stmt = $pdo->query("SELECT id, username, fullName, role, assignedArea FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nCurrent users:\n";
    foreach ($users as $user) {
        echo "ID: {$user['id']}, Username: {$user['username']}, Name: {$user['fullName']}, Role: {$user['role']}, Area: {$user['assignedArea']}\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
