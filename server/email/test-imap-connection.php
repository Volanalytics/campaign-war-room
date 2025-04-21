<?php
/**
 * IMAP Connection Test Tool for Action Hub
 * 
 * This script tests the connection to your IMAP server and displays
 * information about the mailbox to help with troubleshooting.
 * 
 * Usage: Run this script directly in a browser or from the command line.
 * For security, remove or restrict access to this script after testing.
 */

// Email configuration - UPDATE THESE VALUES
$email_config = [
    'host'     => 'imap.titan.email', // IMAP server host
    'port'     => 993,                // IMAP port (usually 993 for SSL)
    'username' => 'campaign101@voterdatahouse.com', // Email address
    'password' => '2026Braden09#',    // Email password
    'mailbox'  => 'INBOX',            // Mailbox to check
    'ssl'      => true                // Use SSL/TLS
];

// Determine if script is running in browser or CLI
$is_cli = (php_sapi_name() === 'cli');

// Function to output messages appropriately based on environment
function output($message, $is_error = false) {
    global $is_cli;
    
    if ($is_cli) {
        echo ($is_error ? "ERROR: " : "") . $message . PHP_EOL;
    } else {
        echo ($is_error ? "<strong style='color:red'>ERROR:</strong> " : "") . 
             htmlspecialchars($message) . "<br>" . PHP_EOL;
    }
}

// Display header
if (!$is_cli) {
    echo "<!DOCTYPE html>
<html>
<head>
    <title>IMAP Connection Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background-color: #f9f9f9; padding: 10px; border-radius: 5px; overflow: auto; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>IMAP Connection Test Tool</h1>
            <p>This tool tests your IMAP connection settings for the Action Hub email polling feature.</p>
        </div>
";
}

output("IMAP Connection Test Started");
output("PHP Version: " . phpversion());

// Check if IMAP extension is loaded
if (!extension_loaded('imap')) {
    output("The IMAP extension is not loaded in PHP. Please install or enable it.", true);
    if (!$is_cli) {
        echo "<div class='section'>
            <h2>How to Enable IMAP</h2>
            <p>For Debian/Ubuntu:</p>
            <pre>sudo apt-get install php-imap\nsudo phpenmod imap\nsudo service apache2 restart</pre>
            <p>For CentOS/RHEL:</p>
            <pre>sudo yum install php-imap\nsudo systemctl restart php-fpm</pre>
        </div>";
    }
    exit(1);
}

output("IMAP extension is loaded ✓");

// Connect to IMAP server
$mailbox_string = '{' . $email_config['host'] . ':' . $email_config['port'];

// Add SSL if needed
if ($email_config['ssl']) {
    $mailbox_string .= '/imap/ssl';
    $mailbox_string .= '/novalidate-cert'; // Add this for testing, remove in production
}

// Complete the mailbox string
$mailbox_string .= '}' . $email_config['mailbox'];

output("Attempting to connect to: " . $mailbox_string);

// Suppress warnings for connection attempt
$old_error_reporting = error_reporting();
error_reporting(0);

// Try to connect to the mailbox
$inbox = @imap_open($mailbox_string, $email_config['username'], $email_config['password']);
$connection_error = imap_last_error();

// Restore error reporting
error_reporting($old_error_reporting);

if (!$inbox) {
    output("Failed to connect to mailbox: " . $connection_error, true);
    
    // Provide troubleshooting information
    if (!$is_cli) {
        echo "<div class='section'>
            <h2>Troubleshooting Tips</h2>
            <ul>
                <li>Verify your IMAP server settings (host, port, SSL)</li>
                <li>Check your username and password</li>
                <li>Make sure IMAP is enabled for your email account</li>
                <li>For Gmail, you may need to enable 'Less secure app access' or create an App Password</li>
                <li>Try connecting with an email client to verify credentials</li>
                <li>Check if your server allows outgoing connections to the IMAP port</li>
            </ul>
        </div>";
    }
    exit(1);
}

output("Successfully connected to mailbox ✓", false);

// Display mailbox information
$check = imap_check($inbox);
output("Mailbox statistics:");
output("  - Messages: " . $check->Nmsgs);
output("  - Recent messages: " . $check->Recent);

// List available mailboxes
$mailboxes = imap_list($inbox, '{' . $email_config['host'] . ':' . $email_config['port'] . '}', '*');
output("Available mailboxes:");
if ($mailboxes) {
    foreach ($mailboxes as $mailbox) {
        // Clean up the mailbox name for display
        $mailbox_name = str_replace('{' . $email_config['host'] . ':' . $email_config['port'] . '}', '', $mailbox);
        output("  - " . $mailbox_name);
    }
} else {
    output("  No mailboxes found", true);
}

// Check if Processed folder exists
$processed_folder = 'Processed';
$has_processed_folder = false;

foreach ($mailboxes as $mailbox) {
    if (strpos($mailbox, $processed_folder) !== false) {
        $has_processed_folder = true;
        break;
    }
}

if ($has_processed_folder) {
    output("'Processed' folder exists ✓");
} else {
    output("'Processed' folder does not exist. The script will attempt to create it when run.");
}

// Test searching for unseen messages
$emails = imap_search($inbox, 'UNSEEN');
if ($emails) {
    $email_count = count($emails);
    output("Found $email_count unread message(s) ✓");
    
    // Show sample email headers
    if ($email_count > 0) {
        $email_number = $emails[0];
        $header = imap_headerinfo($inbox, $email_number);
        
        output("Sample email details:");
        output("  - From: " . $header->fromaddress);
        output("  - Subject: " . $header->subject);
        output("  - Date: " . $header->date);
    }
} else {
    output("No unread messages found. This is normal if you have no new emails.");
}

// Close the connection
imap_close($inbox);
output("Connection closed successfully");
output("IMAP test completed successfully ✓");

// Display footer for HTML output
if (!$is_cli) {
    echo "<div class='section'>
        <h2>Next Steps</h2>
        <p>If all tests passed, you can now set up the cron job to run the poll-email.php script:</p>
        <pre>*/5 * * * * php " . dirname(__FILE__) . "/poll-email.php</pre>
        <p><strong>Important:</strong> Remember to update the actual email credentials in the poll-email.php script.</p>
    </div>
    </div>
</body>
</html>";
}
?>
