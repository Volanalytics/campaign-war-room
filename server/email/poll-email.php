<?php


// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log file for tracking script execution
$log_file = __DIR__ . '/supabase-poll-email.log';

// Function to log messages
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

// Start logging
log_message("Email polling started with Supabase API integration");

// Supabase configuration - UPDATE THESE VALUES
$supabase_url = 'https://xhqzjelmxblchcdcdigv.supabase.co';  // Your Supabase URL
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXpqZWxteGJsY2hjZGNkaWd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg0MjA3MCwiZXhwIjoyMDYwNDE4MDcwfQ.pCwzDz-U2Xd8thvm-uXhywKuUycu7W45BYnjuZ2Wk_o';  // Your Supabase API key

// Email configuration - UPDATE THESE VALUES
$email_config = [
    'host'     => 'imap.titan.email', // Titan Mail IMAP server
    'port'     => 993,                // IMAP port with SSL
    'username' => 'campaign101@voterdatahouse.com', // Your email address
    'password' => '2026Braden09#',     // Your email password
    'mailbox'  => 'INBOX',            // Mailbox to check
    'ssl'      => true,               // Use SSL/TLS
    'processed_folder' => 'Processed' // Folder to move processed emails to
];

// Check if IMAP extension is loaded
if (!extension_loaded('imap')) {
    log_message("ERROR: The IMAP extension is not loaded in PHP. Using mock emails instead.");
    insertMockEmails();
    exit;
}

// Connect to IMAP server
$mailbox_string = '{' . $email_config['host'] . ':' . $email_config['port'];

// Add SSL if needed
if ($email_config['ssl']) {
    $mailbox_string .= '/imap/ssl/novalidate-cert'; // Added novalidate-cert for Titan Mail
}

// Complete the mailbox string
$mailbox_string .= '}' . $email_config['mailbox'];

// Try to connect to the mailbox
try {
    log_message("Connecting to mailbox: $mailbox_string");
    $inbox = @imap_open($mailbox_string, $email_config['username'], $email_config['password']);

    if (!$inbox) {
        throw new Exception("Failed to connect to mailbox: " . imap_last_error());
    }
    
    log_message("Connected to mailbox successfully");
    
    // Create the processed folder if it doesn't exist
    if (!imap_list($inbox, '{' . $email_config['host'] . ':' . $email_config['port'] . '}', $email_config['processed_folder'])) {
        imap_createmailbox($inbox, '{' . $email_config['host'] . ':' . $email_config['port'] . '}' . $email_config['processed_folder']);
        log_message("Created processed folder: " . $email_config['processed_folder']);
    }
    
    // Search for unread messages
    $emails = imap_search($inbox, 'UNSEEN');
    
    if (!$emails) {
        log_message("No new emails found");
        imap_close($inbox);
        exit;
    }
    
    log_message("Found " . count($emails) . " new email(s)");
    
    // Process each email
    foreach ($emails as $email_number) {
        log_message("Processing email #$email_number");
        
        // Get email headers
        $header = imap_headerinfo($inbox, $email_number);
        
        // Extract email details
        $sender = $header->from[0]->mailbox . '@' . $header->from[0]->host;
        $recipient = $header->to[0]->mailbox . '@' . $header->to[0]->host;
        $subject = $header->subject;
        $date = date('Y-m-d H:i:s', strtotime($header->date));
        
        // Get email body
        $structure = imap_fetchstructure($inbox, $email_number);
        $body = "";
        
        if (isset($structure->parts) && count($structure->parts)) {
            for ($i = 0; $i < count($structure->parts); $i++) {
                $part = $structure->parts[$i];
                
                // Look for plain text parts
                if ($part->subtype == 'PLAIN') {
                    $body = imap_fetchbody($inbox, $email_number, $i + 1);
                    
                    // Decode if necessary
                    if ($part->encoding == 3) { // 3 = BASE64
                        $body = base64_decode($body);
                    } else if ($part->encoding == 4) { // 4 = QUOTED-PRINTABLE
                        $body = quoted_printable_decode($body);
                    }
                    
                    break;
                }
            }
        } else {
            // Email doesn't have parts, get the whole body
            $body = imap_body($inbox, $email_number);
            
            // Decode if necessary
            if ($structure->encoding == 3) { // 3 = BASE64
                $body = base64_decode($body);
            } else if ($structure->encoding == 4) { // 4 = QUOTED-PRINTABLE
                $body = quoted_printable_decode($body);
            }
        }
        
        // Clean the body - remove email forwarding or reply prefixes
        $body = preg_replace('/^>+\s/m', '', $body);
        
        log_message("Email details - From: $sender, To: $recipient, Subject: $subject");
        
        // Process the email and insert into Supabase
        try {
            // Determine category and action type
            $category = determineCategory($subject, $body);
            $action_type = determineActionType($subject, $body);
            
            log_message("Categorized as: $category, Action type: $action_type");
            
            // Create post data for Supabase
            $postData = [
                'title' => $subject,
                'content' => $body,
                'sender' => $sender,
                'recipient' => $recipient,
                'category' => $category,
                'action_type' => $action_type,
                'status' => 'new',
                'created_at' => date('c') // ISO 8601 format
            ];
            
            // Insert into Supabase using cURL
            $result = insertIntoSupabase($postData);
            
            if ($result) {
                log_message("Email successfully inserted into Supabase");
                
                // Move the email to the processed folder
                if (imap_mail_move($inbox, $email_number, $email_config['processed_folder'])) {
                    log_message("Email moved to processed folder");
                } else {
                    log_message("Failed to move email: " . imap_last_error());
                }
            } else {
                log_message("Failed to insert into Supabase");
            }
        } catch (Exception $e) {
            log_message("Error processing email: " . $e->getMessage());
        }
    }
    
    // Close the connection
    imap_expunge($inbox);
    imap_close($inbox);
    log_message("Email polling completed");
    
} catch (Exception $e) {
    log_message("Error: " . $e->getMessage());
    
    // Insert mock emails as fallback
    if (strpos($e->getMessage(), "Failed to connect to mailbox") !== false) {
        log_message("Falling back to mock emails due to IMAP connection failure");
        insertMockEmails();
    }
    
    if (isset($inbox) && $inbox) {
        imap_close($inbox);
    }
}

// Function to insert into Supabase using cURL
function insertIntoSupabase($data) {
    global $supabase_url, $supabase_key;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabase_url . '/rest/v1/posts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $supabase_key,
        'apikey: ' . $supabase_key
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    log_message("Supabase API response code: $httpCode");
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return true;
    } else {
        log_message("API Error: $response");
        return false;
    }
}

// Function to insert mock emails
function insertMockEmails() {
    log_message("Inserting mock emails as fallback");
    
    // Create a mock email
    $mockEmail = [
        'title' => 'Email System Alert: IMAP Connection Failed',
        'content' => "This is an automated message from the email polling system.\n\nThe system was unable to connect to the email server via IMAP. Please check your email settings and credentials.\n\nThis message was generated at " . date('Y-m-d H:i:s'),
        'sender' => 'system@voterdatahouse.com',
        'recipient' => 'admin@voterdatahouse.com',
        'category' => 'Urgent',
        'action_type' => 'technical_support',
        'status' => 'new',
        'created_at' => date('c')
    ];
    
    // Insert mock email
    $result = insertIntoSupabase($mockEmail);
    
    if ($result) {
        log_message("Mock email successfully inserted");
    } else {
        log_message("Failed to insert mock email");
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
    
    // Check for volunteer related content
    if (
        strpos($subject_lower, 'volunteer') !== false ||
        strpos($subject_lower, 'volunteering') !== false ||
        strpos($body_lower, 'volunteer') !== false ||
        strpos($body_lower, 'volunteers needed') !== false
    ) {
        return 'Volunteer';
    }
    
    // Check for event related content
    if (
        strpos($subject_lower, 'event') !== false ||
        strpos($subject_lower, 'meeting') !== false ||
        strpos($body_lower, 'event') !== false ||
        strpos($body_lower, 'schedule') !== false ||
        strpos($body_lower, 'calendar') !== false
    ) {
        return 'Events';
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
    
    // Check for volunteer requests
    if (
        strpos($subject_lower, 'volunteer') !== false ||
        strpos($subject_lower, 'volunteering') !== false ||
        strpos($body_lower, 'volunteer') !== false ||
        strpos($body_lower, 'volunteers needed') !== false
    ) {
        return 'volunteer_request';
    }
    
    // Check for event coordination
    if (
        strpos($subject_lower, 'event') !== false ||
        strpos($subject_lower, 'meeting') !== false ||
        strpos($body_lower, 'event') !== false ||
        strpos($body_lower, 'schedule') !== false ||
        strpos($body_lower, 'calendar') !== false
    ) {
        return 'event_coordination';
    }
    
    // Default action type
    return 'general';
}
?>
