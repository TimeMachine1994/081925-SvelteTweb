#!/usr/bin/env node

/**
 * Setup Cloudflare Live Input Webhooks
 * Run this script to configure instant stream detection
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-domain.com/api/webhooks/cloudflare/live-input';

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_ACCOUNT_ID');
  console.error('   CLOUDFLARE_API_TOKEN');
  console.error('   WEBHOOK_URL (optional)');
  process.exit(1);
}

async function setupWebhooks() {
  try {
    console.log('🔧 Setting up Cloudflare Live Input Webhooks...');
    console.log('📡 Webhook URL:', WEBHOOK_URL);

    // Create webhook subscription for live input events
    const webhookConfig = {
      target_url: WEBHOOK_URL,
      secret: process.env.CLOUDFLARE_WEBHOOK_SECRET || 'your-webhook-secret',
      events: [
        'live-input.connected',    // When encoder starts streaming
        'live-input.disconnected', // When encoder stops streaming
        'live-input.recording.ready' // When recording is processed (backup)
      ]
    };

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookConfig)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Webhook configured successfully!');
      console.log('📋 Webhook Details:', {
        id: result.result.id,
        target_url: result.result.target_url,
        events: result.result.events,
        created: result.result.created
      });
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Your webhook is now active');
      console.log('2. Start streaming in OBS');
      console.log('3. Stream status will update instantly!');
      
    } else {
      console.error('❌ Failed to configure webhook:', result);
      console.error('Response:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Error setting up webhooks:', error.message);
  }
}

// List existing webhooks
async function listWebhooks() {
  try {
    console.log('📋 Listing existing webhooks...');
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/webhooks`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok && result.result.length > 0) {
      console.log('📡 Existing webhooks:');
      result.result.forEach((webhook, index) => {
        console.log(`${index + 1}. ${webhook.target_url}`);
        console.log(`   Events: ${webhook.events.join(', ')}`);
        console.log(`   ID: ${webhook.id}`);
        console.log('');
      });
    } else {
      console.log('📭 No existing webhooks found');
    }
  } catch (error) {
    console.error('❌ Error listing webhooks:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      await listWebhooks();
      break;
    case 'setup':
    default:
      await listWebhooks();
      await setupWebhooks();
      break;
  }
}

main().catch(console.error);
