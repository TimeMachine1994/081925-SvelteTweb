import { Star, Shield, Users, Play, Globe, Phone, Clock } from 'lucide-svelte';
import type { 
  TrustBadge, 
  Testimonial, 
  Step, 
  TimelineEvent, 
  Feature, 
  Package, 
  FAQItem 
} from '$lib/types/homepage';

// Trust badges
export const trustBadges: TrustBadge[] = [
  { icon: Globe, text: "Worldwide Streaming" },
  { icon: Users, text: "Custom Link to Share" },
  { icon: Phone, text: "Expert On-Site Support" }
];

// Testimonials
export const testimonials: Testimonial[] = [
  { 
    text: "I joined an online funeral held for my coworker that was streamed by Tributestream. The streaming quality was great and they really respected and honored our friend. I was not able to go to the physical funeral and I still felt as if I was there.", 
    author: "Joshua Hernandez", 
    rating: 5, 
    date: "Dec 6, 2022" 
  },
  { 
    text: "These guys are great. My wife who passed was European, and we had well over 100 live viewers who could not make it to the states for the event. Everyone said the audio and video was top notch. Flawless. They are self sufficient and practically invisible. I highly recommend this service.", 
    author: "Troy Kelly", 
    rating: 5, 
    date: "Sep 16, 2024" 
  },
  { 
    text: "What an awesome company. They captured the entire experience. From the service to the entombment. Highly recommended.", 
    author: "Donna Hinckson-Torres", 
    rating: 5, 
    date: "Sep 24, 2024" 
  }
];

// Partner funeral homes
export const partnerFuneralHomes: string[] = [
  "A Community Funeral Home",
  "Osceola Memory Gardens (All Locations)",
  "De Guispe Funeral Home",
  "Woodward Funeral Home",
  "Baldwin Bros. Funeral Home",
  "Lohman Funeral Home",
  "Cape Canaveral National Cemetery"
];

// How it works steps
export const familySteps: Step[] = [
  { title: "Create Memorial", description: "Set up your loved one's memorial page in minutes" },
  { title: "Schedule Service", description: "Choose date, time, and streaming options" },
  { title: "Share & Stream", description: "Send custom link to family and friends" }
];

export const directorSteps: Step[] = [
  { title: "Book Demo", description: "Schedule a consultation with our team" },
  { title: "Setup Service", description: "We handle all technical setup on-site" },
  { title: "Go Live", description: "Professional streaming with expert support" }
];

// Timeline example
export const sampleTimeline: TimelineEvent[] = [
  { time: "1:00 PM", title: "Tributestream Setup", detail: "Tributestream arrives early to setup gear" },
  { time: "2:00 PM", title: "Livestream", detail: "Memorial service broadcast" },
  { time: "3:00 PM", title: "Recording Available", detail: "Complimentary download available shortly after the service" }
];

// Product proof features
export const productFeatures: Feature[] = [
  {
    icon: Shield,
    title: "Reliability",
    description: "99.9% uptime with automatic failover systems"
  },
  {
    icon: Users,
    title: "Custom links",
    description: "Unique, custom links allow easy access for your invited guests"
  },
  {
    icon: Play,
    title: "Downloadable archive",
    description: "High-quality recording available within 24 hours"
  }
];

// Packages
export const packages: Package[] = [
  { 
    name: "Solo", 
    description: "Perfect for intimate services",
    features: ["Single camera", "Custom link", "HD streaming", "Complimentary download"],
    popular: false,
    familyCta: "Select Package",
    directorCta: "Get Quote"
  },
  { 
    name: "Live", 
    description: "Complete professional service",
    popular: false,
    features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"],
    familyCta: "Select Package",
    directorCta: "Get Quote"
  },
  { 
    name: "Legacy", 
    description: "Complete professional service",
    features: ["2+ locations", "On-site videographer", "Professional editing", "Custom USB"],
    popular: true,
    premium: true,
    familyCta: "Select Package",
    directorCta: "Get Quote"
  }
];

// Regional trust features
export const regionalFeatures: Feature[] = [
  {
    icon: Clock,
    title: "Same-Day Available",
    description: "Emergency streaming setup in most areas"
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Call or text support available"
  },
  {
    icon: Users,
    title: "9 Counties",
    description: "Service coverage area"
  }
];

// FAQ items
export const faqItems: FAQItem[] = [
  { q: "How quickly can we set up streaming?", a: "Same-day streaming available in most areas. Call 407-221-5922 for immediate availability." },
  { q: "Is the memorial link private?", a: "Yes, you control who receives the custom link. Optional password protection available." },
  { q: "Can we download the recording?", a: "Yes, you receive a high-quality downloadable archive after the service." },
  { q: "What if there are technical issues?", a: "Our expert technicians provide on-site support to ensure flawless streaming." },
  { q: "How many people can watch?", a: "Unlimited viewers. Our worldwide content delivery network handles any audience size." },
  { q: "Do you work with funeral homes?", a: "Yes, we partner with funeral directors to provide seamless memorial streaming services." },
  { q: "What's included in the recording?", a: "Full HD recording, downloadable file, and optional edited highlights reel." },
  { q: "How do we share the link?", a: "We provide a custom, secure link that you can share via email, text, or social media." }
];
