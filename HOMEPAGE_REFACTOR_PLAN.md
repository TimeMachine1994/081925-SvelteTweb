# Homepage Refactor Plan - Component Breakdown & State Management

## 🎯 Current Issues
- **Large component**: 1,022 lines in single file
- **Code duplication**: Two separate video player implementations
- **Complex state**: Multiple video states scattered throughout
- **Maintainability**: Hard to test and modify individual sections

## 📋 Refactor Strategy

### Phase 1: Component Extraction
Break down the homepage into focused, reusable components.

### Phase 2: Reusable Video Player
Create a unified video player component to eliminate duplication.

### Phase 3: State Management
Implement proper state management with stores and reactive patterns.

---

## 🏗️ Component Architecture

### New File Structure
```
src/lib/components/homepage/
├── HeroSection.svelte
├── TrustBadgesSection.svelte
├── TestimonialsSection.svelte
├── HowItWorksSection.svelte
├── ProductProofSection.svelte
├── PackagesSection.svelte
├── RegionalTrustSection.svelte
├── FAQSection.svelte
└── index.ts

src/lib/components/ui/
├── VideoPlayer.svelte
├── VideoControls.svelte
└── index.ts

src/lib/stores/
├── videoPlayer.ts
├── homepage.ts
└── index.ts
```

---

## 📦 Component Breakdown

### 1. HeroSection.svelte
**Lines: ~185 (242-426)**
**Responsibilities:**
- Hero video background
- Dual CTA clusters (Families/Directors)
- Demo video player
- Form inputs and actions

**Props Interface:**
```typescript
interface HeroSectionProps {
  lovedOneName: string;
  searchQuery: string;
  onCreateTribute: (name: string) => void;
  onSearchTributes: (query: string) => void;
  onBookDemo: () => void;
  onHowItWorks: () => void;
}
```

**State:**
- Form input values
- Demo video player state

### 2. TrustBadgesSection.svelte
**Lines: ~15 (428-441)**
**Responsibilities:**
- Display trust badges (Worldwide Streaming, Custom Links, Expert Support)

**Props Interface:**
```typescript
interface TrustBadgesSectionProps {
  badges: Array<{
    icon: ComponentType;
    text: string;
  }>;
}
```

### 3. TestimonialsSection.svelte
**Lines: ~42 (443-485)**
**Responsibilities:**
- Customer testimonials with star ratings
- Partner funeral homes list

**Props Interface:**
```typescript
interface TestimonialsSectionProps {
  testimonials: Array<{
    text: string;
    author: string;
    rating: number;
    date: string;
  }>;
  partnerFuneralHomes: string[];
}
```

### 4. HowItWorksSection.svelte
**Lines: ~80 (487-566)**
**Responsibilities:**
- Tabbed interface (Families/Directors)
- Interactive step buttons
- Timeline display
- Audience-specific CTAs

**Props Interface:**
```typescript
interface HowItWorksSectionProps {
  familySteps: Step[];
  directorSteps: Step[];
  sampleTimeline: TimelineEvent[];
  activeTab: 'families' | 'directors';
  onTabChange: (tab: 'families' | 'directors') => void;
}
```

**State:**
- Active tab
- Current step index

### 5. ProductProofSection.svelte
**Lines: ~128 (568-696)**
**Responsibilities:**
- About Us video player
- Feature bullets
- Professional technology messaging

**Props Interface:**
```typescript
interface ProductProofSectionProps {
  videoSrc: string;
  posterSrc: string;
  features: Array<{
    icon: ComponentType;
    title: string;
    description: string;
  }>;
}
```

**State:**
- Video player state (delegated to VideoPlayer component)

### 6. PackagesSection.svelte
**Lines: ~40 (699-740)**
**Responsibilities:**
- Package comparison cards
- Pricing display
- Package selection CTAs

**Props Interface:**
```typescript
interface PackagesSectionProps {
  packages: Package[];
  onPackageSelection: (packageName: string) => void;
}
```

### 7. RegionalTrustSection.svelte
**Lines: ~22 (742-764)**
**Responsibilities:**
- Central Florida coverage info
- Contact information
- Service area details

**Props Interface:**
```typescript
interface RegionalTrustSectionProps {
  phoneNumber: string;
  serviceAreas: string[];
  features: Array<{
    icon: ComponentType;
    title: string;
    description: string;
  }>;
}
```

### 8. FAQSection.svelte
**Lines: ~20 (766-784)**
**Responsibilities:**
- FAQ accordion
- Contact CTA

**Props Interface:**
```typescript
interface FAQSectionProps {
  faqItems: Array<{
    q: string;
    a: string;
  }>;
  onContactClick: () => void;
}
```

---

## 🎥 Reusable VideoPlayer Component

### VideoPlayer.svelte
**Purpose:** Unified video player to replace duplicate implementations

**Props Interface:**
```typescript
interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  variant?: 'hero' | 'demo' | 'standard';
  aspectRatio?: '16:9' | '4:3' | 'square';
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}
```

**Features:**
- Custom video controls overlay
- Play/pause button overlay
- Progress bar and volume controls
- Fullscreen support
- Multiple visual variants
- Accessibility features
- Loading states and error handling

**State Management:**
```typescript
let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);
let volume = $state(1);
let isLoading = $state(true);
let hasError = $state(false);
```

### VideoControls.svelte
**Purpose:** Reusable control bar component

**Props Interface:**
```typescript
interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  variant?: 'overlay' | 'bottom' | 'custom';
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onFullscreen: () => void;
}
```

---

## 🏪 State Management Strategy

### 1. Homepage Store (homepage.ts)
**Purpose:** Manage global homepage state and form data

```typescript
import { writable, derived } from 'svelte/store';

interface HomepageState {
  lovedOneName: string;
  searchQuery: string;
  activeTab: 'families' | 'directors';
  currentStep: number;
}

export const homepageState = writable<HomepageState>({
  lovedOneName: '',
  searchQuery: '',
  activeTab: 'families',
  currentStep: 0
});

// Derived stores
export const canCreateTribute = derived(
  homepageState,
  ($state) => $state.lovedOneName.trim().length > 0
);

export const canSearchTributes = derived(
  homepageState,
  ($state) => $state.searchQuery.trim().length > 0
);

// Actions
export const homepageActions = {
  updateLovedOneName: (name: string) => {
    homepageState.update(state => ({ ...state, lovedOneName: name }));
  },
  
  updateSearchQuery: (query: string) => {
    homepageState.update(state => ({ ...state, searchQuery: query }));
  },
  
  setActiveTab: (tab: 'families' | 'directors') => {
    homepageState.update(state => ({ ...state, activeTab: tab, currentStep: 0 }));
  },
  
  setCurrentStep: (step: number) => {
    homepageState.update(state => ({ ...state, currentStep: step }));
  }
};
```

### 2. Video Player Store (videoPlayer.ts)
**Purpose:** Manage video player instances and state

```typescript
import { writable } from 'svelte/store';

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  hasError: boolean;
}

interface VideoPlayerInstance {
  id: string;
  element: HTMLVideoElement | null;
  state: VideoPlayerState;
}

export const videoPlayers = writable<Map<string, VideoPlayerInstance>>(new Map());

export const videoPlayerActions = {
  register: (id: string, element: HTMLVideoElement) => {
    videoPlayers.update(players => {
      const newInstance: VideoPlayerInstance = {
        id,
        element,
        state: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 1,
          isLoading: true,
          hasError: false
        }
      };
      players.set(id, newInstance);
      return players;
    });
  },
  
  updateState: (id: string, updates: Partial<VideoPlayerState>) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player) {
        player.state = { ...player.state, ...updates };
        players.set(id, player);
      }
      return players;
    });
  },
  
  play: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        player.element.play();
        player.state.isPlaying = true;
        players.set(id, player);
      }
      return players;
    });
  },
  
  pause: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        player.element.pause();
        player.state.isPlaying = false;
        players.set(id, player);
      }
      return players;
    });
  },
  
  seek: (id: string, time: number) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        player.element.currentTime = time;
        player.state.currentTime = time;
        players.set(id, player);
      }
      return players;
    });
  },
  
  setVolume: (id: string, volume: number) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        player.element.volume = volume;
        player.state.volume = volume;
        players.set(id, player);
      }
      return players;
    });
  }
};
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)
1. **Create component directories and files**
2. **Implement VideoPlayer component**
3. **Set up state management stores**
4. **Create TypeScript interfaces**

### Phase 2: Component Extraction (Week 2)
1. **Extract HeroSection** (most complex)
2. **Extract ProductProofSection** (uses VideoPlayer)
3. **Extract TestimonialsSection** (medium complexity)
4. **Extract HowItWorksSection** (interactive state)

### Phase 3: Simple Components (Week 2)
1. **Extract TrustBadgesSection**
2. **Extract PackagesSection**
3. **Extract RegionalTrustSection**
4. **Extract FAQSection**

### Phase 4: Integration & Testing (Week 3)
1. **Update main homepage to use new components**
2. **Test all functionality**
3. **Optimize performance**
4. **Update documentation**

---

## 📝 Refactored Homepage Structure

### New +page.svelte (Simplified)
```svelte
<script lang="ts">
  import { homepageState, homepageActions } from '$lib/stores/homepage';
  import {
    HeroSection,
    TrustBadgesSection,
    TestimonialsSection,
    HowItWorksSection,
    ProductProofSection,
    PackagesSection,
    RegionalTrustSection,
    FAQSection
  } from '$lib/components/homepage';
  
  // Data imports
  import { trustBadges, testimonials, familySteps, directorSteps, sampleTimeline, packages, faqItems } from './data';
  
  // Navigation functions
  function handleCreateTribute() {
    const { lovedOneName } = $homepageState;
    console.log('🎯 Creating tribute for:', lovedOneName);
    const params = new URLSearchParams();
    if (lovedOneName.trim()) {
      params.set('name', lovedOneName.trim());
    }
    goto(`/register/loved-one?${params.toString()}`);
  }
  
  function handleSearchTributes() {
    const { searchQuery } = $homepageState;
    console.log('🔍 Searching tributes for:', searchQuery);
    if (searchQuery.trim()) {
      goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }
  
  function handleBookDemo() {
    goto('/book-demo');
  }
  
  function handleHowItWorks() {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  }
  
  function handlePackageSelection(packageName: string) {
    const { lovedOneName } = $homepageState;
    const params = new URLSearchParams();
    params.set('package', packageName.toLowerCase());
    if (lovedOneName.trim()) {
      params.set('name', lovedOneName.trim());
    }
    goto(`/register/loved-one?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Beautiful, reliable memorial livestreams - Tributestream</title>
  <meta name="description" content="Custom links. On-site technicians. Heirloom recordings. Professional memorial livestreaming for families and funeral directors." />
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
  <HeroSection
    lovedOneName={$homepageState.lovedOneName}
    searchQuery={$homepageState.searchQuery}
    onCreateTribute={handleCreateTribute}
    onSearchTributes={handleSearchTributes}
    onBookDemo={handleBookDemo}
    onHowItWorks={handleHowItWorks}
    onLovedOneNameChange={homepageActions.updateLovedOneName}
    onSearchQueryChange={homepageActions.updateSearchQuery}
  />
  
  <TrustBadgesSection badges={trustBadges} />
  
  <TestimonialsSection 
    testimonials={testimonials}
    partnerFuneralHomes={partnerFuneralHomes}
  />
  
  <HowItWorksSection
    familySteps={familySteps}
    directorSteps={directorSteps}
    sampleTimeline={sampleTimeline}
    activeTab={$homepageState.activeTab}
    currentStep={$homepageState.currentStep}
    onTabChange={homepageActions.setActiveTab}
    onStepChange={homepageActions.setCurrentStep}
  />
  
  <ProductProofSection
    videoSrc="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_-_about_us%20(1080p).mp4?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a"
    posterSrc="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/video-posters%2Ftributestream-demo-poster.jpg?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a"
    features={productFeatures}
  />
  
  <PackagesSection 
    packages={packages}
    onPackageSelection={handlePackageSelection}
  />
  
  <RegionalTrustSection
    phoneNumber="407-221-5922"
    serviceAreas={["Orange", "Seminole", "Lake", "Volusia"]}
    features={regionalFeatures}
  />
  
  <FAQSection 
    faqItems={faqItems}
    onContactClick={() => goto('/contact')}
  />
</div>
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock store dependencies
- Test prop interfaces and event handling

### Integration Tests
- Test component interactions
- Test state management flows
- Test navigation functions

### Performance Tests
- Measure bundle size impact
- Test video player performance
- Monitor memory usage

---

## 📊 Benefits of Refactor

### Maintainability
- **Smaller components** easier to understand and modify
- **Single responsibility** for each component
- **Reusable VideoPlayer** eliminates code duplication

### Testing
- **Unit testable** components
- **Isolated state** easier to test
- **Mocked dependencies** for reliable tests

### Performance
- **Code splitting** opportunities
- **Lazy loading** potential for sections
- **Optimized re-renders** with focused state

### Developer Experience
- **Better IntelliSense** with smaller files
- **Easier debugging** with isolated components
- **Faster development** with reusable patterns

---

## 🎯 Success Metrics

### Code Quality
- [ ] Reduce main homepage from 1,022 to <200 lines
- [ ] Eliminate duplicate video player code
- [ ] Achieve 100% TypeScript coverage
- [ ] Add comprehensive unit tests

### Performance
- [ ] Maintain current load times
- [ ] Reduce bundle size through code splitting
- [ ] Improve video player efficiency

### Maintainability
- [ ] Enable easy A/B testing of sections
- [ ] Simplify future feature additions
- [ ] Improve code review process

This refactor will transform your homepage into a maintainable, testable, and scalable component architecture while following SvelteKit 5 best practices.
