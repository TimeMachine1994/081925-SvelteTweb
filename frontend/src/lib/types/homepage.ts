import type { ComponentType } from 'svelte';

// Base interfaces
export interface TrustBadge {
  icon: ComponentType;
  text: string;
}

export interface Testimonial {
  text: string;
  author: string;
  rating: number;
  date: string;
}

export interface Step {
  title: string;
  description: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  detail: string;
}

export interface Feature {
  icon: ComponentType;
  title: string;
  description: string;
}

export interface Package {
  name: string;
  description: string;
  features: string[];
  popular?: boolean;
  premium?: boolean;
  familyCta: string;
  directorCta: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

// Component Props Interfaces
export interface HeroSectionProps {
  lovedOneName: string;
  searchQuery: string;
  onCreateTribute: (name: string) => void;
  onSearchTributes: (query: string) => void;
  onBookDemo: () => void;
  onHowItWorks: () => void;
  onLovedOneNameChange: (name: string) => void;
  onSearchQueryChange: (query: string) => void;
}

export interface TrustBadgesSectionProps {
  badges: TrustBadge[];
}

export interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  partnerFuneralHomes: string[];
}

export interface HowItWorksSectionProps {
  familySteps: Step[];
  directorSteps: Step[];
  sampleTimeline: TimelineEvent[];
  activeTab: 'families' | 'directors';
  currentStep: number;
  onTabChange: (tab: 'families' | 'directors') => void;
  onStepChange: (step: number) => void;
}

export interface ProductProofSectionProps {
  videoSrc: string;
  posterSrc: string;
  features: Feature[];
}

export interface PackagesSectionProps {
  packages: Package[];
  onPackageSelection: (packageName: string) => void;
}

export interface RegionalTrustSectionProps {
  phoneNumber: string;
  serviceAreas: string[];
  features: Feature[];
}

export interface FAQSectionProps {
  faqItems: FAQItem[];
  onContactClick: () => void;
}

// Video Player Interfaces
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  variant?: 'hero' | 'demo' | 'standard';
  aspectRatio?: '16:9' | '4:3' | 'square';
  className?: string;
  playerId?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

export interface VideoControlsProps {
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

// State Management Interfaces
export interface HomepageState {
  lovedOneName: string;
  searchQuery: string;
  activeTab: 'families' | 'directors';
  currentStep: number;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  hasError: boolean;
}

export interface VideoPlayerInstance {
  id: string;
  element: HTMLVideoElement | null;
  state: VideoPlayerState;
}
