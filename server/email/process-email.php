<?php
// Script to process incoming emails
error_log('Email processing script started');

// For testing directly through web access
$test_mode = true;

if ($test_mode) {
    // Test data
    $sender = 'test@example.com';
    $recipient = 'info@vpterdatahouse.com';
    $subject = 'Test Email';
    $body = "This is a test email body\n\nIt contains multiple lines of text.";
    
    processEmail($sender, $recipient, $subject, $body);
    echo "Test email processed";
} else {
    // Read email from stdin for pipe delivery or webhook
    $email_content = file_get_contents('php://stdin');
    
    // In a real implementation, parse the email content
    // This is a simplified example
    $sender = 'parsed@example.com';
    $recipient = 'info@vpterdatahouse.com';
    $subject = 'Parsed Subject';
    $body = 'Parsed Body';
    
    processEmail($sender, $recipient, $subject, $body);
}

// Function to process the email and store in the database
function processEmail($sender, $recipient, $subject, $body) {
    // This would normally insert into your database
    error_log("Processing email from: $sender");
    error_log("Subject: $subject");
    
    // In a real implementation, determine category and action type
    $category = 'General';
    $action_type = 'general';
    
    // Then insert into database
    error_log("Email processed successfully");
}
