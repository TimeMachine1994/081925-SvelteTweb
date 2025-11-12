# Deployment Guide

## Overview

Tributestream is designed for deployment on modern cloud platforms with support for serverless functions, static hosting, and CDN distribution. This guide covers deployment to Vercel (recommended) and other platforms.

## Deployment Architecture

### Production Stack

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │  SvelteKit App   │    │  Firebase       │
│                 │    │                  │    │                 │
│ • Static Assets │────│ • SSR/SSG Pages  │────│ • Firestore DB  │
│ • Edge Caching  │    │ • API Routes     │    │ • Authentication│
│ • Global CDN    │    │ • Server Actions │    │ • File Storage  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────────────┐               │
         │              │ External APIs  │               │
         └──────────────│                │───────────────┘
                        │ • Cloudflare   │
                        │ • Stripe       │
                        │ • SendGrid     │
                        └────────────────┘
```

## Vercel Deployment (Recommended)

### 1. Project Setup

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Login to Vercel:**
```bash
vercel login
```

### 2. Configuration Files

**vercel.json:**
```json
{
  "framework": "sveltekit",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/routes/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**SvelteKit Adapter Configuration:**
```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter({
      runtime: 'nodejs18.x',
      regions: ['iad1'],
      memory: 1024,
      maxDuration: 30
    })
  }
};
```

### 3. Environment Variables

Set up environment variables in Vercel dashboard or via CLI:

```bash
# Production environment variables
vercel env add SENDGRID_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add CLOUDFLARE_ACCOUNT_ID production
vercel env add CLOUDFLARE_API_TOKEN production
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production

# Preview environment variables
vercel env add SENDGRID_API_KEY preview
vercel env add STRIPE_SECRET_KEY preview
# ... (repeat for all variables)
```

**Required Environment Variables:**
```bash
# Email Service
SENDGRID_API_KEY="SG.xxx"
FROM_EMAIL="noreply@yourdomain.com"

# Base URL
PUBLIC_BASE_URL="https://yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID="your_account_id"
CLOUDFLARE_API_TOKEN="your_api_token"
CLOUDFLARE_CUSTOMER_CODE="your_customer_code"
CLOUDFLARE_WEBHOOK_SECRET="your_webhook_secret"

# Firebase Admin
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"

# Firebase Client (Public)
PUBLIC_FIREBASE_API_KEY="AIzaSyXXX"
PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
PUBLIC_FIREBASE_APP_ID="1:123456789:web:xxx"
```

### 4. Deployment Process

**Initial Deployment:**
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

**Continuous Deployment:**
```bash
# Link repository to Vercel project
vercel link

# Configure automatic deployments
# - Push to main branch → Production deployment
# - Push to other branches → Preview deployment
```

### 5. Custom Domain Setup

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www.yourdomain.com → cname.vercel-dns.com
# Add A record: yourdomain.com → 76.76.19.61
```

## Alternative Deployment Platforms

### Netlify Deployment

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

**Adapter Configuration:**
```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-netlify';

export default {
  kit: {
    adapter: adapter({
      edge: false,
      split: false
    })
  }
};
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  tributestream:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
    restart: unless-stopped
```

## Database & External Services Setup

### Firebase Production Configuration

**1. Create Production Project:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use --add production-project-id
```

**2. Security Rules:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production security rules
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true ||
                     (request.auth != null && 
                      (resource.data.ownerUid == request.auth.uid ||
                       resource.data.funeralDirectorUid == request.auth.uid ||
                       request.auth.token.isAdmin == true));
      
      allow write: if request.auth != null &&
                      (resource.data.ownerUid == request.auth.uid ||
                       resource.data.funeralDirectorUid == request.auth.uid ||
                       request.auth.token.isAdmin == true);
    }
    
    match /streams/{streamId} {
      allow read: if resource.data.isPublic == true ||
                     (request.auth != null &&
                      (resource.data.createdBy == request.auth.uid ||
                       request.auth.token.isAdmin == true));
      
      allow write: if request.auth != null &&
                      (resource.data.createdBy == request.auth.uid ||
                       request.auth.token.isAdmin == true);
    }
  }
}
```

**3. Deploy Security Rules:**
```bash
firebase deploy --only firestore:rules
```

### Cloudflare Stream Setup

**1. Configure Webhooks:**
```bash
# Set webhook endpoints in Cloudflare dashboard
# Live Input Connected: https://yourdomain.com/api/webhooks/cloudflare/live-input
# Recording Ready: https://yourdomain.com/api/webhooks/cloudflare/recording
```

**2. CORS Configuration:**
```javascript
// Add to Cloudflare Stream settings
{
  "allowedOrigins": ["https://yourdomain.com"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Content-Type", "Authorization"]
}
```

### Stripe Production Setup

**1. Webhook Configuration:**
```bash
# Configure webhook endpoint in Stripe dashboard
# Endpoint: https://yourdomain.com/api/webhooks/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed
```

**2. API Keys:**
```bash
# Use live API keys in production
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
```

## SSL/TLS & Security

### SSL Certificate

Vercel automatically provides SSL certificates via Let's Encrypt. For custom domains:

```bash
# Verify SSL certificate
curl -I https://yourdomain.com

# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Security Headers

**Add to `app.html`:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https:;
  connect-src 'self' https://api.stripe.com https://customer-*.cloudflarestream.com;
  frame-src https://js.stripe.com;
">
```

**Vercel Headers Configuration:**
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

## Performance Optimization

### Build Optimization

**SvelteKit Configuration:**
```typescript
// svelte.config.js
export default {
  kit: {
    adapter: adapter(),
    prerender: {
      entries: [
        '/',
        '/about',
        '/pricing',
        '/login',
        '/register/family',
        '/register/funeral-director'
      ]
    },
    csp: {
      directives: {
        'script-src': ['self', 'unsafe-inline', 'https://js.stripe.com'],
        'object-src': ['none'],
        'base-uri': ['self']
      }
    }
  }
};
```

### CDN Configuration

**Static Asset Optimization:**
```json
// vercel.json
{
  "functions": {
    "src/routes/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Image Optimization

```typescript
// Use Vercel's image optimization
import { dev } from '$app/environment';

const imageLoader = ({ src, width, quality }) => {
  if (dev) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};
```

## Monitoring & Analytics

### Error Tracking

**Sentry Integration:**
```typescript
// src/hooks.client.ts
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.NODE_ENV
});
```

### Performance Monitoring

**Web Vitals:**
```typescript
// src/app.html
<script>
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
</script>
```

### Analytics

**Google Analytics 4:**
```html
<!-- src/app.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Backup & Recovery

### Database Backup

**Firestore Backup:**
```bash
# Create automated backup
gcloud firestore export gs://your-backup-bucket/backups/$(date +%Y%m%d-%H%M%S)

# Schedule daily backups via Cloud Scheduler
gcloud scheduler jobs create app-engine backup-firestore \
  --schedule="0 2 * * *" \
  --relative-url="/backup" \
  --http-method=POST
```

### Code Backup

**Git Repository:**
```bash
# Ensure all code is version controlled
git remote add backup https://github.com/backup-repo/tributestream.git
git push backup main
```

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Firebase security rules updated
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Webhook endpoints tested
- [ ] Payment integration tested
- [ ] Email service configured

### Post-Deployment

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] All API endpoints responding
- [ ] Database connections working
- [ ] External services integrated
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Backup systems operational

### Testing in Production

```bash
# Health check
curl https://yourdomain.com/api/health

# Test memorial creation
curl -X POST https://yourdomain.com/api/memorials \
  -H "Content-Type: application/json" \
  -d '{"lovedOneName": "Test Memorial"}'

# Test livestream API
curl https://yourdomain.com/api/streams

# Verify webhook endpoints
curl -X POST https://yourdomain.com/api/webhooks/cloudflare/recording \
  -H "Content-Type: application/json" \
  -d '{"eventType": "video.recording.ready"}'
```

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Promote specific deployment to production
vercel promote [deployment-url]
```

### Database Rollback

```bash
# Restore from backup
gcloud firestore import gs://your-backup-bucket/backups/BACKUP_TIMESTAMP
```

### Emergency Procedures

1. **Service Outage:**
   - Check Vercel status dashboard
   - Verify external service status
   - Review error logs
   - Implement emergency maintenance page

2. **Data Issues:**
   - Stop write operations
   - Assess data integrity
   - Restore from backup if necessary
   - Verify data consistency

3. **Security Incident:**
   - Rotate API keys immediately
   - Review access logs
   - Update security rules
   - Notify affected users

---

*This deployment guide ensures Tributestream can be reliably deployed and maintained in production environments with proper security, performance, and monitoring.*
