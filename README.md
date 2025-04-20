# Action Hub - Email to Forum System

A simple but powerful system that converts incoming emails into actionable forum posts with action widgets.

## Features

- Email processing: Automatically converts emails to forum posts
- Action widgets: Contextual action buttons based on the content type
- Simple UI: Discord-like interface for easy navigation
- Categories: Automatic categorization of posts

## Directory Structure

- `public/` - Frontend code
  - `css/` - Stylesheets
  - `js/` - JavaScript files
- `server/` - Backend code
  - `api/` - API endpoints
  - `email/` - Email processing logic
- `database/` - Database schema and migrations

## Setup Instructions

1. Set up your database using the schema in `database/schema.sql`
2. Configure email forwarding to the `process-email.php` script
3. Deploy the files to your web server
4. Update database connection information in the PHP files

## Testing

To test the email processing functionality:
- Access the `process-email.php` script directly in your browser (test mode is enabled)
- Or send an email to your configured email address
