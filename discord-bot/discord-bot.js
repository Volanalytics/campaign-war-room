// discord-bot.js - A bot to forward Discord messages to email
const { Client, GatewayIntentBits, Events } = require('discord.js');
const nodemailer = require('nodemailer');
const express = require('express');
require('dotenv').config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Configuration
const CONFIG = {
  // Discord configuration
  MONITORED_CHANNELS: process.env.MONITORED_CHANNELS ? process.env.MONITORED_CHANNELS.split(',') : [],
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.titan.email',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  TARGET_EMAIL: process.env.TARGET_EMAIL || 'campaign101@voterdatahouse.com',
};

// Create email transporter
const transporter = nodemailer.createTransport({
  host: CONFIG.EMAIL_HOST,
  port: CONFIG.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Function to format attachments for email
async function formatAttachments(message) {
  const attachments = [];
  
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      try {
        // Fetch the attachment buffer
        const response = await fetch(attachment.url);
        const buffer = await response.arrayBuffer();
        
        attachments.push({
          filename: attachment.name,
          content: Buffer.from(buffer),
        });
      } catch (error) {
        console.error(`Error processing attachment: ${attachment.name}`, error);
      }
    }
  }
  
  return attachments;
}

// Function to determine message category
function determineCategory(message) {
  const content = message.content.toLowerCase();
  
  if (content.includes('urgent') || content.includes('emergency') || content.includes('asap')) {
    return 'Urgent';
  } else if (content.includes('social') || content.includes('twitter') || content.includes('facebook') || content.includes('linkedin')) {
    return 'Social Media';
  } else if (content.includes('email') || content.includes('reply') || content.includes('respond')) {
    return 'Email Action';
  } else {
    return 'General';
  }
}

// Function to extract action type
function determineActionType(message) {
  const content = message.content.toLowerCase();
  
  if (content.includes('tech') || content.includes('bug') || content.includes('error') || content.includes('fix')) {
    return 'technical_support';
  } else if (content.includes('social') || content.includes('share') || content.includes('post')) {
    return 'social_share';
  } else if (content.includes('email') || content.includes('reply') || content.includes('respond')) {
    return 'email_response';
  } else {
    return 'general';
  }
}

// Handler for incoming messages
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots or from non-monitored channels
  if (message.author.bot) return;
  if (!CONFIG.MONITORED_CHANNELS.includes(message.channel.id)) {
    return;
  }
  
  log(`Received message from ${message.author.username} in channel ${message.channel.id} (#${message.channel.name}): "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`);
  
  try {
    // Get message details
    const author = message.author.username;
    const channel = message.channel.name;
    const content = message.content;
    const category = determineCategory(message);
    const actionType = determineActionType(message);
    
    log(`Categorized as: ${category}, Action type: ${actionType}`);
    
    // Format message for email
    let emailSubject = content.split('\n')[0];
    if (emailSubject.length > 100) {
      emailSubject = emailSubject.substring(0, 97) + '...';
    }
    
    // Process attachments
    const attachments = await formatAttachments(message);
    log(`Processing ${attachments.length} attachments`);
    
    // Create email content
    const emailContent = `
Discord Message from ${author} in #${channel}

${content}

---
Category: ${category}
Action Type: ${actionType}
Message ID: ${message.id}
Server: ${message.guild.name}
Time: ${new Date().toISOString()}
    `;
    
    // Send email
    const mailOptions = {
      from: CONFIG.EMAIL_USER,
      to: CONFIG.TARGET_EMAIL,
      subject: emailSubject || 'New Discord Message',
      text: emailContent,
      attachments: attachments,
    };
    
    log(`Sending email to ${CONFIG.TARGET_EMAIL} with subject: ${emailSubject || 'New Discord Message'}`);
    await transporter.sendMail(mailOptions);
    log(`Successfully forwarded message from ${author} to ${CONFIG.TARGET_EMAIL}`);
    
    // React to the message to confirm it was forwarded
    await message.react('📧');
    log('Added email reaction to message');
  } catch (error) {
    log(`Error forwarding message to email: ${error.message}`);
    try {
      await message.react('❌');
      log('Added error reaction to message');
    } catch (reactError) {
      log(`Failed to add error reaction: ${reactError.message}`);
    }
  }
});

// Function to log to file and console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Optionally log to file
  const fs = require('fs');
  fs.appendFileSync('bot-log.txt', logMessage + '\n');
}

// Login to Discord
client.login(CONFIG.DISCORD_BOT_TOKEN)
  .then(() => {
    log('Discord bot started, waiting for messages...');
    log(`Monitoring channels: ${CONFIG.MONITORED_CHANNELS.join(', ')}`);
  })
  .catch(error => {
    log(`Error connecting to Discord: ${error.message}`);
  });

// Setup Express routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Discord Email Forwarder</title></head>
      <body>
        <h1>Discord Email Forwarder</h1>
        <p>Bot Status: ${client.isReady() ? 'Online' : 'Offline'}</p>
        <p>Uptime: ${client.uptime ? Math.floor(client.uptime / 60000) + ' minutes' : 'Not connected'}</p>
        <p>Monitoring channels: ${CONFIG.MONITORED_CHANNELS.join(', ')}</p>
      </body>
    </html>
  `);
});

// Ping route to keep the service alive
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// Start Express server
app.listen(port, () => {
  log(`Web server listening at http://localhost:${port}`);
});
