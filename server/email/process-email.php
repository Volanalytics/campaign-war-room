<?php
// Script to process incoming emails
error_log('Email processing script started');

// Database connection configuration
require_once __DIR__ . '/../config/database.php';

// For testing directly through web access
$test_mode = isset($_GET['test']) && $_GET['test'] == 1;

if ($test_mode) {
    // Test data
    $sender = isset($_GET['sender']) ? $_GET['sender'] : 'test@example.com';
    $recipient = isset($_GET['recipient']) ? $_GET['recipient'] : 'info@vpterdatahouse.com';
    $subject = isset($_GET['subject']) ? $_GET['subject'] : 'Test Email';
    $body = isset($_GET['body']) ? $_GET['body'] : "This is a test email body\n\nIt contains multiple lines of text.";
    
    $result = processEmail($sender, $recipient, $subject, $body);
    
    // Return JSON response for testing
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $result,
        'message' => $result ? 'Email processed successfully' : 'Failed to process email',
        'details' => [
            'sender' => $sender,
            'recipient' => $recipient,
            'subject' => $subject,
            'body_preview' => substr($body, 0, 100) . (strlen($body) > 100 ? '...' : '')
        ]
    ]);
    exit;
} else {
    // Read email from stdin for pipe delivery or webhook
    $email_content = file_get_contents('php://stdin');
    
    // In a real implementation, you would need a proper email parser library
    // This is a simplified example that assumes a specific format
    
    // Extract headers and body
    list($headers, $body) = explode("\r\n\r\n", $email_content, 2);
    
    // Parse headers (very simplified)
    $sender = '';
    $recipient = '';
    $subject = '';
    
    foreach (explode("\r\n", $headers) as $header) {
        if (strpos($header, 'From:') === 0) {
            $sender = trim(substr($header, 5));
            // Extract email from "Name <email>" format if needed
            if (preg_match('/<(.+?)>/', $sender, $matches)) {
                $sender = $matches[1];
            }
        } else if (strpos($header, 'To:') === 0) {
            $recipient = trim(substr($header, 3));
            // Extract email from "Name <email>" format if needed
            if (preg_match('/<(.+?)>/', $recipient, $matches)) {
                $recipient = $matches[1];
            }
        } else if (strpos($header, 'Subject:') === 0) {
            $subject = trim(substr($header, 8));
        }
    }
    
    // Process the email
    $result = processEmail($sender, $recipient, $subject, $body);
    error_log("Email processing result: " . ($result ? 'success' : 'failure'));
}

// Function to process the email and store in the database
function processEmail($sender, $recipient, $subject, $body) {
    global $db;
    
    error_log("Processing email from: $sender");
    error_log("Subject: $subject");
    
    // Determine category and action type based on content
    $category = determineCategory($subject, $body);
    $action_type = determineActionType($subject, $body);
    
    try {
        // Insert into the posts table
        $stmt = $db->prepare("
            INSERT INTO posts (title, content, sender, recipient, category, action_type, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'new', NOW())
        ");
        
        $stmt->execute([
            $subject,
            $body,
            $sender,
            $recipient,
            $category,
            $action_type
        ]);
        
        error_log("Email processed successfully. Post ID: " . $db->lastInsertId());
        return true;
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

// Function to determine the category based on email content
function determineCategory($subject, $body) {
    $subject_lower = strtolower($subject);
    $body_lower = strtolower($body);
    
    // Check for urgent markers
    if (
        strpos($subject_lower, 'urgent') !== false || 
        strpos($subject_lower, 'emergency') !== false ||
        strpos($subject_lower, 'asap') !== false ||
        strpos($body_lower, 'urgent') !== false
    ) {
        return 'Urgent';
    }
    
    // Check for social media related content
    if (
        strpos($subject_lower, 'social media') !== false ||
        strpos($subject_lower, 'facebook') !== false ||
        strpos($subject_lower, 'twitter') !== false ||
        strpos($subject_lower, 'linkedin') !== false ||
        strpos($body_lower, 'social media') !== false ||
        strpos($body_lower, 'share on') !== false
    ) {
        return 'Social Media';
    }
    
    // Check for email response requests
    if (
        strpos($subject_lower, 'please respond') !== false ||
        strpos($subject_lower, 'response needed') !== false ||
        strpos($body_lower, 'please respond') !== false ||
        strpos($body_lower, 'please reply') !== false ||
        strpos($body_lower, 'response needed') !== false
    ) {
        return 'Email Action';
    }
    
    // Default category
    return 'General';
}

// Function to determine the action type based on email content
function determineActionType($subject, $body) {
    $subject_lower = strtolower($subject);
    $body_lower = strtolower($body);
    
    // Check for technical support issues
    if (
        strpos($subject_lower, 'error') !== false ||
        strpos($subject_lower, 'issue') !== false ||
        strpos($subject_lower, 'problem') !== false ||
        strpos($subject_lower, 'not working') !== false ||
        strpos($body_lower, 'error') !== false ||
        strpos($body_lower, 'broken') !== false ||
        strpos($body_lower, 'fix') !== false
    ) {
        return 'technical_support';
    }
    
    // Check for social media sharing
    if (
        strpos($subject_lower, 'share') !== false ||
        strpos($subject_lower, 'post on') !== false ||
        strpos($body_lower, 'share this') !== false ||
        strpos($body_lower, 'post this') !== false
    ) {
        return 'social_share';
    }
    
    // Check for email response needed
    if (
        strpos($subject_lower, 'please respond') !== false ||
        strpos($subject_lower, 'response needed') !== false ||
        strpos($body_lower, 'please respond') !== false ||
        strpos($body_lower, 'please reply') !== false ||
        strpos($body_lower, 'response needed') !== false
    ) {
        return 'email_response';
    }
    
    // Default action type
    return 'general';
}
?>
