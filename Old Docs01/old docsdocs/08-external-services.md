# External Services Integration

## Overview

Tributestream integrates with several external services to provide comprehensive memorial service functionality. This document covers the configuration, usage patterns, and integration details for each external service.

## Cloudflare Stream

### Service Overview

Cloudflare Stream provides the core video streaming infrastructure for Tributestream, handling live streaming, recording, and video delivery.

**Key Features:**
- Live streaming via RTMP and WHIP protocols
- Automatic recording with HLS/DASH output
- Global CDN distribution
- Adaptive bitrate streaming
- Real-time analytics

### Configuration

#### Environment Variables
```bash
# Cloudflare Stream Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_CUSTOMER_CODE=your_customer_code

# Webhook Configuration
CLOUDFLARE_WEBHOOK_SECRET=your_webhook_secret
PUBLIC_BASE_URL=https://your-domain.com
```

#### API Client Setup
```typescript
// lib/server/cloudflare.ts
export class CloudflareStreamClient {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async createLiveInput(config: LiveInputConfig) {
    return await this.request('/live_inputs', {
      method: 'POST',
      body: JSON.stringify({
        recording: {
          mode: 'automatic',
          requireSignedURLs: false,
          allowedOrigins: ['*']
        },
        meta: {
          name: config.name
        }
      })
    });
  }

  async getLiveInput(liveInputId: string) {
    return await this.request(`/live_inputs/${liveInputId}`);
  }

  async getVideo(videoId: string) {
    return await this.request(`/${videoId}`);
  }

  async deleteVideo(videoId: string) {
    return await this.request(`/${videoId}`, {
      method: 'DELETE'
    });
  }
}
```

### Live Streaming Integration

#### RTMP Streaming
```typescript
// Create RTMP stream for OBS
async function createRTMPStream(streamTitle: string) {
  const liveInput = await cloudflareClient.createLiveInput({
    name: streamTitle
  });

  return {
    streamUrl: liveInput.result.rtmps.url,
    streamKey: liveInput.result.rtmps.streamKey,
    playbackUrl: `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${liveInput.result.uid}/manifest/video.m3u8`
  };
}
```

#### WHIP Streaming (WebRTC)
```typescript
// Create WHIP endpoint for browser streaming
async function createWHIPStream(streamTitle: string) {
  const liveInput = await cloudflareClient.createLiveInput({
    name: streamTitle
  });

  return {
    whipEndpoint: `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${liveInput.result.uid}/webRTC/publish`,
    playbackUrl: `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${liveInput.result.uid}/manifest/video.m3u8`
  };
}

// Client-side WHIP connection
async function connectWHIP(whipEndpoint: string) {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
  });

  mediaStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, mediaStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const response = await fetch(whipEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp
  });

  const answer = await response.text();
  await peerConnection.setRemoteDescription({
    type: 'answer',
    sdp: answer
  });

  return peerConnection;
}
```

### Recording Management

#### Automatic Recording
```typescript
// Recording is automatically enabled for all live inputs
const liveInputConfig = {
  recording: {
    mode: 'automatic',           // Always record
    requireSignedURLs: false,    // Public access
    allowedOrigins: ['*']        // Allow all origins
  }
};
```

#### Recording Status Monitoring
```typescript
async function checkRecordingStatus(videoId: string) {
  const video = await cloudflareClient.getVideo(videoId);
  
  return {
    ready: video.result.status.state === 'ready',
    duration: video.result.duration,
    playbackUrl: video.result.playback?.hls,
    thumbnailUrl: video.result.thumbnail,
    size: video.result.size
  };
}
```

### Webhook Integration

#### Webhook Handler
```typescript
// /api/webhooks/cloudflare/+server.ts
export async function POST({ request }) {
  const signature = request.headers.get('cloudflare-signature');
  const body = await request.text();
  
  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const webhook = JSON.parse(body);
  
  switch (webhook.eventType) {
    case 'live_input.connected':
      await handleStreamConnected(webhook);
      break;
    case 'live_input.disconnected':
      await handleStreamDisconnected(webhook);
      break;
    case 'video.recording.ready':
      await handleRecordingReady(webhook);
      break;
  }
  
  return json({ success: true });
}

async function handleRecordingReady(webhook: any) {
  const { uid, playback, duration, thumbnails } = webhook;
  
  // Update stream document
  await updateDoc(doc(db, 'streams', uid), {
    recordingReady: true,
    recordingUrl: playback.hls,
    recordingDuration: duration,
    thumbnailUrl: thumbnails?.[0]?.url,
    status: 'completed',
    updatedAt: serverTimestamp()
  });
  
  // Update memorial archive entries
  const memorials = await getDocs(
    query(collection(db, 'memorials'),
          where('livestreamArchive', 'array-contains-any', [{ cloudflareId: uid }]))
  );
  
  for (const memorial of memorials.docs) {
    const data = memorial.data();
    const updatedArchive = data.livestreamArchive?.map(entry => 
      entry.cloudflareId === uid 
        ? { ...entry, recordingReady: true, recordingPlaybackUrl: playback.hls }
        : entry
    );
    
    await updateDoc(memorial.ref, {
      livestreamArchive: updatedArchive,
      updatedAt: serverTimestamp()
    });
  }
}
```

#### Webhook Security
```typescript
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!signature || !CLOUDFLARE_WEBHOOK_SECRET) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', CLOUDFLARE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Firebase Services

### Firebase Authentication

#### Configuration
```typescript
// lib/firebase.ts (Client-side)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

```typescript
// lib/firebase-admin.ts (Server-side)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();
export { FieldValue };
```

#### Custom Claims Management
```typescript
// Set user role claims
async function setUserRole(uid: string, role: 'admin' | 'owner' | 'funeral_director') {
  await adminAuth.setCustomUserClaims(uid, {
    role,
    isAdmin: role === 'admin'
  });
}

// Verify user claims
async function verifyUserClaims(idToken: string) {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    role: decodedToken.role || 'owner',
    isAdmin: decodedToken.isAdmin || false
  };
}
```

### Firebase Firestore

#### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Memorial access rules
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.ownerUid == request.auth.uid ||
                       resource.data.funeralDirectorUid == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.ownerUid == request.auth.uid ||
                      resource.data.funeralDirectorUid == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
    
    // Stream access rules
    match /streams/{streamId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.createdBy == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.createdBy == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
  }
}
```

#### Batch Operations
```typescript
// Efficient batch writes
async function batchUpdateStreams(updates: Array<{id: string, data: any}>) {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, data }) => {
    const streamRef = doc(db, 'streams', id);
    batch.update(streamRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
}
```

### Firebase Storage

#### File Upload Configuration
```typescript
// File upload with security
async function uploadFile(file: File, path: string, userId: string) {
  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  // Create secure path
  const securePath = `users/${userId}/${path}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, securePath);
  
  // Upload with metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  };
  
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return {
    url: downloadURL,
    path: securePath,
    size: file.size,
    type: file.type
  };
}
```

## Stripe Payment Processing

### Configuration

#### Environment Setup
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Client Setup
```typescript
// lib/server/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true
});
```

### Payment Intent Flow

#### Server-side Payment Creation
```typescript
// /api/create-payment-intent/+server.ts
export async function POST({ request, locals }) {
  const { memorialId, amount } = await request.json();
  const user = locals.user;
  
  if (!user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Verify memorial ownership
  const memorial = await getDoc(doc(db, 'memorials', memorialId));
  if (!memorial.exists() || memorial.data().ownerUid !== user.uid) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        memorialId,
        userId: user.uid,
        type: 'livestream_booking'
      }
    });
    
    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    return json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
```

#### Client-side Payment Processing
```typescript
// lib/components/StripeCheckout.svelte
<script>
  import { loadStripe } from '@stripe/stripe-js';
  import { Elements, PaymentElement } from '@stripe/svelte-stripe';
  
  export let clientSecret;
  
  let stripe = null;
  let elements = null;
  let processing = false;
  
  onMount(async () => {
    stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
  });
  
  async function handleSubmit() {
    if (!stripe || !elements) return;
    
    processing = true;
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`
      }
    });
    
    if (error) {
      console.error('Payment failed:', error);
      // Handle error
    }
    
    processing = false;
  }
</script>

{#if stripe}
  <Elements {stripe} {clientSecret} bind:elements>
    <form on:submit|preventDefault={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  </Elements>
{/if}
```

### Webhook Processing

#### Payment Confirmation
```typescript
// /api/webhooks/stripe/+server.ts
export async function POST({ request }) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
  
  return json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { memorialId, userId } = paymentIntent.metadata;
  
  // Update livestream config status
  const configs = await getDocs(
    query(collection(db, 'livestreamConfigs'),
          where('paymentIntentId', '==', paymentIntent.id))
  );
  
  for (const config of configs.docs) {
    await updateDoc(config.ref, {
      status: 'paid',
      paymentStatus: 'succeeded',
      paidAt: serverTimestamp()
    });
  }
  
  // Send confirmation email
  await sendPaymentConfirmationEmail(userId, paymentIntent.amount / 100);
  
  // Log successful payment
  await addDoc(collection(db, 'audit_logs'), {
    action: 'payment_succeeded',
    resource: 'payment',
    resourceId: paymentIntent.id,
    userId,
    metadata: {
      amount: paymentIntent.amount,
      memorialId
    },
    timestamp: serverTimestamp()
  });
}
```

## Email Services

### Configuration

#### SMTP Setup
```typescript
// lib/server/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE === 'true',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});
```

### Email Templates

#### Welcome Email
```typescript
async function sendWelcomeEmail(userEmail: string, userName: string, memorialUrl: string) {
  const emailTemplate = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Tributestream</h1>
        </div>
        
        <div style="padding: 40px;">
          <h2>Hello ${userName},</h2>
          
          <p>Your memorial has been successfully created. You can now:</p>
          
          <ul>
            <li>Add photos and memories</li>
            <li>Schedule livestream services</li>
            <li>Invite family and friends</li>
            <li>Customize your memorial page</li>
          </ul>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${memorialUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Memorial
            </a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>With sympathy,<br>The Tributestream Team</p>
        </div>
      </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: userEmail,
    subject: 'Welcome to Tributestream - Your Memorial is Ready',
    html: emailTemplate
  });
}
```

#### Payment Confirmation
```typescript
async function sendPaymentConfirmationEmail(userId: string, amount: number) {
  const user = await getDoc(doc(db, 'users', userId));
  const userData = user.data();
  
  const emailTemplate = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4caf50; padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmed</h1>
        </div>
        
        <div style="padding: 40px;">
          <h2>Hello ${userData.displayName},</h2>
          
          <p>Your payment of <strong>$${amount.toFixed(2)}</strong> has been successfully processed.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>What's Next?</h3>
            <ul>
              <li>Your livestream service is now confirmed</li>
              <li>You'll receive streaming instructions 24 hours before your service</li>
              <li>Family and friends can access your memorial page to join the service</li>
            </ul>
          </div>
          
          <p>Thank you for choosing Tributestream for this important service.</p>
          
          <p>With care,<br>The Tributestream Team</p>
        </div>
      </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: userData.email,
    subject: 'Payment Confirmation - Tributestream',
    html: emailTemplate
  });
}
```

## Error Handling & Monitoring

### Service Health Monitoring

#### Health Check Endpoints
```typescript
// /api/health/+server.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkFirebaseConnection(),
    checkCloudflareConnection(),
    checkStripeConnection(),
    checkEmailService()
  ]);
  
  const results = checks.map((check, index) => ({
    service: ['firebase', 'cloudflare', 'stripe', 'email'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    error: check.status === 'rejected' ? check.reason.message : null
  }));
  
  const allHealthy = results.every(r => r.status === 'healthy');
  
  return json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    timestamp: new Date().toISOString()
  }, {
    status: allHealthy ? 200 : 503
  });
}

async function checkFirebaseConnection() {
  const testDoc = await getDoc(doc(db, 'system_stats', 'current'));
  if (!testDoc) throw new Error('Firebase connection failed');
}

async function checkCloudflareConnection() {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` }
  });
  if (!response.ok) throw new Error('Cloudflare connection failed');
}
```

### Error Logging & Alerting

#### Structured Error Logging
```typescript
interface ErrorLog {
  level: 'error' | 'warn' | 'info';
  service: string;
  operation: string;
  error: string;
  context: any;
  userId?: string;
  timestamp: Date;
}

async function logError(errorLog: ErrorLog) {
  // Log to console
  console.error(`[${errorLog.service}] ${errorLog.operation}:`, errorLog.error);
  
  // Store in Firestore for analysis
  await addDoc(collection(db, 'error_logs'), {
    ...errorLog,
    timestamp: serverTimestamp()
  });
  
  // Send alerts for critical errors
  if (errorLog.level === 'error') {
    await sendErrorAlert(errorLog);
  }
}

async function sendErrorAlert(errorLog: ErrorLog) {
  // Send to monitoring service or email
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: env.ADMIN_EMAIL,
    subject: `Tributestream Error Alert: ${errorLog.service}`,
    text: `
      Service: ${errorLog.service}
      Operation: ${errorLog.operation}
      Error: ${errorLog.error}
      Context: ${JSON.stringify(errorLog.context, null, 2)}
      Time: ${errorLog.timestamp}
    `
  });
}
```

---

*This external services documentation provides comprehensive integration details for all third-party services used by Tributestream, ensuring reliable and secure operation of the memorial service platform.*
