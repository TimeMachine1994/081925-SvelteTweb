# Minimal Modern Theme Integration Guide

This guide shows how to integrate the new Minimal Modern design system into your existing Tributestream components.

## 🎨 Theme System Overview

The Minimal Modern theme provides:
- **Clean, airy design** with soft neutrals and gold accents
- **ABeeZee font** for modern, readable typography
- **Comprehensive component library** with consistent styling
- **Background presets** for visual variety
- **Responsive design** with mobile-first approach

## 📦 Available Components

### Core Components
- `Button` - Primary and secondary button variants
- `Input` - Form inputs with consistent styling
- `Card` - Content containers with optional titles
- `Badge` - Status and category indicators

### Advanced Components
- `Steps` - Process flow indicators
- `Timeline` - Event scheduling displays
- `Comparison` - Pricing/feature comparison tables
- `FAQ` - Collapsible question/answer sections
- `Stats` - Metric display grids
- `Gallery` - Image galleries with captions
- `VideoPlayer` - Custom video player with scheduling support

### Utility Components
- `Breadcrumbs` - Navigation breadcrumbs
- `TagCloud` - Tag collections
- `Toast` - Notification messages

### Tributestream Specific Components
- `MemorialCard` - Event display cards with live status
- `ServiceSchedule` - Timeline for event service events
- `CondolenceForm` - Form for submitting condolences and memories
- `StreamStatus` - Live stream status indicator with viewer count

## 🚀 Quick Start

### 1. Import Components
```typescript
import { Button, Card, Input } from '$lib/components/minimal-modern';
```

### 2. Use in Templates
```svelte
<Card title="Event Creation" theme="minimal">
  <Input theme="minimal" placeholder="Loved one's name" bind:value={name} />
  <Button theme="minimal">Create Event</Button>
</Card>
```

### 3. Apply Theme Classes
```svelte
<script>
  import { getTheme } from '$lib/design-tokens/minimal-modern-theme.js';
  const theme = getTheme('minimal');
</script>

<div class="{theme.root}">
  <h1 class="{theme.hero.heading}" style="font-family: {theme.font.heading}">
    Welcome to Tributestream
  </h1>
</div>
```

## 🎯 Integration Examples

### Example 1: Event Card Component
```svelte
<script lang="ts">
  import { Card, Button, Badge } from '$lib/components/minimal-modern';
  import type { Event } from '$lib/types';
  
  interface Props {
    event: Event;
  }
  
  let { event }: Props = $props();
</script>

<Card title={event.name} theme="minimal">
  <div class="space-y-3">
    <p class="text-sm opacity-80">{event.dates}</p>
    <div class="flex gap-2">
      <Badge theme="minimal">Private</Badge>
      {#if event.isLive}
        <Badge theme="minimal">Live</Badge>
      {/if}
    </div>
    <Button theme="minimal">View Event</Button>
  </div>
</Card>
```

### Example 2: Service Timeline
```svelte
<script lang="ts">
  import { Timeline, Card } from '$lib/components/minimal-modern';
  
  const events = [
    { time: "10:00 AM", title: "Visitation", detail: "Family receiving guests" },
    { time: "11:00 AM", title: "Service", detail: "Event service begins" },
    { time: "12:00 PM", title: "Reception", detail: "Light refreshments" }
  ];
</script>

<Card title="Service Schedule" theme="minimal">
  <Timeline theme="minimal" {events} />
</Card>
```

### Example 3: Pricing Comparison
```svelte
<script lang="ts">
  import { Comparison } from '$lib/components/minimal-modern';
  
  const packages = [
    { 
      name: "Basic", 
      price: "$395", 
      features: ["2 hour stream", "Private link", "Recording"] 
    },
    { 
      name: "Premium", 
      price: "$895", 
      featured: true,
      features: ["Multi-camera", "Tech support", "Custom graphics"] 
    }
  ];
</script>

<Comparison theme="minimal" tiers={packages} />
```

### Example 4: Event Card
```svelte
<script lang="ts">
  import { MemorialCard } from '$lib/components/minimal-modern';
  
  const event = {
    id: 'event-123',
    name: 'Maria Elena Cruz',
    dates: '1946 – 2025',
    description: 'A gentle soul who touched many lives...',
    imageUrl: '/images/maria.jpg',
    isLive: true,
    viewerCount: 45,
    serviceDate: 'January 15, 2025 at 11:00 AM',
    location: 'St. Mary\'s Church'
  };
</script>

<MemorialCard theme="minimal" {event} onView={handleView} onShare={handleShare} />
```

### Example 5: Stream Status
```svelte
<script lang="ts">
  import { StreamStatus } from '$lib/components/minimal-modern';
</script>

<StreamStatus
  theme="minimal"
  status="live"
  viewerCount={127}
  startTime="2025-01-15T11:00:00"
  onJoin={handleJoinStream}
/>
```

### Example 6: Service Schedule
```svelte
<script lang="ts">
  import { ServiceSchedule } from '$lib/components/minimal-modern';
  
  const events = [
    {
      id: 'visitation',
      title: 'Visitation',
      time: '10:00 AM',
      duration: '1 hour',
      location: 'Church Lobby',
      description: 'Family receiving friends',
      isLive: false,
      streamUrl: '/stream/visitation'
    },
    {
      id: 'service',
      title: 'Event Service',
      time: '11:00 AM',
      duration: '45 minutes',
      location: 'Main Sanctuary',
      description: 'Celebration of life service',
      isLive: true,
      streamUrl: '/stream/service'
    }
  ];
</script>

<ServiceSchedule
  theme="minimal"
  title="Service Schedule"
  date="Tuesday, January 15, 2025"
  {events}
  onJoinStream={handleJoinStream}
/>
```

## 🎨 Background Presets

Use predefined background patterns:

```svelte
<script>
  import { BACKGROUND_PRESETS } from '$lib/components/minimal-modern';
</script>

<div class="{BACKGROUND_PRESETS.goldMist}">
  <!-- Content with gold mist background -->
</div>
```

Available presets:
- `goldMist` - Subtle gold radial gradients
- `emeraldDrift` - Conic gradient with emerald tones
- `amberVeil` - Layered amber gradients
- `charcoalFog` - Textured neutral background

## 🔧 Customization

### Custom Theme Colors
```typescript
// In your component
const customTheme = {
  ...getTheme('minimal'),
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
  }
};
```

### Font Customization
```css
/* In your CSS */
:root {
  --mm-font-family: "Your Custom Font", "ABeeZee", system-ui, sans-serif;
}
```

## 📱 Responsive Design

All components are mobile-first and responsive:
- Grid layouts adapt from 1 column (mobile) to multiple columns (desktop)
- Typography scales appropriately
- Touch-friendly interactive elements
- Optimized spacing for different screen sizes

## 🧪 Testing Your Integration

Visit `/theme-showroom` to see all components in action and test your integrations.

## 🔄 Migration Strategy

1. **Start with new pages** - Use Minimal Modern for new features
2. **Update key components** - Gradually migrate high-impact components
3. **Maintain consistency** - Use the theme system for all new UI elements
4. **Test thoroughly** - Ensure responsive behavior across devices

## 💡 Best Practices

- Always pass the `theme` prop to components
- Use semantic HTML elements
- Maintain accessibility standards
- Test on multiple screen sizes
- Follow the established color palette
- Use consistent spacing and typography

## 🆘 Troubleshooting

### Common Issues
1. **Missing fonts** - Ensure ABeeZee is loaded in app.css
2. **Styling conflicts** - Check for CSS specificity issues
3. **Theme not applied** - Verify theme prop is passed correctly
4. **Responsive issues** - Test with browser dev tools

### Getting Help
- Check the theme showroom for examples
- Review component source code in `src/lib/components/minimal-modern/`
- Test individual components in isolation
