# WebSocket Implementation Guide

**Date**: January 2025  
**Phase**: Phase Two - Real-time Updates  
**Status**: ✅ Implemented

---

## Overview

This document details the WebSocket implementation for the King Law Firm application, enabling real-time messaging, document notifications, and live updates across the platform.

## Architecture

### Server-Side Components

#### 1. WebSocket Manager (`src/lib/server/websocket.ts`)

**Purpose**: Manages WebSocket connections, authentication, and message broadcasting.

**Key Features**:
- Session token authentication via cookies
- Connection lifecycle management
- Heartbeat monitoring (30-second intervals)
- User-based client mapping
- Broadcast capabilities (individual users and case groups)

**Class Structure**:
```typescript
class WebSocketManager {
  private wss: WebSocketServer | null
  private clients: Map<string, Set<AuthenticatedWebSocket>>
  private heartbeatInterval: NodeJS.Timeout | null
  
  initialize(server: Server): void
  broadcast(userId: string, message: WebSocketMessage): void
  broadcastToCase(caseId: string, userIds: string[], message: WebSocketMessage): void
  close(): void
}
```

**Message Types**:
- `connected`: Initial connection confirmation
- `new-message`: New message received
- `message-read`: Message marked as read
- `document-uploaded`: New document uploaded
- `document-viewed`: Document viewed by recipient
- `ping`/`pong`: Connection health checks

**Authentication Flow**:
1. Client connects to `/ws` endpoint
2. Server extracts session cookie from WebSocket headers
3. Validates session token using auth service
4. Assigns user ID and role to WebSocket connection
5. Adds connection to user's client set

**Connection Management**:
- Automatic reconnection with exponential backoff
- Inactive connection termination (missed 2 heartbeats)
- Graceful shutdown handling
- Per-user connection tracking

#### 2. Server Setup (`server.js`)

**Purpose**: Custom Node.js server integrating SvelteKit with WebSocket support.

**Implementation**:
```javascript
import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Initialize WebSocket server
import('./build/server/websocket.js').then(({ wsManager }) => {
  wsManager.initialize(server);
});

app.use(handler);
server.listen(PORT);
```

**Benefits**:
- Single server for both HTTP and WebSocket
- Shared session authentication
- Production-ready architecture

### Client-Side Components

#### 3. WebSocket Store (`src/lib/stores/websocket.ts`)

**Purpose**: Svelte store managing WebSocket connection state and event handling.

**Store Interface**:
```typescript
interface WebSocketStore {
  connected: boolean
  socket: WebSocket | null
  reconnectAttempts: number
  maxReconnectAttempts: number
}
```

**API Methods**:
- `connect()`: Establishes WebSocket connection (cookie-based auth)
- `disconnect()`: Closes connection and cleans up
- `send(type, data)`: Sends message to server
- `on(eventType, handler)`: Registers event handler
- `off(eventType, handler)`: Removes event handler

**Event Handling**:
```typescript
// Register handler
const unsubscribe = websocket.on('new-message', (data) => {
  // Handle new message
  messages.update(m => [...m, data]);
});

// Cleanup
onDestroy(unsubscribe);
```

**Reconnection Logic**:
- Automatic reconnection on disconnect
- Maximum 5 attempts with 3-second intervals
- Exponential backoff for failed attempts
- Connection state tracking

**Derived Stores**:
```typescript
export const isConnected = derived(websocket, $ws => $ws.connected);
```

## Integration Points

### Message API Integration

#### POST `/api/messages`

**Enhancement**: Broadcasts new messages to recipients via WebSocket.

```typescript
// After creating message in database
const newMessage = { id, content, senderId, ... };

// Broadcast to recipient
if (targetRecipientId) {
  broadcastNewMessage(targetRecipientId, newMessage);
}

return json({ message: newMessage }, { status: 201 });
```

**Benefit**: Recipients receive instant notifications without polling.

#### POST `/api/messages/mark-read`

**Enhancement**: Notifies senders when messages are read.

```typescript
// Get unread messages before marking as read
const unreadMessages = await db.select(...).where(...);

// Mark as read
await db.update(messages).set({ readAt: new Date() });

// Notify senders
unreadMessages.forEach(msg => {
  broadcastMessageRead(msg.senderId, msg.id);
});
```

**Benefit**: Real-time read receipts for message senders.

### Component Integration Example

**Implementing in ChatSlider Component**:

```typescript
<script lang="ts">
  import { websocket } from '$lib/stores/websocket';
  import { onMount, onDestroy } from 'svelte';
  
  let messages = $state([]);
  
  onMount(() => {
    // Connect WebSocket
    websocket.connect();
    
    // Listen for new messages
    const unsubNewMessage = websocket.on('new-message', (data) => {
      messages = [...messages, data];
      // Update unread count
      // Show notification
    });
    
    // Listen for read receipts
    const unsubReadReceipt = websocket.on('message-read', (data) => {
      messages = messages.map(m => 
        m.id === data.messageId ? { ...m, readAt: new Date() } : m
      );
    });
    
    onDestroy(() => {
      unsubNewMessage();
      unsubReadReceipt();
    });
  });
</script>
```

## Database Schema Changes

### Document Table Enhancements

**New Fields**:
```sql
ALTER TABLE document ADD COLUMN direction TEXT DEFAULT 'outgoing' NOT NULL;
ALTER TABLE document ADD COLUMN message_id TEXT REFERENCES message(id) ON DELETE SET NULL;
ALTER TABLE document ADD COLUMN viewed_at INTEGER;
ALTER TABLE document ADD COLUMN shared_via TEXT DEFAULT 'upload' NOT NULL;
```

**Field Descriptions**:
- `direction`: Document flow direction ('incoming' | 'outgoing')
- `message_id`: Links document to message (for attachments)
- `viewed_at`: Timestamp when document was viewed
- `shared_via`: How document was shared ('upload' | 'message' | 'email')

### Message Table Enhancements

**Modified Fields**:
```sql
ALTER TABLE message MODIFY COLUMN case_id TEXT NULL;
ALTER TABLE message ADD COLUMN recipient_id TEXT REFERENCES user(id);
```

**Changes**:
- `case_id` now nullable (supports uncategorized messages)
- `recipient_id` added for direct messaging

**Foreign Keys**:
- `case_id` → `case.id` (ON DELETE SET NULL)
- `recipient_id` → `user.id` (ON DELETE RESTRICT)
- `sender_id` → `user.id` (ON DELETE RESTRICT)
- `attachment_document_id` → `document.id` (ON DELETE SET NULL)

## Deployment

### Development Mode

**Using Vite Dev Server**:
```bash
npm run dev
```

**Note**: WebSocket features work in development via Vite's WebSocket proxy.

### Production Mode

**Build Application**:
```bash
npm run build
```

**Start Production Server**:
```bash
npm start
```

**Custom Server**: Uses `server.js` for WebSocket integration.

### Environment Configuration

**Required Dependencies**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "@types/ws": "^8.18.1"
  }
}
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "dev": "vite dev",
    "dev:server": "node server.js",
    "build": "vite build",
    "start": "node server.js"
  }
}
```

## Testing WebSocket Connection

### Browser Console Test

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send ping
ws.send(JSON.stringify({ type: 'ping' }));
```

### Expected Flow

1. **Connection**: Receives `{ type: 'connected', userId: '...' }`
2. **Heartbeat**: Server sends ping every 30 seconds
3. **Messages**: Receives broadcasts based on user activity
4. **Reconnection**: Automatic on disconnect (max 5 attempts)

## Broadcasting Helpers

### Available Functions

**Individual User Broadcast**:
```typescript
broadcastNewMessage(recipientId: string, message: any)
broadcastMessageRead(senderId: string, messageId: string)
broadcastDocumentViewed(uploaderId: string, documentId: string)
```

**Case Group Broadcast**:
```typescript
broadcastToCase(caseId: string, userIds: string[], message: WebSocketMessage)
broadcastDocumentUploaded(caseId: string, userIds: string[], document: any)
```

### Usage in API Routes

```typescript
import { broadcastNewMessage } from '$lib/server/websocket';

export const POST = async ({ request, locals }) => {
  // Create message
  const message = await createMessage(...);
  
  // Broadcast to recipient
  broadcastNewMessage(message.recipientId, message);
  
  return json({ message });
};
```

## Security Considerations

### Authentication

- **Session-based**: Uses existing auth cookie
- **Token validation**: Every connection validated
- **Role checking**: User role available on WebSocket
- **Unauthorized rejection**: Invalid tokens disconnected immediately

### Connection Limits

- **Per-user tracking**: Multiple connections per user allowed
- **Heartbeat monitoring**: Inactive connections terminated
- **Resource cleanup**: Automatic on disconnect

### Message Validation

- **Type checking**: Only known message types processed
- **Sender verification**: Server validates message sender
- **Authorization**: Recipients checked before broadcast

## Monitoring & Debugging

### Connection Status

```typescript
// Get total connections
const count = wsManager.getConnectionCount();

// Get connections for specific user
const userCount = wsManager.getUserConnectionCount(userId);
```

### Logging

**Server-side logs**:
- Connection attempts
- Authentication results
- Disconnections
- Broadcast operations
- Heartbeat failures

**Client-side logs**:
- Connection state changes
- Reconnection attempts
- Message reception
- Event handler registration

### Common Issues

**Issue**: Connection fails immediately  
**Solution**: Check session cookie validity

**Issue**: Messages not received  
**Solution**: Verify event handler registration

**Issue**: Connection drops frequently  
**Solution**: Check network stability, review heartbeat logs

**Issue**: Multiple connections for same user  
**Solution**: Normal behavior (multiple browser tabs/devices)

## Future Enhancements

### Planned Features

1. **Typing Indicators**: Show when user is typing
2. **Online Status**: Real-time presence tracking
3. **Push Notifications**: Browser notifications for messages
4. **Message Queue**: Offline message delivery
5. **Analytics**: WebSocket usage metrics
6. **Scalability**: Redis pub/sub for multi-server setup

### Scaling Considerations

**Current**: Single server with in-memory client map  
**Future**: Redis pub/sub for horizontal scaling

```typescript
// Multi-server architecture
class ScalableWebSocketManager {
  private redis: RedisClient;
  
  broadcast(userId: string, message: any) {
    // Publish to Redis channel
    redis.publish(`user:${userId}`, JSON.stringify(message));
  }
  
  private subscribeToRedis() {
    redis.subscribe(`user:${localUserId}`, (message) => {
      // Forward to local WebSocket clients
    });
  }
}
```

## Troubleshooting Guide

### Connection Issues

**Symptoms**: WebSocket connection fails  
**Checklist**:
- [ ] Server running on correct port
- [ ] Session cookie present and valid
- [ ] CORS configuration correct
- [ ] Firewall not blocking WebSocket

**Debug Steps**:
1. Check browser console for errors
2. Verify server logs for connection attempts
3. Test with manual WebSocket connection
4. Validate session token in browser DevTools

### Message Not Received

**Symptoms**: Broadcast sent but not received  
**Checklist**:
- [ ] Event handler registered before message sent
- [ ] Correct event type name
- [ ] User connected to WebSocket
- [ ] Message broadcast to correct user ID

**Debug Steps**:
1. Add console logs in event handlers
2. Verify broadcast calls in server logs
3. Check WebSocket connection state
4. Test with manual message send

### Performance Issues

**Symptoms**: Slow message delivery, high latency  
**Checklist**:
- [ ] Check connection count
- [ ] Monitor heartbeat intervals
- [ ] Review message payload sizes
- [ ] Check for memory leaks

**Optimization**:
1. Implement message throttling
2. Reduce payload sizes
3. Add message queuing
4. Consider Redis for large scale

## Conclusion

The WebSocket implementation provides real-time capabilities essential for modern messaging and collaboration features. The architecture is designed for reliability, security, and future scalability.

**Key Benefits**:
- ✅ Real-time message delivery
- ✅ Instant read receipts
- ✅ Document upload notifications
- ✅ Reduced server load (vs polling)
- ✅ Better user experience
- ✅ Scalable architecture

**Next Steps**:
1. Monitor WebSocket usage and performance
2. Gather user feedback on real-time features
3. Plan additional real-time features
4. Consider scaling strategy for growth
