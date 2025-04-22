#!/bin/bash
# setup-cron.sh - Script to set up cron job for email fetching with Supabase integration

# Create log directory if it doesn't exist
mkdir -p logs

# Create config directory if it doesn't exist
mkdir -p ../../config

# Prompt for Supabase credentials if not already in environment
if [ -z "$SUPABASE_HOST" ]; then
    echo "Please enter your Supabase host (default: db.xhqzjelmxblchcdcdigv.supabase.co):"
    read -e -i "db.xhqzjelmxblchcdcdigv.supabase.co" SUPABASE_HOST
    export SUPABASE_HOST
fi

if [ -z "$SUPABASE_PORT" ]; then
    echo "Please enter your Supabase port (default: 5432):"
    read -e -i "5432" SUPABASE_PORT
    export SUPABASE_PORT
fi

if [ -z "$SUPABASE_DB_NAME" ]; then
    echo "Please enter your Supabase database name (default: postgres):"
    read -e -i "postgres" SUPABASE_DB_NAME
    export SUPABASE_DB_NAME
fi

if [ -z "$SUPABASE_USER" ]; then
    echo "Please enter your Supabase username (default: postgres):"
    read -e -i "postgres" SUPABASE_USER
    export SUPABASE_USER
fi

if [ -z "$SUPABASE_PASS" ]; then
    echo "Please enter your Supabase password:"
    read -s SUPABASE_PASS
    export SUPABASE_PASS
    echo
fi

if [ -z "$EMAIL_PASS" ]; then
    echo "Please enter your Titan email password for campaign101@voterdatahouse.com:"
    read -s EMAIL_PASS
    export EMAIL_PASS
    echo
fi

# Test database connection
echo "Testing Supabase connection..."
php -r "
\$config = [
    'host' => getenv('SUPABASE_HOST'),
    'port' => getenv('SUPABASE_PORT'),
    'dbname' => getenv('SUPABASE_DB_NAME'),
    'username' => getenv('SUPABASE_USER'),
    'password' => getenv('SUPABASE_PASS')
];
try {
    \$dsn = \"pgsql:host={\$config['host']};port={\$config['port']};dbname={\$config['dbname']};sslmode=require\";
    \$pdo = new PDO(\$dsn, \$config['username'], \$config['password']);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo \"Supabase connection successful!\\n\";
} catch (PDOException \$e) {
    echo \"Supabase connection failed: \" . \$e->getMessage() . \"\\n\";
    exit(1);
}
"

# If the connection test failed, exit
if [ $? -ne 0 ]; then
    echo "Failed to connect to Supabase. Please check your credentials and try again."
    exit 1
fi

# Create a .env file for future runs
echo "Creating .env file with credentials..."
cat > .env << EOL
# Supabase Database Connection
SUPABASE_HOST=${SUPABASE_HOST}
SUPABASE_PORT=${SUPABASE_PORT}
SUPABASE_DB_NAME=${SUPABASE_DB_NAME}
SUPABASE_USER=${SUPABASE_USER}
SUPABASE_PASS=${SUPABASE_PASS}

# Email Configuration
EMAIL_PASS=${EMAIL_PASS}
EOL

# Make the email fetch script executable
chmod +x fetch-emails.php

# Write current crontab to a temporary file
crontab -l > current_crontab.tmp 2>/dev/null || echo "" > current_crontab.tmp

# Check if our job is already in the crontab
if ! grep -q "fetch-emails.php" current_crontab.tmp; then
    # Add our job to check emails every 5 minutes
    echo "# Check for new emails every 5 minutes" >> current_crontab.tmp
    echo "*/5 * * * * cd $(pwd) && . ./.env && php fetch-emails.php >> logs/email-fetch.log 2>&1" >> current_crontab.tmp
    
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
