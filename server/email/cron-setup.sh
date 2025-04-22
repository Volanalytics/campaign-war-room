#!/bin/bash
# setup-cron.sh - Script to set up cron job for email fetching

# Create log directory if it doesn't exist
mkdir -p logs

# Make the email fetch script executable
chmod +x fetch-emails.php

# Set up environment variable for the script
# Replace with your actual email password
export EMAIL_PASS="your_titan_email_password_here"

# Write current crontab to a temporary file
crontab -l > current_crontab.tmp 2>/dev/null || echo "" > current_crontab.tmp

# Check if our job is already in the crontab
if ! grep -q "fetch-emails.php" current_crontab.tmp; then
    # Add our job to check emails every 5 minutes
    echo "# Check for new emails every 5 minutes" >> current_crontab.tmp
    echo "*/5 * * * * cd $(pwd) && php fetch-emails.php >> logs/email-fetch.log 2>&1" >> current_crontab.tmp
    
    # Install new crontab
    crontab current_crontab.tmp
    echo "Cron job installed. Emails will be checked every 5 minutes."
else
    echo "Cron job already exists."
fi

# Clean up
rm current_crontab.tmp

# Manually run the script once to test it
echo "Running email fetch script once for testing..."
php fetch-emails.php

echo "Setup complete. Check logs/email-fetch.log for details."
