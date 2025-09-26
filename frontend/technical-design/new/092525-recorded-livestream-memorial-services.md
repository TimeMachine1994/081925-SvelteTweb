# Memorial Livestream Services

## Data Models

### LivestreamArchiveEntry
```typescript
interface LivestreamArchiveEntry {
  id: string;
  title: string;
  cloudflareId: string;
  isVisible: boolean;             // Funeral director control
  recordingReady: boolean;        // Cloudflare status
  recordingPlaybackUrl?: string;
  startedBy: string;              // Funeral director UID
  startedAt: Timestamp;
  endedAt?: Timestamp;
}
```

### Memorial Collection
```javascript
{
  livestreamArchive: LivestreamArchiveEntry[],
  customStreams: Record<string, CustomStreamConfig>,
  activeStreams: number
}
```

## Key APIs

### Livestream Control
- `POST /api/memorials/[id]/livestream` - Start stream
- `DELETE /api/memorials/[id]/livestream` - Stop & create archive

### Archive Management  
- `GET /api/memorials/[id]/livestream/archive` - Get entries
- `PUT /api/memorials/[id]/livestream/archive/[entryId]` - Toggle visibility

### Cloudflare Webhook
- `POST /api/webhooks/cloudflare/recording` - Recording ready

## Components

- **LivestreamControl.svelte** - Start/stop + archive management
- **LivestreamArchive.svelte** - Visibility toggles (Eye/EyeOff)
- **LivestreamArchivePlayer.svelte** - Memorial page players

## Funeral Director Capabilities

### Stream Management
1. **Create**: Start stream → Cloudflare Live Input + RTMP credentials
2. **Broadcast**: Mobile streaming via RTMP URL + key
3. **Stop**: End stream → Archive entry auto-created
4. **Hide/Show**: Eye/EyeOff toggles control public visibility
5. **Status Check**: Manual recording refresh button

### Archive Control
- Green "Visible" = Public can view recording
- Gray "Hidden" = Only funeral director sees
- Processing vs Ready status indicators
- Delete archive entries if needed

## Cloudflare Services

### Recording Pipeline
1. Live Input created with automatic recording
2. Stream ends → Recording processing begins
3. Webhook notifies when recording ready
4. HLS/DASH URLs + thumbnails generated
5. Archive player displays on memorial pages

### Memorial Display
- Public sees only `isVisible: true` recordings
- Separate sections for live vs recorded streams
- Service details (date, time, location) shown
