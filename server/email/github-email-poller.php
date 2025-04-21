<?php
/**
 * GitHub Actions Email Polling Script for Campaign Action Hub
 * 
 * This script is designed to run in GitHub Actions to process emails
 * and insert them into Supabase. It uses environment variables for 
 * configuration.
 */

// Set log file and start logging
$log_file = __DIR__ . '/github-poll-email.log';
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    echo "[$timestamp] $message" . PHP_EOL; // Output to GitHub Actions log
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

log_message("GitHub Actions email polling started");

// Get configuration from environment variables
$supabase_url = getenv('SUPABASE_URL');
$supabase_key = getenv('SUPABASE_KEY');
$email_host = getenv('EMAIL_HOST') ?: 'imap.titan.email';
$email_port = getenv('EMAIL_PORT') ?: '993';
$email_username = getenv('EMAIL_USERNAME');
$email_password = getenv('EMAIL_PASSWORD');

// Validate required environment variables
if (!$supabase_url || !$supabase_key) {
    log_message("ERROR: Missing Supabase configuration. Check GitHub secrets.");
    exit(1);
}

if (!$email_username || !$email_password) {
    log_message("ERROR: Missing email credentials. Using mock emails instead.");
    insertMockEmails();
    exit(0);
}

// Log configuration (but mask sensitive data)
log_message("Using Supabase URL: " . $supabase_url);
log_message("Email host: " . $email_host);
log_message("Email port: " . $email_port);
log_message("Email username: " . $email_username);

// Email configuration from environment variables
$email_config = [
    'host'     => $email_host,
    'port'     => (int)$email_port,
    'username' => $email_username,
    'password' => $email_password,
    'mailbox'  => 'INBOX',
    'ssl'      => true,
    'processed_folder' => 'Processed'
];

// Check if IMAP extension is loaded
if (!extension_loaded('imap')) {
    log_message("ERROR: The IMAP extension is not loaded in PHP. This should not happen in GitHub Actions.");
    log_message("Available PHP extensions: " . implode(", ", get_loaded_extensions()));
    insertMockEmails();
    exit(1);
}

log_message("IMAP extension is available");

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
    
    // Suppress warnings temporarily to catch connection issues
    $error_reporting = error_reporting(0);
    $inbox = imap_open($mailbox_string, $email_config['username'], $email_config['password']);
    error_reporting($error_reporting);
    
    if (!$inbox) {
        throw new Exception("Failed to connect to mailbox: " . imap_last_error());
    }
    
    log_message("Connected to mailbox successfully");
    
    // Verify and create processed folder if needed
    try {
        // Check if the processed folder exists
        $folders = imap_list($inbox, '{' . $email_config['host'] . ':' . $email_config['port'] . '}', '*');
        $processed_folder_exists = false;
        
        if ($folders) {
            log_message("Available folders: " . implode(", ", $folders));
            foreach ($folders as $folder) {
                if (strpos($folder, $email_config['processed_folder']) !== false) {
                    $processed_folder_exists = true;
                    break;
                }
            }
        }
        
        if (!$processed_folder_exists) {
            log_message("Creating processed folder: " . $email_config['processed_folder']);
            if (imap_createmailbox($inbox, '{' . $email_config['host'] . ':' . $email_config['port'] . '}' . $email_config['processed_folder'])) {
                log_message("Created processed folder successfully");
            } else {
                log_message("Failed to create processed folder: " . imap_last_error());
            }
        } else {
            log_message("Processed folder already exists");
        }
    } catch (Exception $e) {
        log_message("Error with processed folder: " . $e->getMessage());
        // Continue anyway - we can still process emails
    }
    
    // Search for unread messages
    $emails = imap_search($inbox, 'UNSEEN');
    
    if (!$emails) {
        log_message("No new emails found");
        // Insert a status email to confirm the workflow ran
        insertStatusEmail("No new emails found during this check.");
        imap_close($inbox);
        exit(0);
    }
    
    log_message("Found " . count($emails) . " new email(s)");
    
    // Process each email
    $processed_count = 0;
    $error_count = 0;
    
    foreach ($emails as $email_number) {
        log_message("Processing email #$email_number");
        
        try {
            // Get email headers
            $header = imap_headerinfo($inbox, $email_number);
            
            // Extract email details
            $sender = $header->from[0]->mailbox . '@' . $header->from[0]->host;
            $recipient = $header->to[0]->mailbox . '@' . $header->to[0]->host;
            $subject = $header->subject ?? '(No Subject)';
            $date = date('Y-m-d H:i:s', strtotime($header->date));
            
            log_message("Email details - From: $sender, To: $recipient, Subject: $subject, Date: $date");
            
            // Get email body
            $structure = imap_fetchstructure($inbox, $email_number);
            $body = "";
            
            if (isset($structure->parts) && count($structure->parts)) {
                // Multipart email
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
                // Simple email structure
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
            
            log_message("Successfully extracted email body");
            
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
            
            // Insert into Supabase
            $result = insertIntoSupabase($postData);
            
            if ($result) {
                log_message("Email successfully inserted into Supabase");
                $processed_count++;
                
                // Move the email to the processed folder
                if (imap_mail_move($inbox, $email_number, $email_config['processed_folder'])) {
                    log_message("Email moved to processed folder");
                } else {
                    log_message("Failed to move email: " . imap_last_error());
                    // Just mark as seen if we can't move
                    imap_setflag_full($inbox, $email_number, "\\Seen");
                }
            } else {
                log_message("Failed to insert into Supabase");
                $error_count++;
            }
        } catch (Exception $e) {
            log_message("Error processing email #$email_number: " . $e->getMessage());
            $error_count++;
        }
    }
    
    // Expunge to apply changes
    imap_expunge($inbox);
    imap_close($inbox);
    
    log_message("Email polling completed. Processed: $processed_count, Errors: $error_count");
    
    // Insert a status email if we processed emails
    if ($processed_count > 0) {
        insertStatusEmail("Successfully processed $processed_count new email(s).");
    }
    
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
    
    exit(1);
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
    $error = curl_error($ch);
    curl_close($ch);
    
    log_message("Supabase API response code: $httpCode");
    
    if ($error) {
        log_message("cURL error: $error");
        return false;
    }
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return true;
    } else {
        log_message("API Error: $response");
        return false;
    }
}

// Function to insert mock emails for fallback
function insertMockEmails() {
    log_message("Inserting mock email from GitHub Actions");
    
    // Create a mock email
    $mockEmail = [
        'title' => 'GitHub Actions: IMAP Connection Failed',
        'content' => "This is an automated message from the GitHub Actions workflow.\n\nThe system was unable to connect to the email server via IMAP. Please check your email settings and credentials.\n\nThis message was generated at " . date('Y-m-d H:i:s'),
        'sender' => 'github-actions@workflow.github.com',
        'recipient' => 'admin@voterdatahouse.com',
        'category' => 'Urgent',
        'action_type' => 'technical_support',
        'status' => 'new',
        'created_at' => date('c')
    ];
    
    // Insert mock email
    $result = insertIntoSupabase($mockEmail);
    
    if ($result) {
        log_message("Mock email successfully inserted from GitHub Actions");
    } else {
        log_message("Failed to insert mock email from GitHub Actions");
    }
}

// Function to insert a status email
function insertStatusEmail($message) {
    log_message("Inserting status email");
    
    // Create a status email
    $statusEmail = [
        'title' => 'GitHub Actions: Email Polling Status',
        'content' => "This is an automated status message from the GitHub Actions workflow.\n\n$message\n\nWorkflow ran at " . date('Y-m-d H:i:s'),
        'sender' => 'github-actions@workflow.github.com',
        'recipient' => 'admin@voterdatahouse.com',
        'category' => 'System',
        'action_type' => 'general',
        'status' => 'new',
        'created_at' => date('c')
    ];
    
    // Insert status email
    $result = insertIntoSupabase($statusEmail);
    
    if ($result) {
        log_message("Status email successfully inserted");
    } else {
        log_message("Failed to insert status email");
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