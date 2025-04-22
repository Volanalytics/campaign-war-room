<?php
// Script to process incoming emails and create posts in Action Hub
error_log('Email processing script started');

// Function to process the email and store in the database
function processEmail($sender, $recipient, $subject, $body) {
    error_log("Processing email from: $sender");
    error_log("Subject: $subject");
    
    // Determine category based on email content
    $category = determineCategory($subject, $body);
    $action_type = determineActionType($subject, $body);

    try {
        // Connect to the database
        $db_config = require_once __DIR__ . '/../../config/database.php';
        $pdo = new PDO(
            "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}",
            $db_config['username'],
            $db_config['password']
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Insert into posts table
        $stmt = $pdo->prepare("
            INSERT INTO posts (title, content, sender, recipient, category, action_type, status, created_at) 
            VALUES (:title, :content, :sender, :recipient, :category, :action_type, 'new', NOW())
            RETURNING id
        ");
        
        $stmt->execute([
            ':title' => $subject,
            ':content' => $body,
            ':sender' => $sender,
            ':recipient' => $recipient,
            ':category' => $category,
            ':action_type' => $action_type
        ]);
        
        $post_id = $stmt->fetchColumn();
        error_log("Created post with ID: $post_id");
        
        return true;
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    } catch (Exception $e) {
        error_log("Error processing email: " . $e->getMessage());
        return false;
    }
}

// Function to determine category based on email content
function determineCategory($subject, $body) {
    $combined = strtolower($subject . ' ' . $body);
    
    if (strpos($combined, 'urgent') !== false || 
        strpos($combined, 'emergency') !== false || 
        strpos($combined, 'asap') !== false) {
        return 'Urgent';
    } else if (strpos($combined, 'social media') !== false || 
               strpos($combined, 'twitter') !== false || 
               strpos($combined, 'facebook') !== false || 
               strpos($combined, 'linkedin') !== false) {
        return 'Social Media';
    } else if (strpos($combined, 'email action') !== false || 
               strpos($combined, 'respond') !== false || 
               strpos($combined, 'reply') !== false) {
        return 'Email Action';
    } else {
        return 'General';
    }
}

// Function to determine action type
function determineActionType($subject, $body) {
    $combined = strtolower($subject . ' ' . $body);
    
    if (strpos($combined, 'tech') !== false || 
        strpos($combined, 'bug') !== false || 
        strpos($combined, 'error') !== false || 
        strpos($combined, 'fix') !== false) {
        return 'technical_support';
    } else if (strpos($combined, 'social') !== false || 
               strpos($combined, 'share') !== false || 
               strpos($combined, 'post') !== false) {
        return 'social_share';
    } else if (strpos($combined, 'email') !== false || 
               strpos($combined, 'reply') !== false || 
               strpos($combined, 'respond') !== false) {
        return 'email_response';
    } else {
        return 'general';
    }
}

// If called directly (for testing)
if (php_sapi_name() == 'cli' || isset($_GET['test'])) {
    // Test data
    $sender = 'test@example.com';
    $recipient = 'campaign101@voterdatahouse.com';
    $subject = 'Test Email';
    $body = "This is a test email body\n\nIt contains multiple lines of text.";
    
    processEmail($sender, $recipient, $subject, $body);
    echo "Test email processed";
}
