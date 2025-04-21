// server/email/process-email.js
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const upload = multer();

const app = express();
const port = process.env.PORT || 3000;

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse JSON bodies
app.use(bodyParser.json());
// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
// For multipart form data (attachments)
app.use(upload.any());

// Test route
app.get('/test', (req, res) => {
  processTestEmail()
    .then(() => res.send('Test email processed successfully'))
    .catch(error => {
      console.error('Error processing test email:', error);
      res.status(500).send('Error processing test email');
    });
});

// Email webhook endpoint
app.post('/process', async (req, res) => {
  try {
    console.log('Received email payload:', JSON.stringify(req.body));
    
    // Extract email details from the webhook payload
    // This will depend on which email processing service you use
    const sender = req.body.from || req.body.sender || 'unknown@example.com';
    const recipient = req.body.to || req.body.recipient || 'info@voterdatahouse.com';
    const subject = req.body.subject || 'No Subject';
    const body = req.body.text || req.body.body || req.body.html || 'No Content';
    
    await createActionItem(sender, recipient, subject, body);
    
    res.status(200).send('Email processed successfully');
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).send('Error processing email');
  }
});

// Process a test email
async function processTestEmail() {
  // Test data
  const sender = 'test@example.com';
  const recipient = 'info@voterdatahouse.com';
  const subject = 'Test Email: Volunteer Request';
  const body = "We need 3 additional volunteers for this Saturday's canvassing effort in the Mt. Juliet area.\n\nThis is a critical area for our campaign, and we need to make personal connections with these voters before the upcoming debate. If you can help, please respond ASAP!";
  
  await createActionItem(sender, recipient, subject, body);
  console.log('Test email processed');
}

// Create an action item in the database
async function createActionItem(sender, recipient, subject, body) {
  // Determine category and action type based on content
  const category = determineCategory(subject, body);
  const action_type = determineActionType(subject, body);
  
  // Prepare the data
  const data = {
    title: subject,
    content: body,
    sender: sender,
    recipient: recipient,
    category: category,
    action_type: action_type,
    status: 'new',
    created_at: new Date().toISOString()
  };
  
  console.log('Creating action item:', data);
  
  // Send to Supabase
  const { data: result, error } = await supabase
    .from('posts')
    .insert([data]);
    
  if (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
  
  console.log('Action item created successfully:', result);
  return result;
}

// Determine category based on content
function determineCategory(subject, body) {
  const subject_lower = subject.toLowerCase();
  const body_lower = body.toLowerCase();
  
  if (subject_lower.includes('urgent') || 
      body_lower.includes('urgent') ||
      body_lower.includes('immediately')) {
    return 'Urgent';
  }
  
  if (subject_lower.includes('volunteer') || 
      body_lower.includes('volunteer') ||
      body_lower.includes('canvass')) {
    return 'Volunteer';
  }
  
  if (subject_lower.includes('social') || 
      body_lower.includes('social media') ||
      body_lower.includes('twitter') ||
      body_lower.includes('facebook')) {
    return 'Social Media';
  }
  
  if (subject_lower.includes('event') || 
      body_lower.includes('event') ||
      body_lower.includes('meeting')) {
    return 'Events';
  }
  
  if (subject_lower.includes('response') || 
      body_lower.includes('please respond') ||
      body_lower.includes('email back')) {
    return 'Email Action';
  }
  
  return 'General';
}

// Determine action type based on content
function determineActionType(subject, body) {
  const subject_lower = subject.toLowerCase();
  const body_lower = body.toLowerCase();
  
  if (subject_lower.includes('volunteer') || 
      body_lower.includes('volunteer')) {
    return 'volunteer_request';
  }
  
  if (subject_lower.includes('social') || 
      body_lower.includes('share') ||
      body_lower.includes('post')) {
    return 'social_share';
  }
  
  if (subject_lower.includes('respond') || 
      body_lower.includes('respond') ||
      body_lower.includes('reply')) {
    return 'email_response';
  }
  
  if (subject_lower.includes('event') || 
      body_lower.includes('event') ||
      body_lower.includes('organize')) {
    return 'event_coordination';
  }
  
  return 'general';
}

// Start the server
app.listen(port, () => {
  console.log(`Email processor listening at http://localhost:${port}`);
});

module.exports = app;
