import type { Timestamp } from 'firebase/firestore';

export interface FuneralDirector {
  id: string;
  
  // Basic Info
  companyName: string;
  licenseNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Business Details
  businessType: 'funeral_home' | 'crematory' | 'memorial_service' | 'other';
  servicesOffered: string[];
  yearsInBusiness: number;
  
  // Account Status
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  verificationStatus: 'unverified' | 'pending' | 'verified';
  
  // Permissions
  permissions: {
    canCreateMemorials: boolean;
    canManageMemorials: boolean;
    canLivestream: boolean;
    maxMemorials: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  
  // Streaming Configuration
  streamingConfig?: {
    provider: 'youtube' | 'facebook' | 'custom';
    streamKey?: string;
    maxConcurrentStreams: number;
    streamingEnabled: boolean;
  };
}

export interface ServiceDetails {
  date: string;
  time: string;
  location: string;
  address: string;
  officiant?: string;
  notes?: string;
}

export interface FuneralDirectorMemorialRequest {
  // Deceased Information (Enhanced)
  deceased: {
    firstName: string;
    lastName: string;
    middleName?: string;
    nickname?: string;
    dateOfBirth: string;
    dateOfDeath: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    causeOfDeath?: string;
    
    // Physical Description
    profilePhoto?: File;
    height?: string;
    eyeColor?: string;
    hairColor?: string;
    
    // Life Details
    occupation?: string;
    education?: string;
    militaryService?: boolean;
    militaryBranch?: string;
    militaryRank?: string;
  };
  
  // Family Information (Enhanced)
  family: {
    spouse?: {
      name: string;
      status: 'surviving' | 'predeceased';
      marriageDate?: string;
    };
    children?: Array<{
      name: string;
      relationship: 'son' | 'daughter' | 'stepson' | 'stepdaughter';
      status: 'surviving' | 'predeceased';
    }>;
    parents?: Array<{
      name: string;
      relationship: 'father' | 'mother' | 'stepfather' | 'stepmother';
      status: 'surviving' | 'predeceased';
    }>;
    siblings?: Array<{
      name: string;
      relationship: 'brother' | 'sister' | 'stepbrother' | 'stepsister';
      status: 'surviving' | 'predeceased';
    }>;
  };
  
  // Service Information
  services: {
    viewingDetails?: ServiceDetails;
    funeralDetails?: ServiceDetails;
    burialDetails?: ServiceDetails;
    memorialDetails?: ServiceDetails;
  };
  
  // Funeral Director Information (Auto-filled)
  funeralDirector: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber: string;
  };
  
  // Owner Information
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  
  // Memorial Configuration
  memorial: {
    title?: string;
    description?: string;
    isPublic: boolean;
    allowComments: boolean;
    allowPhotos: boolean;
    allowTributes: boolean;
    enableLivestream: boolean;
    customSlug?: string;
  };
  
  // Additional Options
  options: {
    sendNotifications: boolean;
    createGuestbook: boolean;
    enableDonations: boolean;
    donationRecipient?: string;
    enableFlowers: boolean;
    flowerProvider?: string;
  };
}

export interface LivestreamSession {
  id: string;
  
  // Stream Details
  title: string;
  description?: string;
  scheduledStartTime: Timestamp;
  actualStartTime?: Timestamp;
  endTime?: Timestamp;
  
  // Stream Configuration
  streamConfig: {
    provider: 'youtube' | 'facebook' | 'custom' | 'internal';
    streamUrl?: string;
    streamKey?: string;
    embedCode?: string;
    maxViewers?: number;
  };
  
  // Status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled' | 'error';
  
  // Permissions
  isPublic: boolean;
  requiresPassword: boolean;
  password?: string;
  allowedViewers?: string[];
  
  // Analytics
  analytics: {
    peakViewers: number;
    totalViews: number;
    averageWatchTime: number;
    chatMessages: number;
  };
  
  // Funeral Director Info
  funeralDirectorId: string;
  createdBy: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
