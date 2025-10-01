# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when developing, deploying, or using TributeStream. Issues are organized by category with step-by-step resolution instructions.

## Development Issues

### Build & Compilation Errors

#### TypeScript Errors

**Issue**: Type checking failures during build
```bash
Error: Type 'undefined' is not assignable to type 'string'
```

**Solutions**:
1. **Check environment variables**:
   ```bash
   # Verify all required env vars are set
   npm run check:env
   ```

2. **Update type definitions**:
   ```typescript
   // Use proper type guards
   if (!memorial?.id) {
     throw new Error('Memorial ID is required');
   }
   ```

3. **Check Firebase imports**:
   ```typescript
   // Correct import for server-side
   import { getFirestore } from 'firebase-admin/firestore';
   
   // Correct import for client-side
   import { getFirestore } from 'firebase/firestore';
   ```

#### Svelte Compilation Issues

**Issue**: Svelte component compilation errors
```bash
ParseError: Unexpected token
```

**Solutions**:
1. **Check rune syntax**:
   ```svelte
   <!-- Correct Svelte 5 syntax -->
   <script>
     let count = $state(0);
     let doubled = $derived(count * 2);
   </script>
   ```

2. **Verify component structure**:
   ```svelte
   <!-- Ensure proper script/markup/style order -->
   <script>
     // Component logic
   </script>
   
   <!-- Markup -->
   <div>Content</div>
   
   <style>
     /* Styles */
   </style>
   ```

### Firebase Connection Issues

#### Authentication Errors

**Issue**: Firebase Auth initialization failures
```bash
Error: Firebase Auth not initialized
```

**Solutions**:
1. **Check Firebase config**:
   ```typescript
   // Verify config in app.html
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     // ... other config
   };
   ```

2. **Verify service account**:
   ```bash
   # Check if service account file exists
   ls -la src/lib/server/firebase-service-account.json
   ```

3. **Check environment variables**:
   ```bash
   # Required for server-side Firebase
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   echo $FIREBASE_PRIVATE_KEY
   ```

#### Firestore Permission Errors

**Issue**: Permission denied errors when accessing Firestore
```bash
Error: Missing or insufficient permissions
```

**Solutions**:
1. **Check security rules**:
   ```javascript
   // Verify rules in Firebase Console
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /memorials/{memorialId} {
         allow read: if isAuthenticated() && hasMemorialAccess(memorialId);
       }
     }
   }
   ```

2. **Verify user authentication**:
   ```typescript
   // Check if user is properly authenticated
   const user = await getAuthenticatedUser(request);
   if (!user) {
     throw error(401, 'Authentication required');
   }
   ```

### Cloudflare Stream Issues

#### Live Input Creation Failures

**Issue**: Cannot create live inputs
```bash
Error: Cloudflare API error: 403 Forbidden
```

**Solutions**:
1. **Verify API credentials**:
   ```bash
   # Check environment variables
   echo $CLOUDFLARE_ACCOUNT_ID
   echo $CLOUDFLARE_API_TOKEN
   ```

2. **Check API token permissions**:
   - Ensure token has `Stream:Edit` permissions
   - Verify account ID matches the token scope

3. **Test API connection**:
   ```bash
   curl -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/live_inputs" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
   ```

#### Webhook Delivery Issues

**Issue**: Webhooks not being received
```bash
No webhook events received from Cloudflare
```

**Solutions**:
1. **Verify webhook URL**:
   ```typescript
   // Check webhook endpoint is accessible
   // URL should be: https://yourdomain.com/api/webhooks/cloudflare
   ```

2. **Check webhook configuration**:
   ```bash
   # List configured webhooks
   curl -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/webhooks" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
   ```

3. **Verify webhook signature**:
   ```typescript
   // Ensure webhook signature validation is correct
   const signature = request.headers.get('webhook-signature');
   const isValid = verifyWebhookSignature(body, signature, webhookSecret);
   ```

## Runtime Issues

### Memorial Access Problems

#### Memorial Not Found

**Issue**: 404 errors when accessing memorial pages
```bash
Error: Memorial not found
```

**Solutions**:
1. **Check memorial slug**:
   ```typescript
   // Verify slug format and existence
   const memorial = await getMemorialBySlug(params.fullSlug);
   if (!memorial) {
     throw error(404, 'Memorial not found');
   }
   ```

2. **Check database indexes**:
   ```bash
   # Ensure Firestore has proper indexes for slug queries
   # Check Firebase Console > Firestore > Indexes
   ```

3. **Verify memorial status**:
   ```typescript
   // Check if memorial is published
   if (memorial.status !== 'published') {
     throw error(404, 'Memorial not available');
   }
   ```

#### Permission Denied

**Issue**: Users cannot access memorial features
```bash
Error: Insufficient permissions
```

**Solutions**:
1. **Check user roles**:
   ```typescript
   // Verify user has correct role
   const userRole = await getUserRole(userId, memorialId);
   if (!['owner', 'funeral_director', 'admin'].includes(userRole)) {
     throw error(403, 'Access denied');
   }
   ```

2. **Verify memorial ownership**:
   ```typescript
   // Check if user owns or has access to memorial
   const hasAccess = await verifyMemorialAccess(userId, memorialId);
   if (!hasAccess) {
     throw error(403, 'Access denied');
   }
   ```

### Livestream Issues

#### Stream Not Starting

**Issue**: Livestream fails to start
```bash
Error: Failed to start livestream
```

**Solutions**:
1. **Check live input status**:
   ```typescript
   // Verify live input is ready
   const liveInput = await cloudflare.getLiveInput(liveInputId);
   if (liveInput.status !== 'ready') {
     throw new Error('Live input not ready');
   }
   ```

2. **Verify stream configuration**:
   ```typescript
   // Check livestream config
   const config = memorial.livestreamConfig;
   if (!config?.liveInputId) {
     throw new Error('Livestream not configured');
   }
   ```

3. **Check RTMP/WHIP credentials**:
   ```typescript
   // Ensure streaming credentials are valid
   const credentials = await getStreamingCredentials(liveInputId);
   ```

#### Recording Not Available

**Issue**: Recordings not appearing after stream ends
```bash
Error: Recording not found
```

**Solutions**:
1. **Check recording status**:
   ```typescript
   // Verify recording was created
   const recordings = await cloudflare.getRecordings(liveInputId);
   if (recordings.length === 0) {
     // Recording may still be processing
     console.log('Recording still processing');
   }
   ```

2. **Verify webhook processing**:
   ```typescript
   // Check if recording webhook was received
   const webhookLogs = await getWebhookLogs(liveInputId);
   ```

3. **Manual recording check**:
   ```bash
   # Check Cloudflare dashboard for recordings
   # Navigate to Stream > Live Inputs > [Your Input] > Recordings
   ```

### Performance Issues

#### Slow Page Load Times

**Issue**: Memorial pages loading slowly
```bash
Page load time > 3 seconds
```

**Solutions**:
1. **Optimize database queries**:
   ```typescript
   // Use proper indexing and limit queries
   const memorials = await db.collection('memorials')
     .where('status', '==', 'published')
     .limit(10)
     .get();
   ```

2. **Implement caching**:
   ```typescript
   // Cache frequently accessed data
   const cached = await redis.get(`memorial:${memorialId}`);
   if (cached) return JSON.parse(cached);
   ```

3. **Optimize images**:
   ```svelte
   <!-- Use proper image optimization -->
   <img 
     src="/api/images/{imageId}?w=400&h=300&q=80"
     alt="Memorial photo"
     loading="lazy"
   />
   ```

#### High Memory Usage

**Issue**: Server running out of memory
```bash
Error: JavaScript heap out of memory
```

**Solutions**:
1. **Optimize data fetching**:
   ```typescript
   // Avoid loading large datasets
   const memorials = await db.collection('memorials')
     .select(['id', 'title', 'slug']) // Only select needed fields
     .limit(50)
     .get();
   ```

2. **Implement pagination**:
   ```typescript
   // Use cursor-based pagination
   const query = db.collection('memorials')
     .orderBy('createdAt')
     .startAfter(lastDoc)
     .limit(20);
   ```

3. **Clean up resources**:
   ```typescript
   // Properly dispose of Firebase connections
   process.on('SIGTERM', () => {
     admin.app().delete();
   });
   ```

## Deployment Issues

### Vercel Deployment Failures

#### Build Errors

**Issue**: Build failing on Vercel
```bash
Error: Build failed with exit code 1
```

**Solutions**:
1. **Check build logs**:
   ```bash
   # Review full build logs in Vercel dashboard
   # Look for specific error messages
   ```

2. **Verify environment variables**:
   ```bash
   # Ensure all required env vars are set in Vercel
   # Check Settings > Environment Variables
   ```

3. **Test build locally**:
   ```bash
   npm run build
   # Fix any local build issues first
   ```

#### Function Timeout Errors

**Issue**: API routes timing out
```bash
Error: Function execution timed out
```

**Solutions**:
1. **Optimize database queries**:
   ```typescript
   // Use more efficient queries
   const memorial = await db.doc(`memorials/${memorialId}`).get();
   // Instead of querying entire collection
   ```

2. **Increase timeout limits**:
   ```json
   // vercel.json
   {
     "functions": {
       "src/routes/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

3. **Implement async processing**:
   ```typescript
   // For long-running tasks, use background jobs
   await scheduleBackgroundTask('processRecording', { recordingId });
   ```

### SSL/TLS Issues

#### Certificate Errors

**Issue**: SSL certificate not working
```bash
Error: SSL certificate verification failed
```

**Solutions**:
1. **Check domain configuration**:
   ```bash
   # Verify DNS records point to Vercel
   dig yourdomain.com
   ```

2. **Force SSL renewal**:
   ```bash
   # In Vercel dashboard: Domains > [Your Domain] > Refresh
   ```

3. **Check certificate status**:
   ```bash
   # Use SSL checker tools to verify certificate
   openssl s_client -connect yourdomain.com:443
   ```

## Database Issues

### Firestore Query Errors

#### Index Missing

**Issue**: Queries failing due to missing indexes
```bash
Error: The query requires an index
```

**Solutions**:
1. **Create required indexes**:
   ```bash
   # Follow the provided link in error message
   # Or create manually in Firebase Console
   ```

2. **Optimize query structure**:
   ```typescript
   // Use single-field queries when possible
   const memorials = await db.collection('memorials')
     .where('status', '==', 'published')
     .get();
   ```

#### Rate Limiting

**Issue**: Too many requests to Firestore
```bash
Error: Quota exceeded
```

**Solutions**:
1. **Implement request batching**:
   ```typescript
   // Batch multiple operations
   const batch = db.batch();
   memorials.forEach(memorial => {
     batch.update(db.doc(`memorials/${memorial.id}`), updates);
   });
   await batch.commit();
   ```

2. **Add caching layer**:
   ```typescript
   // Cache frequently accessed data
   const cacheKey = `memorial:${memorialId}`;
   let memorial = cache.get(cacheKey);
   if (!memorial) {
     memorial = await db.doc(`memorials/${memorialId}`).get();
     cache.set(cacheKey, memorial, 300); // 5 minute cache
   }
   ```

## Monitoring & Debugging

### Logging Best Practices

#### Structured Logging

```typescript
// Use structured logging for better debugging
import { logger } from '$lib/server/logger';

logger.info('Memorial created', {
  memorialId: memorial.id,
  userId: user.id,
  timestamp: new Date().toISOString()
});

logger.error('Livestream failed to start', {
  memorialId,
  liveInputId,
  error: error.message,
  stack: error.stack
});
```

#### Error Tracking

```typescript
// Implement comprehensive error tracking
export function handleError(error: Error, context: any) {
  // Log error details
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });

  // Send to monitoring service (e.g., Sentry)
  if (browser) {
    Sentry.captureException(error, { extra: context });
  }
}
```

### Performance Monitoring

#### Key Metrics to Track

1. **Page Load Times**:
   ```typescript
   // Track page performance
   performance.mark('page-start');
   // ... page logic
   performance.mark('page-end');
   performance.measure('page-load', 'page-start', 'page-end');
   ```

2. **API Response Times**:
   ```typescript
   // Monitor API performance
   const startTime = Date.now();
   const result = await apiCall();
   const duration = Date.now() - startTime;
   
   logger.info('API call completed', {
     endpoint: '/api/memorials',
     duration,
     status: 'success'
   });
   ```

3. **Database Query Performance**:
   ```typescript
   // Track query performance
   const queryStart = Date.now();
   const results = await db.collection('memorials').get();
   const queryTime = Date.now() - queryStart;
   
   if (queryTime > 1000) {
     logger.warn('Slow query detected', {
       collection: 'memorials',
       duration: queryTime
     });
   }
   ```

## Emergency Procedures

### Service Outage Response

#### Immediate Actions

1. **Check service status**:
   ```bash
   # Verify external services
   curl -I https://api.cloudflare.com/client/v4/user
   curl -I https://firebase.googleapis.com/
   ```

2. **Enable maintenance mode**:
   ```typescript
   // Add to app.html or create maintenance page
   if (MAINTENANCE_MODE) {
     return new Response('Service temporarily unavailable', {
       status: 503,
       headers: { 'Retry-After': '3600' }
     });
   }
   ```

3. **Notify stakeholders**:
   ```typescript
   // Send notifications to admins
   await sendEmergencyNotification({
     type: 'service_outage',
     severity: 'high',
     message: 'TributeStream experiencing issues'
   });
   ```

#### Recovery Steps

1. **Identify root cause**:
   - Check error logs
   - Review recent deployments
   - Verify external service status

2. **Implement fix**:
   - Rollback if necessary
   - Apply hotfix
   - Update configuration

3. **Verify recovery**:
   - Test critical functionality
   - Monitor error rates
   - Confirm user access

### Data Recovery

#### Backup Restoration

```bash
# Restore from Firestore backup
gcloud firestore import gs://your-backup-bucket/backup-folder \
  --project=your-project-id

# Verify data integrity after restore
npm run verify:data-integrity
```

#### Point-in-Time Recovery

```typescript
// Implement data versioning for critical operations
export async function updateMemorialWithHistory(memorialId: string, updates: any) {
  const batch = db.batch();
  
  // Update current document
  batch.update(db.doc(`memorials/${memorialId}`), {
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create history entry
  batch.create(db.doc(`memorials/${memorialId}/history/${Date.now()}`), {
    changes: updates,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  await batch.commit();
}
```

## Getting Help

### Internal Resources

1. **Documentation**: Check relevant docs sections
2. **Code Comments**: Review inline documentation
3. **Test Cases**: Look at existing test examples
4. **Git History**: Check recent changes and commit messages

### External Resources

1. **SvelteKit**: [kit.svelte.dev](https://kit.svelte.dev)
2. **Firebase**: [firebase.google.com/docs](https://firebase.google.com/docs)
3. **Cloudflare Stream**: [developers.cloudflare.com/stream](https://developers.cloudflare.com/stream)
4. **Vercel**: [vercel.com/docs](https://vercel.com/docs)

### Support Channels

1. **Development Team**: Internal Slack/Discord
2. **Firebase Support**: Firebase Console > Support
3. **Cloudflare Support**: Cloudflare Dashboard > Support
4. **Vercel Support**: Vercel Dashboard > Help

### Creating Support Tickets

When creating support tickets, include:

1. **Error Details**:
   - Full error message and stack trace
   - Steps to reproduce
   - Expected vs actual behavior

2. **Environment Information**:
   - Node.js version
   - Package versions
   - Deployment platform
   - Browser (if client-side issue)

3. **Context**:
   - Recent changes
   - Affected users/memorials
   - Business impact

4. **Attempted Solutions**:
   - What you've already tried
   - Results of troubleshooting steps
   - Relevant logs or screenshots
