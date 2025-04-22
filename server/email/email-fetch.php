<?php
// fetch-emails.php - Script to fetch emails from campaign101@voterdatahouse.com
// and process them for Action Hub

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log function
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";
    
    // Write to log file
    file_put_contents('email-fetch.log', $logMessage, FILE_APPEND);
    
    // Also output to console if running from CLI
    if (php_sapi_name() == 'cli') {
        echo $logMessage;
    }
}

// Initialize
logMessage('Starting email fetch process');

// Email configuration
$email_config = [
    'host' => 'imap.titan.email',     // IMAP server for Titan Email
    'port' => 993,                     // IMAP port with SSL
    'username' => 'campaign101@voterdatahouse.com',
    'password' => getenv('EMAIL_PASS'), // Get from environment variable
    'mailbox' => 'INBOX',              // Mailbox to check
    'processed_mailbox' => 'Processed' // Where to move processed emails
];

// Validate credentials
if (empty($email_config['password'])) {
    logMessage('ERROR: Email password not found in environment variables');
    exit(1);
}

// Connect to the mailbox
logMessage('Connecting to mailbox ' . $email_config['username']);
$mailbox = "{" . $email_config['host'] . ":" . $email_config['port'] . "/imap/ssl}";
$connection = imap_open($mailbox . $email_config['mailbox'], 
                         $email_config['username'], 
                         $email_config['password']);

if (!$connection) {
    logMessage('ERROR: Connection failed: ' . imap_last_error());
    exit(1);
}

// Check if processed folder exists, create if not
$mailboxes = imap_list($connection, $mailbox, "*");
$processedExists = false;
foreach ($mailboxes as $existingMailbox) {
    if (strpos($existingMailbox, $email_config['processed_mailbox']) !== false) {
        $processedExists = true;
        break;
    }
}

if (!$processedExists) {
    logMessage('Creating Processed folder');
    imap_createmailbox($connection, $mailbox . $email_config['processed_mailbox']);
}

// Search for all unseen messages
logMessage('Searching for unread messages');
$emails = imap_search($connection, 'UNSEEN');

if (!$emails) {
    logMessage('No new emails found');
    imap_close($connection);
    exit(0);
}

// Process each email
logMessage('Found ' . count($emails) . ' new emails');
foreach ($emails as $email_id) {
    logMessage("Processing email ID: $email_id");
    
    // Get email headers
    $header = imap_headerinfo($connection, $email_id);
    
    // Get email details
    $sender = $header->from[0]->mailbox . '@' . $header->from[0]->host;
    $subject = $header->subject;
    $date = date('Y-m-d H:i:s', strtotime($header->date));
    
    // Get email body
    $structure = imap_fetchstructure($connection, $email_id);
    $body = '';
    
    if (!isset($structure->parts) || !$structure->parts) {
        // Simple message
        $body = imap_body($connection, $email_id);
    } else {
        // Multipart message
        $body = getMessageBody($connection, $email_id, $structure);
    }
    
    // Process the email
    logMessage("Email from: $sender, Subject: $subject");
    
    try {
        // Call our existing process-email.php functionality
        include_once 'process-email.php';
        
        // Assuming processEmail function exists in process-email.php
        processEmail($sender, 'campaign101@voterdatahouse.com', $subject, $body);
        logMessage("Email successfully processed");
        
        // Mark as read
        imap_setflag_full($connection, $email_id, "\\Seen");
        
        // Move to processed folder
        imap_mail_move($connection, $email_id, $email_config['processed_mailbox']);
    } catch (Exception $e) {
        logMessage("ERROR processing email: " . $e->getMessage());
    }
}

// Expunge to actually delete/move the emails
imap_expunge($connection);

// Close the connection
imap_close($connection);
logMessage('Email fetch process completed');

// Function to extract email body from multipart messages
function getMessageBody($connection, $message_id, $structure, $part_number = '') {
    $body = '';
    
    if ($structure->type == 0) { // This is text
        if ($part_number) {
            $body = imap_fetchbody($connection, $message_id, $part_number);
        } else {
            $body = imap_body($connection, $message_id);
        }
        
        // Decode if needed
        if ($structure->encoding == 3) { // Base64
            $body = base64_decode($body);
        } elseif ($structure->encoding == 4) { // Quoted-printable
            $body = quoted_printable_decode($body);
        }
        
        // Convert charset if needed
        if (isset($structure->parameters) && is_array($structure->parameters)) {
            foreach ($structure->parameters as $param) {
                if (strtolower($param->attribute) == 'charset' && strtolower($param->value) != 'utf-8') {
                    $body = iconv($param->value, 'UTF-8//IGNORE', $body);
                    break;
                }
            }
        }
    } elseif ($structure->type == 1) { // This is multipart
        foreach ($structure->parts as $index => $part) {
            $prefix = $part_number ? $part_number . '.' : '';
            $currentPartNumber = $prefix . ($index + 1);
            $body .= getMessageBody($connection, $message_id, $part, $currentPartNumber);
        }
    }
    
    return $body;
}
