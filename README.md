# Campaign War Room User Guide

## Overview

Campaign War Room is an email-to-forum system that automatically converts incoming emails into actionable posts. The platform provides a centralized location for your team to manage, respond to, and track action items derived from various digital communications sources.

## Getting Started

### Accessing the System

1. Open your web browser and navigate to your Campaign War Room URL
2. The main interface will load, displaying the Action Feed with current posts

### Understanding the Interface

#### Sidebar

The left sidebar contains:

- **Categories**: Filter posts by type
  - All Posts: View all posts regardless of category
  - Urgent: High-priority items requiring immediate attention
  - Email Action: Posts requiring an email response
  - Social Media: Posts related to social media activities

- **Team Members**: Shows your team with online status indicators
  - Green dot: Team member is currently online
  - No dot: Team member is offline

- **Email Inbox Status**: Shows the connected email account and status (i.e. info@voterdatahouse.com)

#### Real-time Feeds

The main content area (Real-time Feeds) displays posts with:

- Category badges
- Status indicators (New, Completed)
- Sender information
- Time/date stamps
- Content of the original email
- Contextual action widgets

## Working with Posts

### Viewing Posts

- Posts are displayed in chronological order (newest first by default)
- Use the sort dropdown to change the sorting order
- Each post shows the original email content with sender information

### Post Actions

Depending on the post type, different action widgets are available:

#### Technical Support Posts

Technical support posts include tools for:

- Updating status (Investigating, In Progress, Resolved)
- Marking as complete
- Assigning to team members

```
Example: For website down issues, you can update the status as you investigate and resolve the problem.
```

#### Social Media Posts

Social media posts include:

- Pre-formatted content for sharing
- Direct sharing buttons for Twitter and LinkedIn
- Mark as Shared button to track completion

```
Example: For a product announcement, you can share the pre-formatted text directly to social platforms.
```

#### Email Response Posts

Email response posts include:

- Text area for drafting responses
- Send Response button
- Team assignment option

```
Example: For client inquiries, draft your response and send it directly from the platform.
```

### Post Management

For all posts, you can:

- **Mark as Complete**: Indicate that the required action has been taken
- **Assign to Team**: Delegate the post to specific team members
- **Save**: Bookmark important posts
- **Forward**: Share posts with other team members
- **Archive**: Move completed posts to the archive

## Categories and Filtering

Posts are automatically categorized based on content. Use the sidebar to filter:

- **All Posts**: Shows every post in the system
- **Urgent**: High-priority items requiring immediate attention
- **Email Action**: Posts requiring an email response
- **Social Media**: Posts related to social media sharing

The badge numbers indicate how many posts are in each category.

## Email Processing

Campaign War Room automatically processes incoming emails sent to your configured address (e.g., info@vpterdatahouse.com).

- Emails are converted to posts in real-time
- Subject lines become post titles
- Email bodies become post content
- Sender information is preserved
- Attachments are stored with the post (if configured)

## Best Practices

1. **Regular Monitoring**: Check the Campaign War Room daily for new posts
2. **Prompt Responses**: Address urgent items as soon as they appear
3. **Status Updates**: Keep post statuses current as you work on them
4. **Team Communication**: Use the assignment feature to delegate clearly
5. **Completion Tracking**: Mark posts as complete once actions are taken

## Troubleshooting

### No Posts Appearing

- Ensure the email processing script is running
- Check that emails are being sent to the correct address
- Verify database connection settings

### Action Widgets Not Working

- Ensure JavaScript is enabled in your browser
- Check for console errors in your browser's developer tools
- Verify that the API endpoints are accessible

## Administrator Guide

### Email Configuration

To configure email processing:

1. Set up email forwarding from your main inbox to the processing script
2. Update the recipient address in the processing script
3. Configure any filters for automatic categorization

### Database Setup

1. Execute the schema.sql script on your database server
2. Update database connection settings in the PHP files
3. Test the connection with the test mode in process-email.php

### Customization

You can customize categories, action types, and the UI by:

1. Modifying the CSS in style.css
2. Adding new categories in the sidebar HTML
3. Creating new action widgets in the JavaScript functions
