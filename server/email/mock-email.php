<?php
/**
 * Mock Email Processing Script for Action Hub
 * 
 * This script simulates receiving emails by directly inserting records
 * into your Supabase database. Use this for testing when the IMAP
 * extension is not available.
 */

// Log file for tracking script execution
$log_file = __DIR__ . '/mock-email.log';

// Function to log messages
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

// Start logging
log_message("Mock email processing started");

// Supabase configuration - UPDATE THESE VALUES
$supabase_url = 'https://xhqzjelmxblchcdcdigv.supabase.co';  // Your Supabase URL
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXpqZWxteGJsY2hjZGNkaWd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg0MjA3MCwiZXhwIjoyMDYwNDE4MDcwfQ.pCwzDz-U2Xd8thvm-uXhywKuUycu7W45BYnjuZ2Wk_o';  // Your Supabase API key or service role key

// Create mock email data - change these values to test different types
$mock_emails = [
    [
        'title' => 'Urgent: Website Issue Needs Immediate Attention',
        'content' => "Our campaign website is showing errors on the donation page. Visitors are reporting they cannot complete donations.\n\nThis is affecting our fundraising efforts and needs to be fixed ASAP.\n\nError details: Payment gateway timeout after 30 seconds.",
        'sender' => 'tech@voterdatahouse.com',
        'recipient' => 'team@voterdatahouse.com',
        'category' => 'Urgent',
        'action_type' => 'technical_support',
        'status' => 'new',
        'created_at' => date('c') // Current time
    ],
    [
        'title' => 'Please share our new policy announcement',
        'content' => "We've just published our new environmental policy and need to spread the word.\n\nPlease share this on all social media channels:\n\n'Excited to announce our comprehensive environmental plan that focuses on renewable energy and conservation efforts. Read the full details at voterdatahouse.com/policy #ClimateAction'",
        'sender' => 'policy@voterdatahouse.com',
        'recipient' => 'social@voterdatahouse.com',
        'category' => 'Social Media',
        'action_type' => 'social_share',
        'status' => 'new',
        'created_at' => date('c', strtotime('-1 hour')) // 1 hour ago
    ],
    [
        'title' => 'Response needed: Media inquiry about upcoming rally',
        'content' => "We've received an inquiry from the Lebanon Tribune about our upcoming rally.\n\nThey want to know:\n1. Expected attendance numbers\n2. Main topics to be addressed\n3. Whether any special guests will be speaking\n\nCan someone draft a response by end of day? They need this for tomorrow's edition.",
        'sender' => 'media@lebanontribune.com',
        'recipient' => 'press@voterdatahouse.com',
        'category' => 'Email Action',
        'action_type' => 'email_response',
        'status' => 'new',
        'created_at' => date('c', strtotime('-3 hours')) // 3 hours ago
    ],
    [
        'title' => 'Volunteers needed for Saturday canvassing',
        'content' => "We need to organize volunteers for this Saturday's canvassing event in downtown Lebanon.\n\nWe should aim for at least 20 volunteers split into 10 teams. Each team will need:\n- Canvassing packets\n- Voter lists\n- Campaign literature\n- Water bottles\n\nPlease reach out to our volunteer list and coordinate logistics.",
        'sender' => 'volunteer@voterdatahouse.com',
        'recipient' => 'team@voterdatahouse.com',
        'category' => 'Volunteer',
        'action_type' => 'volunteer_request',
        'status' => 'new',
        'created_at' => date('c', strtotime('-1 day')) // 1 day ago
    ]
];

// Process each mock email
$successful = 0;
$failed = 0;

foreach ($mock_emails as $index => $email) {
    log_message("Processing mock email #" . ($index + 1) . ": " . $email['title']);
    
    // Send to Supabase using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabase_url . '/rest/v1/posts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $supabase_key,
        'apikey: ' . $supabase_key
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        log_message("Email successfully processed with HTTP code: $httpCode");
        $successful++;
    } else {
        log_message("Failed to process email. HTTP code: $httpCode, Response: $response");
        $failed++;
    }
}

log_message("Mock email processing completed. Successful: $successful, Failed: $failed");

// Output results
echo "Mock Email Processing Results:\n";
echo "----------------------------\n";
echo "Total emails processed: " . count($mock_emails) . "\n";
echo "Successfully inserted: $successful\n";
echo "Failed to insert: $failed\n";
echo "\nCheck the log file for more details: $log_file\n";
?>
