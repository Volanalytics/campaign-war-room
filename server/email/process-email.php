<?php
// Script to process incoming emails
error_log('Email processing script started');

// Get the request data - could be from webhook, pipe, or form
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Webhook data
    $email_content = file_get_contents('php://input');
    processWebhook($email_content);
} else if (isset($_GET['test'])) {
    // Test mode
    processTestEmail();
} else {
    // Direct pipe from email server
    $email_content = file_get_contents('php://stdin');
    processEmail($email_content);
}

// Process a test email
function processTestEmail() {
    // Test data
    $sender = 'test@example.com';
    $recipient = 'info@voterdatahouse.com';
    $subject = 'Test Email: Volunteer Request';
    $body = "We need 3 additional volunteers for this Saturday's canvassing effort in the Mt. Juliet area.\n\nThis is a critical area for our campaign, and we need to make personal connections with these voters before the upcoming debate. If you can help, please respond ASAP!";
    
    createActionItem($sender, $recipient, $subject, $body);
    echo "Test email processed";
}

// Process a webhook payload
function processWebhook($payload) {
    // This would be customized based on your email service's webhook format
    $data = json_decode($payload, true);
    
    // Extract email details - format depends on your email service
    $sender = $data['from'] ?? 'unknown@example.com';
    $recipient = $data['to'] ?? 'info@voterdatahouse.com';
    $subject = $data['subject'] ?? 'No Subject';
    $body = $data['body-plain'] ?? 'No Content';
    
    createActionItem($sender, $recipient, $subject, $body);
    echo "Webhook processed";
}

// Process raw email content
function processEmail($email_content) {
    // Simple parsing for demonstration
    // In a real app, you'd use a library like Mail_mimeDecode
    $sender = extractHeader($email_content, 'From');
    $recipient = extractHeader($email_content, 'To');
    $subject = extractHeader($email_content, 'Subject');
    
    // Extract body (simple approach)
    $parts = explode("\r\n\r\n", $email_content, 2);
    $body = $parts[1] ?? '';
    
    createActionItem($sender, $recipient, $subject, $body);
}

// Helper function to extract headers
function extractHeader($email, $header) {
    if (preg_match('/^' . $header . ': (.*)$/m', $email, $matches)) {
        return $matches[1];
    }
    return '';
}

// Create an action item in the database
function createActionItem($sender, $recipient, $subject, $body) {
    // Determine category and action type based on content
    $category = determineCategory($subject, $body);
    $action_type = determineActionType($subject, $body);
    
    // Connect to Supabase using API (since this is PHP)
    $supabase_url = getenv('SUPABASE_URL');
    $supabase_key = getenv('SUPABASE_KEY');
    
    // Prepare the data
    $data = [
        'title' => $subject,
        'content' => $body,
        'sender' => $sender,
        'recipient' => $recipient,
        'category' => $category,
        'action_type' => $action_type,
        'status' => 'new',
        'created_at' => date('c')
    ];
    
    // Send to Supabase REST API
    $ch = curl_init($supabase_url . '/rest/v1/posts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $supabase_key,
        'apikey: ' . $supabase_key
    ]);
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    error_log("Created action item with status $status: " . substr($response, 0, 100));
    
    return $status >= 200 && $status < 300;
}

// Determine category based on content
function determineCategory($subject, $body) {
    $subject_lower = strtolower($subject);
    $body_lower = strtolower($body);
    
    if (strpos($subject_lower, 'urgent') !== false || 
        strpos($body_lower, 'urgent') !== false ||
        strpos($body_lower, 'immediately') !== false) {
        return 'Urgent';
    }
    
    if (strpos($subject_lower, 'volunteer') !== false || 
        strpos($body_lower, 'volunteer') !== false ||
        strpos($body_lower, 'canvass') !== false) {
        return 'Volunteer';
    }
    
    if (strpos($subject_lower, 'social') !== false || 
        strpos($body_lower, 'social media') !== false ||
        strpos($body_lower, 'twitter') !== false ||
        strpos($body_lower, 'facebook') !== false) {
        return 'Social Media';
    }
    
    if (strpos($subject_lower, 'event') !== false || 
        strpos($body_lower, 'event') !== false ||
        strpos($body_lower, 'meeting') !== false) {
        return 'Events';
    }
    
    if (strpos($subject_lower, 'response') !== false || 
        strpos($body_lower, 'please respond') !== false ||
        strpos($body_lower, 'email back') !== false) {
        return 'Email Action';
    }
    
    return 'General';
}

// Determine action type based on content
function determineActionType($subject, $body) {
    $subject_lower = strtolower($subject);
    $body_lower = strtolower($body);
    
    if (strpos($subject_lower, 'volunteer') !== false || 
        strpos($body_lower, 'volunteer') !== false) {
        return 'volunteer_request';
    }
    
    if (strpos($subject_lower, 'social') !== false || 
        strpos($body_lower, 'share') !== false ||
        strpos($body_lower, 'post') !== false) {
        return 'social_share';
    }
    
    if (strpos($subject_lower, 'respond') !== false || 
        strpos($body_lower, 'respond') !== false ||
        strpos($body_lower, 'reply') !== false) {
        return 'email_response';
    }
    
    if (strpos($subject_lower, 'event') !== false || 
        strpos($body_lower, 'event') !== false ||
        strpos($body_lower, 'organize') !== false) {
        return 'event_coordination';
    }
    
    return 'general';
}
?>
