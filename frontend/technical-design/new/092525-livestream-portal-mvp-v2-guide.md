# Livestream Portal MVP (V2) - Project Guide

## 1. Project Overview
- **Goal**: Isolated MVP for livestreaming platform
- **Console**: `livestream-console-two` 
- **Player**: `custom-livestream-page`
- **Focus**: Complete CRUD for stream lifecycle

## 2. Architecture
```
src/livestreamMVPTwo/
├── components/console/    # Management UI
├── components/player/     # Public player
├── lib/stores/           # State management
├── lib/types/            # Interfaces
└── routes/               # Pages
```

## 3. Core Interface
```typescript
interface MVPTwoStream {
  id: string;
  title: string;
  status: 'scheduled' | 'live' | 'completed';
  isVisible: boolean;
  displayOrder: number;
  cloudflareId?: string;
  scheduledStartTime?: Date;
  createdBy: string;
}
```

## 4. Key Components
### Console
- StreamManager.svelte - Main interface
- StreamCreator.svelte - Create streams
- StreamEditor.svelte - Edit streams
- VisibilityController.svelte - Show/hide
- StreamScheduler.svelte - Scheduling

### Player
- StreamPlayer.svelte - Video player
- StreamList.svelte - Stream list
- StreamMetadata.svelte - Stream info

## 5. API Endpoints
```
POST   /api/livestreamMVPTwo/streams         # Create
GET    /api/livestreamMVPTwo/streams         # Read
PUT    /api/livestreamMVPTwo/streams/[id]    # Update
DELETE /api/livestreamMVPTwo/streams/[id]    # Delete
PUT    /api/livestreamMVPTwo/streams/reorder # Reorder
POST   /api/livestreamMVPTwo/streams/[id]/start # Start
POST   /api/livestreamMVPTwo/streams/[id]/stop  # Stop
```

## 6. Feature Requirements

### Stream Creation
- Form-based stream creation with title, description
- Cloudflare Live Input integration
- RTMP credential generation
- Automatic scheduling options

### Stream Rendering & Loading
- Efficient loading of stream data
- Real-time status updates
- Cloudflare Stream player integration
- Responsive video player

### Stream Ordering
- Drag-and-drop reordering interface
- Bulk reorder operations
- Display priority management
- Featured stream designation

### Visibility Control
- Toggle public visibility per stream
- Batch visibility operations
- Preview mode for hidden streams
- Access control integration

### Scheduling
- Date/time picker for future streams
- Recurring stream options
- Automatic start/stop functionality
- Schedule conflict detection

## 7. Development Strategy

### Phase 1: Foundation (Week 1)
- Set up directory structure
- Create base TypeScript interfaces
- Build shared UI components (Button, Modal, etc.)
- Implement basic API endpoints

### Phase 2: Console Development (Week 2-3)
- StreamManager main interface
- StreamCreator form component
- StreamEditor functionality
- VisibilityController implementation

### Phase 3: Player Development (Week 4)
- StreamPlayer video component
- StreamList display component
- Public API integration
- Responsive design implementation

### Phase 4: Advanced Features (Week 5)
- StreamScheduler implementation
- Drag-and-drop ordering
- Real-time status updates
- Performance optimization

### Isolation Rules
- No imports from existing livestream components
- All components prefixed with `MVPTwo`
- Separate state management stores
- Independent CSS/styling
- Unique API endpoints
