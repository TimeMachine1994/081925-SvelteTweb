# 092425 - Schedule Livestream Plan

## Overview
This document outlines the comprehensive refactoring plan for the Livestream Control Center to integrate scheduled services from the calculator/booking system and provide dynamic stream management capabilities.

## Current State Analysis

### Existing Livestream Control Center
**Location**: `/src/routes/livestream/[memorialId]/+page.svelte`
**URL Pattern**: `/livestream/[memorialId]`

#### Current Layout:
- **Left Side (2/3)**: Live stream preview with iframe/offline message
- **Right Side (1/3)**: Stream credentials and mobile streaming controls

#### Current Limitations:
- Single stream configuration per memorial
- No integration with scheduled services from calculator
- No multi-service livestream support
- Manual stream setup without schedule awareness

## Refactoring Objectives

### Primary Goals:
1. **Schedule Integration**: Connect livestream control with calculator booking data
2. **Multi-Service Support**: Enable separate streams for different scheduled services
3. **Dynamic Stream Management**: Stream credentials change based on selected service
4. **Enhanced User Experience**: Clear service selection and scheduling interface
5. **Future Livestream Creation**: Allow creation of new scheduled streams

## Technical Implementation Plan

### Phase 1: Data Integration & Backend Updates

#### 1.1 Data Source Integration
**Target**: Connect with `livestream_configs` collection

```typescript
// Data flow: Memorial → LivestreamConfigs → Scheduled Services
interface ScheduledService {
  id: string;
  title: string;
  location: LocationInfo;
  time: TimeInfo;
  hours: number;
  streamKey?: string;
  streamUrl?: string;
  status: 'scheduled' | 'live' | 'completed';
  createdAt: Timestamp;
}
```

#### 1.2 API Endpoint Updates
**New/Updated Endpoints:**

```typescript
// Get scheduled services for memorial
GET /api/memorials/[memorialId]/scheduled-services
Response: ScheduledService[]

// Create new livestream session for specific service
POST /api/memorials/[memorialId]/scheduled-services/[serviceId]/livestream
Request: { title: string, scheduleType: 'now' | 'scheduled', scheduledTime?: string }
Response: { streamKey: string, streamUrl: string, sessionId: string }

// Update service stream configuration
PUT /api/memorials/[memorialId]/scheduled-services/[serviceId]
Request: Partial<ScheduledService>
Response: { success: boolean }
```

#### 1.3 Database Schema Updates
**LivestreamConfig Collection Enhancement:**

```typescript
interface LivestreamConfig {
  // ... existing fields
  
  // NEW: Scheduled services integration
  scheduledServices: {
    [serviceId: string]: {
      streamKey: string;
      streamUrl: string;
      sessionId?: string;
      status: 'scheduled' | 'live' | 'completed';
      startedAt?: Timestamp;
      endedAt?: Timestamp;
    }
  };
}
```

### Phase 2: Frontend Component Refactoring

#### 2.1 Left Panel (2/3) - Scheduled Services Display

**Remove:**
- Live stream preview iframe
- "Stream Offline" message
- Static video player

**Replace With:**
```svelte
<!-- Scheduled Services Panel -->
<div class="scheduled-services-panel">
  <div class="panel-header">
    <h2>Scheduled Services</h2>
    <button class="create-new-stream-btn">+ Create New Livestream</button>
  </div>
  
  <div class="services-grid">
    {#each scheduledServices as service}
      <div class="service-card {selectedService?.id === service.id ? 'selected' : ''}"
           onclick={() => selectService(service)}>
        <div class="service-header">
          <h3>{service.title || service.location.name}</h3>
          <span class="service-status {service.status}">{service.status}</span>
        </div>
        <div class="service-details">
          <p class="date-time">{formatDateTime(service.time)}</p>
          <p class="location">{service.location.address}</p>
          <p class="duration">{service.hours} hours</p>
        </div>
        <div class="stream-preview">
          {#if service.status === 'live'}
            <div class="live-indicator">🔴 LIVE</div>
          {:else if service.status === 'scheduled'}
            <div class="scheduled-indicator">📅 Scheduled</div>
          {:else}
            <div class="completed-indicator">✅ Completed</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
```

#### 2.2 Right Panel (1/3) - Dynamic Stream Controls

**Enhanced Stream Setup:**
```svelte
<!-- Dynamic Stream Credentials -->
<div class="stream-setup-panel">
  {#if selectedService}
    <h2>Stream Setup - {selectedService.title}</h2>
    <div class="service-info">
      <p>{formatDateTime(selectedService.time)}</p>
      <p>{selectedService.location.name}</p>
    </div>
    
    <!-- Dynamic credentials based on selected service -->
    <div class="credentials">
      <input readonly value={selectedService.streamUrl} />
      <input readonly value={selectedService.streamKey} type="password" />
    </div>
    
    <!-- Go Live button (only active when service selected) -->
    <button class="go-live-btn" disabled={!selectedService}>
      Go Live for {selectedService.title}
    </button>
  {:else}
    <div class="no-selection">
      <p>Select a scheduled service to configure stream</p>
    </div>
  {/if}
</div>
```

#### 2.3 New Livestream Creation Modal

**Create New Stream Interface:**
```svelte
<!-- Modal for creating new livestream -->
{#if showCreateModal}
  <div class="modal-overlay">
    <div class="create-stream-modal">
      <h2>Create New Livestream</h2>
      <form onsubmit={createNewStream}>
        <div class="form-group">
          <label>Stream Title</label>
          <input bind:value={newStreamTitle} required />
        </div>
        
        <div class="form-group">
          <label>Schedule Type</label>
          <select bind:value={scheduleType}>
            <option value="now">Go Live Now</option>
            <option value="scheduled">Schedule for Later</option>
          </select>
        </div>
        
        {#if scheduleType === 'scheduled'}
          <div class="form-group">
            <label>Scheduled Date & Time</label>
            <input type="datetime-local" bind:value={scheduledDateTime} required />
          </div>
        {/if}
        
        <div class="modal-actions">
          <button type="button" onclick={() => showCreateModal = false}>Cancel</button>
          <button type="submit">Create Stream</button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

### Phase 3: State Management & Logic

#### 3.1 Component State Structure
```typescript
// Main component state
let scheduledServices = $state<ScheduledService[]>([]);
let selectedService = $state<ScheduledService | null>(null);
let showCreateModal = $state(false);
let newStreamTitle = $state('');
let scheduleType = $state<'now' | 'scheduled'>('now');
let scheduledDateTime = $state('');

// Reactive stream credentials
let streamCredentials = $derived(() => {
  if (!selectedService) return null;
  return {
    serverUrl: selectedService.streamUrl,
    streamKey: selectedService.streamKey
  };
});
```

#### 3.2 Service Selection Logic
```typescript
function selectService(service: ScheduledService) {
  selectedService = service;
  console.log('🎯 Selected service:', service.title);
  
  // Update stream credentials in right panel
  // Enable go-live functionality
  // Load service-specific configuration
}

async function createNewStream() {
  const streamData = {
    title: newStreamTitle,
    scheduleType,
    scheduledTime: scheduleType === 'scheduled' ? scheduledDateTime : null
  };
  
  const response = await fetch(`/api/memorials/${memorial.id}/scheduled-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamData)
  });
  
  if (response.ok) {
    const newService = await response.json();
    scheduledServices = [...scheduledServices, newService];
    showCreateModal = false;
    selectService(newService);
  }
}
```

### Phase 4: UI/UX Enhancements

#### 4.1 Visual Design Updates
**Service Cards:**
- Clean card-based layout for each scheduled service
- Color-coded status indicators (scheduled/live/completed)
- Hover effects and selection states
- Responsive grid layout

**Stream Selection Flow:**
- Clear visual feedback when service is selected
- Disabled states when no service selected
- Loading states during stream creation
- Success/error notifications

#### 4.2 Responsive Design
```css
.scheduled-services-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
}

.service-card {
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.service-card.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}
```

### Phase 5: Integration & Testing

#### 5.1 Data Flow Testing
1. **Service Loading**: Verify scheduled services load from calculator data
2. **Service Selection**: Test dynamic credential updates
3. **Stream Creation**: Validate new stream creation and integration
4. **Multi-Service**: Test switching between different services
5. **Real-time Updates**: Ensure status updates work correctly

#### 5.2 User Experience Testing
1. **Selection Flow**: User must select service before going live
2. **Visual Feedback**: Clear indication of selected service
3. **Error Handling**: Graceful handling of missing data
4. **Mobile Responsiveness**: Touch-friendly service selection
5. **Loading States**: Smooth transitions during operations

## Implementation Timeline

### Week 1: Backend Foundation
- [ ] Update API endpoints for scheduled services
- [ ] Enhance database schema
- [ ] Create service management utilities
- [ ] Test data integration with calculator

### Week 2: Frontend Refactoring
- [ ] Remove existing left panel components
- [ ] Implement scheduled services display
- [ ] Create service selection logic
- [ ] Update right panel for dynamic credentials

### Week 3: New Features & Polish
- [ ] Implement "Create New Livestream" functionality
- [ ] Add modal interface for stream creation
- [ ] Enhance UI/UX with animations and states
- [ ] Implement responsive design

### Week 4: Testing & Refinement
- [ ] Comprehensive testing of all flows
- [ ] Performance optimization
- [ ] Bug fixes and edge case handling
- [ ] Documentation updates

## Success Criteria

### Functional Requirements:
- ✅ Scheduled services display from calculator data
- ✅ Required service selection before going live
- ✅ Dynamic stream credentials per service
- ✅ New livestream creation capability
- ✅ Multi-service stream management

### User Experience Requirements:
- ✅ Intuitive service selection interface
- ✅ Clear visual feedback and status indicators
- ✅ Responsive design across devices
- ✅ Smooth transitions and loading states
- ✅ Error handling and user guidance

### Technical Requirements:
- ✅ Clean integration with existing calculator system
- ✅ Scalable architecture for multiple services
- ✅ Proper state management and reactivity
- ✅ Comprehensive error handling
- ✅ Performance optimization

## Future Enhancements

### Phase 2 Considerations:
1. **Advanced Scheduling**: Recurring streams, bulk operations
2. **Stream Analytics**: Viewer metrics per service
3. **Automated Workflows**: Auto-start based on schedule
4. **Enhanced Archive**: Service-specific recording management
5. **Mobile App Integration**: Native mobile streaming support

## Risk Mitigation

### Potential Issues:
1. **Data Migration**: Existing livestream configurations
2. **Performance**: Multiple stream management overhead
3. **User Adoption**: Learning curve for new interface
4. **Integration Complexity**: Calculator system dependencies

### Mitigation Strategies:
1. **Backward Compatibility**: Maintain support for existing streams
2. **Progressive Enhancement**: Gradual feature rollout
3. **User Training**: Documentation and onboarding guides
4. **Thorough Testing**: Comprehensive QA before deployment

---

This refactoring plan transforms the Livestream Control Center from a single-stream interface into a comprehensive, schedule-aware streaming management system that seamlessly integrates with the existing calculator and booking infrastructure.
