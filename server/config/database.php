<?php
// Database configuration

try {
    // Database connection parameters - update these with your actual database details
    $host = 'localhost';
    $dbname = 'action_hub';
    $username = 'db_user';
    $password = 'db_password';
    
    // Create PDO connection
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    
    // Set error mode
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Optional: Set default fetch mode
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // Log error
    error_log("Database connection failed: " . $e->getMessage());
    
    // In a production environment, you might want to handle this more gracefully
    if (isset($_GET['test']) && $_GET['test'] == 1) {
        // If in test mode, return JSON error
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ]);
        exit;
    } else {
        // For normal operation, just log and exit
        exit("Database connection failed. Please check the logs.");
    }
}
?>
