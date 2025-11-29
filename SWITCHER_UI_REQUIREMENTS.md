# Switcher UI Implementation Requirements

## Overview
Implement a professional video switcher interface that allows admins to mix multiple live video sources (primarily from phones/cameras) and broadcast the mixed output to a memorial's scheduled livestream, replacing any placeholder content.

## Core Technology Stack
- **Daily.co API** - Primary technology for multi-source video mixing
- **Leverage Daily's capabilities** as much as possible for:
  - Video source management
  - Real-time mixing/switching
  - Audio level monitoring
  - Stream quality management
  - Recording capabilities

## User Roles & Access

### 1. Admin Users
- **Access Level**: Full switcher UI access
- **Authentication**: Required (admin role verification)
- **Capabilities**:
  - Launch switcher interface
  - Create Daily rooms for sources
  - Generate QR codes for phone connections
  - Mix/switch between video sources
  - Control audio levels
  - Output to memorial livestream

### 2. Video Source Contributors (Phone/Camera Users)
- **Access Level**: Source connection only
- **Authentication**: **NONE REQUIRED**
- **Connection Method**: Scan QR code
- **Capabilities**:
  - Join Daily room as video/audio source
  - Stream camera/microphone feed
  - No UI controls (simple join experience)

## User Flow

### Admin Flow
1. Navigate to stream management page (`/memorials/[id]/streams`)
2. Click "Launch Switcher" button on scheduled stream
3. Switcher opens in **separate window/tab** (not modal)
4. Switcher UI displays:
   - Multiple source preview windows
   - QR codes for each available source slot
   - Mixing controls (program/preview monitors)
   - Audio level meters
   - Output status indicators
5. Admin selects sources, mixes content
6. Output automatically streams to memorial's Cloudflare Stream via WHIP
7. Memorial page automatically shows live feed (replaces placeholder)

### Phone Source Flow
1. Person at memorial service opens camera on phone
2. Scans QR code displayed on switcher
3. Browser opens with Daily room join link (no login required)
4. Taps "Allow" for camera/microphone permissions
5. Video feed appears in switcher's source window
6. Admin controls when/how their feed appears in output

## Technical Architecture

### Routes Structure
```
/memorials/
  └── [id]/
      ├── streams/
      │   └── +page.svelte (Add "Launch Switcher" button)
      └── switcher/
          └── [streamId]/
              ├── +page.svelte (Switcher UI)
              └── +page.server.ts (Auth, Daily room creation)
```

### Key Components

#### 1. Switcher Page
- **Route**: `/memorials/[id]/switcher/[streamId]`
- **Window**: Opens with `target="_blank"` in separate window
- **Access Control**: Admin role only (server-side check)
- **Responsibilities**:
  - Initialize Daily room(s)
  - Generate QR codes for source connections
  - Render switcher interface
  - Manage video mixing
  - Output to WHIP endpoint

#### 2. QR Code System
- Each QR code contains: Daily room URL with unique participant token
- **No authentication required** for sources
- Links direct to Daily's web interface or custom lightweight join page
- Format: `https://tributestream.daily.co/room-name?t=token`

#### 3. Video Output Pipeline
```
Phone Sources → Daily Room → Switcher Mixing → Daily Output → WHIP → Cloudflare Stream → Memorial Page
```

### Integration Points

#### Daily.co API Integration
- **Room Creation**: Server-side API call when switcher launches
- **Participant Tokens**: Generate unique tokens for each source slot
- **Mixing Logic**: Use Daily's client SDK for video composition
- **Output Stream**: Configure Daily room with RTMP/WHIP output to Cloudflare

#### Cloudflare Stream Integration
- **Target**: Existing scheduled stream's WHIP endpoint
- **URL**: `/api/streams/[streamId]/whip`
- **Authentication**: Use existing WHIP credentials
- **Result**: Memorial page shows switcher output automatically

#### Memorial Page Integration
- **No changes needed**: Existing StreamPlayer component
- When switcher starts outputting → stream status becomes "live"
- Memorial page automatically displays live feed
- Placeholder content is replaced seamlessly

## Security & Permissions

### Admin Access
- Server-side role verification in `+page.server.ts`
- Check `locals.user.role === 'admin'`
- Redirect unauthorized users to stream management page

### Source Access
- **No authentication required** (intentional design)
- Daily room tokens expire after session
- Rooms automatically close when switcher disconnects
- No persistent access granted

### Stream Protection
- Only admin-created switcher can output to stream
- WHIP credentials not exposed to source contributors
- Stream key remains secure on server-side

## UI/UX Requirements

### Switcher Interface
Based on `SwitcherMockup.html`, should include:
- **Preview Monitor**: Shows selected source before going live
- **Program Monitor**: Shows current live output
- **Source Grid**: 4-6 camera source previews
- **QR Code Display**: Persistent QR codes for each source slot
- **Audio Meters**: VU meters for each source
- **Controls**:
  - Cut/Fade buttons
  - Source selection buttons
  - Audio level controls
  - Record/Stop output controls

### Mobile Source Experience
- Minimal UI (full-screen camera preview)
- Simple join confirmation
- Connection status indicator
- "Leave" button to disconnect

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Create switcher route structure
- [ ] Implement admin-only access control
- [ ] Set up Daily.co API integration
- [ ] Create Daily room on switcher launch
- [ ] Generate QR codes for source connections

### Phase 2: Core Mixing
- [ ] Build switcher UI from mockup
- [ ] Implement source preview windows
- [ ] Add program/preview monitors
- [ ] Create cut/fade switching logic
- [ ] Add audio level monitoring

### Phase 3: Output Integration
- [ ] Configure Daily → WHIP output
- [ ] Connect to Cloudflare Stream endpoint
- [ ] Test memorial page live display
- [ ] Implement status synchronization

### Phase 4: Enhancement
- [ ] Add recording capabilities
- [ ] Implement lower-thirds/overlays
- [ ] Add picture-in-picture modes
- [ ] Create source labeling system
- [ ] Add chat/communication features

## Technical Considerations

### Daily.co Capabilities to Leverage
- **Prebuilt UI**: Consider using Daily's prebuilt UI for sources
- **Custom Layouts**: Use Daily's layout API for mixing
- **Recording**: Native Daily recording as backup
- **Screen Sharing**: Allow sources to share screens
- **Audio Processing**: Use Daily's audio processing features

### Performance Requirements
- Support 4-6 simultaneous video sources
- Low latency mixing (<2 seconds delay)
- Stable WHIP output connection
- Graceful handling of source disconnections

### Browser Compatibility
- **Switcher**: Chrome/Edge desktop (admin use)
- **Sources**: iOS Safari, Android Chrome (phone cameras)
- WebRTC support required for all participants

## Success Criteria
1. Admin can launch switcher in <3 clicks from stream management
2. Phone sources can connect in <10 seconds via QR code
3. No login/authentication friction for sources
4. Smooth switching between sources (<100ms)
5. Reliable output to memorial livestream
6. Memorial viewers see high-quality mixed feed

## Future Enhancements
- Multi-admin collaboration (multiple operators)
- Source presets/templates for common setups
- Automated switching based on audio levels
- Remote camera control (zoom, pan)
- Integration with scheduled service timelines
- Analytics on source quality and switching patterns

## Reference Files
- **UI Mockup**: `SwitcherMockup.html` - Reference design and functionality
- **Daily API Docs**: `Daily API Video Swicher Docs.md` - Technical API reference
- **Existing Components**: 
  - `StreamCard.svelte` - Add launch button here
  - `StreamPlayer.svelte` - Already handles live stream display
  - WHIP integration - `/api/streams/[streamId]/whip`

---

**Document Status**: Requirements Definition
**Created**: 2025-01-29
**Last Updated**: 2025-01-29
**Owner**: Product/Engineering Team
