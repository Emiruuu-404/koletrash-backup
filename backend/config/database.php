<?php
class Database {
    // Database Parameters
    private $host = 'localhost'; // Hostinger usually uses localhost
    private $db_name = 'u366677621_kolektrash_db'; // Replace with your actual database name
    private $username = 'u366677621_kolektrash'; // Replace with your database username
    private $password = 'Kolektrash2025'; // Replace with your database password
    private $conn;

    // Database Connect
    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            echo "Connection Error: " . $e->getMessage();
        }

        return $this->conn;
    }
}
