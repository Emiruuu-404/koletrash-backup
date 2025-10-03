<?php
class User {
    // Database connection and table name
    private $conn;
    private $table = 'user';

    // Object Properties
    public $user_id;
    public $username;
    public $password;
    public $email;
    public $role_id;
    public $role_name;
    public $firstname;
    public $lastname;
    public $contact_num;
    public $address;
    public $barangay_id;

    // Constructor with DB
    public function __construct($db) {
        $this->conn = $db;
    }

    // Login User
    public function login() {
        $query = "SELECT u.*, up.firstname, up.lastname, up.contact_num, up.address, up.barangay_id, r.role_name
                  FROM user u
                  LEFT JOIN user_profile up ON u.user_id = up.user_id
                  LEFT JOIN role r ON u.role_id = r.role_id
                  WHERE u.username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $this->username = htmlspecialchars(strip_tags($this->username));
        $stmt->bindParam(':username', $this->username);
        $stmt->execute();
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            // Debug: log the fetched row to error log
            error_log('LOGIN FETCHED ROW: ' . print_r($row, true));
            if(password_verify($this->password, $row['password'])) {
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                $this->firstname = $row['firstname'];
                $this->lastname = $row['lastname'];
                $this->role_id = $row['role_id'];
                $this->role_name = $row['role_name'];
                $this->contact_num = $row['contact_num'];
                $this->address = $row['address'];
                $this->barangay_id = $row['barangay_id'];
                return true;
            }
        }
        // Try admin table if not found in user
        $query = "SELECT a.*, u.username, u.password, u.email, up.firstname, up.lastname, up.contact_num, up.address, up.barangay_id
                  FROM admin a
                  JOIN user u ON a.user_id = u.user_id
                  LEFT JOIN user_profile up ON a.user_id = up.user_id
                  WHERE u.username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $this->username);
        $stmt->execute();
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($this->password, $row['password'])) {
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                $this->firstname = $row['firstname'];
                $this->lastname = $row['lastname'];
                $this->role_id = null;
                $this->role_name = 'admin';
                $this->contact_num = $row['contact_num'];
                $this->address = $row['address'];
                $this->barangay_id = $row['barangay_id'];
                return true;
            }
        }
        return false;
    }

    // Check if username exists
    public function usernameExists() {
        $query = "SELECT user_id FROM user WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $this->username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Check if email exists
    public function emailExists() {
        $query = "SELECT user_id FROM user WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $this->email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Register New User
    public function create() {
        $query = "INSERT INTO user (username, password, email, role_id) VALUES (:username, :password, :email, :role_id)";
        $stmt = $this->conn->prepare($query);
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role_id = htmlspecialchars(strip_tags($this->role_id));
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':role_id', $this->role_id);
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
