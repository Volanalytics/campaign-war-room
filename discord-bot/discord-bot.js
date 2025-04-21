// discord-bot.js - A bot to forward Discord messages to email
const { Client, GatewayIntentBits, Events } = require('discord.js');
const nodemailer = require('nodemailer');
require('dotenv').config();

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
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  TARGET_EMAIL: process.env.TARGET_EMAIL || 'info@vpterdatahouse.com',
};

// Create email transporter
const transporter = nodemailer.createTransport({
  service: CONFIG.EMAIL_SERVICE,
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS,
  },
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
  if (!CONFIG.MONITORED_CHANNELS.includes(message.channel.id)) return;
  
  try {
    // Get message details
    const author = message.author.username;
    const channel = message.channel.name;
    const content = message.content;
    const category = determineCategory(message);
    const actionType = determineActionType(message);
    
    // Format message for email
    let emailSubject = content.split('\n')[0];
    if (emailSubject.length > 100) {
      emailSubject = emailSubject.substring(0, 97) + '...';
    }
    
    // Process attachments
    const attachments = await formatAttachments(message);
    
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
    
    await transporter.sendMail(mailOptions);
    console.log(`Forwarded message from ${author} to ${CONFIG.TARGET_EMAIL}`);
    
    // React to the message to confirm it was forwarded
    await message.react('📧');
  } catch (error) {
    console.error('Error forwarding message to email:', error);
    await message.react('❌');
  }
});

// Login to Discord
client.login(CONFIG.DISCORD_BOT_TOKEN);

console.log('Discord bot started, waiting for messages...');
