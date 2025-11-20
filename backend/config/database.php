<?php
class Database {
    // Database Parameters
    private $host = 'localhost'; // Local XAMPP MySQL
    private $db_name = 'kolektrash_db'; // Local database name
    private $username = 'root'; // Default XAMPP username
    private $password = ''; // Default XAMPP password (empty)
    private $conn;

    /**
     * Returns the host values we should try when establishing a connection.
     * Some MariaDB setups disallow the literal "localhost", so we fall back
     * to the loopback IP if needed.
     */
    private function getCandidateHosts(): array
    {
        $hosts = [$this->host];
        if (strcasecmp($this->host, 'localhost') === 0) {
            $hosts[] = '127.0.0.1';
        }
        return array_values(array_unique(array_filter($hosts)));
    }

    // Database Connect
    public function connect() {
        $this->conn = null;

        foreach ($this->getCandidateHosts() as $host) {
            try {
                $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $this->db_name);
                $this->conn = new PDO(
                    $dsn,
                    $this->username,
                    $this->password,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]
                );
                return $this->conn;
            } catch(PDOException $e) {
                // Log the failed attempt and try the next candidate host
                error_log("Database connection error [host={$host}]: " . $e->getMessage());
                $this->conn = null;
            }
        }

        return null;
    }
}
