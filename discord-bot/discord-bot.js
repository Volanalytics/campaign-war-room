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

// Debug event for all message creation
client.on(Events.MessageCreate, message => {
  console.log(`[DEBUG] Message received in channel: ${message.channel.id}`);
  
  if (message.channel.id === '798021611764449283') {
    console.log(`[DEBUG] Message in target #general channel: "${message.content.substring(0, 50)}..."`);
    
    // Check if bot can see the message properly
    if (message.content) {
      console.log('[DEBUG] Message content is visible to bot');
    } else {
      console.log('[DEBUG] Message content is NOT visible to bot - check Message Content Intent');
    }
    
    // Check if bot has reaction permissions
    const permissions = message.channel.permissionsFor(client.user);
    if (permissions && permissions.has('AddReactions')) {
      console.log('[DEBUG] Bot has permission to add reactions');
    } else {
      console.log('[DEBUG] Bot does NOT have permission to add reactions');
    }
  }
});

// Handler for incoming messages
client.on(Events.MessageCreate, async message => {
  // Skip messages from bots except for URL-only posts from news bots
  if (message.author.bot && 
      !(message.content.startsWith('http') && message.embeds.length > 0)) {
    console.log(`[DEBUG] Ignoring non-URL message from bot: ${message.author.username}`);
    return;
  }
  
  // Ignore messages from non-monitored channels
  if (!CONFIG.MONITORED_CHANNELS.includes(message.channel.id)) {
    console.log(`[DEBUG] Ignoring message in non-monitored channel: ${message.channel.id}`);
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

// Log when the bot connects to Discord
client.on(Events.ClientReady, () => {
  console.log(`[DEBUG] Logged in as ${client.user.tag}!`);
  console.log(`[DEBUG] Bot is a member of ${client.guilds.cache.size} servers`);
  
  // List all available channels the bot can see
  console.log('[DEBUG] Available channels:');
  client.channels.cache.forEach(channel => {
    if (channel.type === 0) { // 0 is GUILD_TEXT
      console.log(`[DEBUG] - #${channel.name}: ${channel.id}`);
    }
  });
});

// Function to log to file and console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Optionally log to file
  try {
    const fs = require('fs');
    const logsDir = './logs';
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    // Get current date for log file name
    const today = new Date().toISOString().split('T')[0];
    fs.appendFileSync(`${logsDir}/bot-log-${today}.txt`, logMessage + '\n');
  } catch (error) {
    console.error(`[ERROR] Failed to write to log file: ${error.message}`);
  }
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

// Debug route to show detailed information
app.get('/debug', (req, res) => {
  const monitoredChannels = CONFIG.MONITORED_CHANNELS.map(id => {
    const channel = client.channels.cache.get(id);
    return channel ? `#${channel.name} (${id})` : `Unknown channel (${id})`;
  });
  
  res.json({
    botStatus: client.isReady() ? 'Online' : 'Offline',
    uptime: client.uptime ? Math.floor(client.uptime / 60000) + ' minutes' : 'Not connected',
    monitoringChannels: CONFIG.MONITORED_CHANNELS,
    resolvedChannels: monitoredChannels,
    availableChannels: Array.from(client.channels.cache
      .filter(channel => channel.type === 0)
      .map(channel => ({ name: channel.name, id: channel.id })))
  });
});

// Ping route to keep the service alive
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// Start Express server
app.listen(port, () => {
  log(`Web server listening at http://localhost:${port}`);
});
