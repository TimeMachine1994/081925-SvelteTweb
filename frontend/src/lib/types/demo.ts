/**
 * Demo Mode Type Definitions
 * 
 * Core interfaces for TributeStream's demo system including sessions,
 * users, and entity tagging for sandboxed demo data.
 */

/**
 * Demo session represents a time-boxed demo environment with 4 pre-created users
 */
export interface DemoSession {
  /** Unique session identifier */
  id: string;
  
  /** Session creation timestamp */
  createdAt: Date;
  
  /** Session expiration timestamp */
  expiresAt: Date;
  
  /** Current session status */
  status: 'active' | 'expired' | 'ended';
  
  /** UID of admin user who created this session */
  createdBy: string;
  
  /** Pre-created demo users for all roles */
  users: {
    admin: DemoUser;
    funeral_director: DemoUser;
    owner: DemoUser;
    viewer: DemoUser;
  };
  
  /** Currently active role in this session */
  currentRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  
  /** Optional metadata about session origin and usage */
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    entryPoint?: 'landing_page' | 'sales_portal' | 'magic_link';
    scenario?: string;
  };
  
  /** Timestamp of last role switch */
  lastRoleSwitch?: Date;
}

/**
 * Demo user account created for a specific demo session
 */
export interface DemoUser {
  /** Firebase Auth UID */
  uid: string;
  
  /** Demo email address */
  email: string;
  
  /** Display name for this demo user */
  displayName: string;
  
  /** User role */
  role: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  
  /** Optional custom token for authentication */
  customToken?: string;
}

/**
 * Base interface for demo entities - memorials, streams, slideshows, etc.
 * All demo data should include these fields for cleanup and isolation
 */
export interface DemoEntity {
  /** Flag indicating this is demo data */
  isDemo: true;
  
  /** Session ID this entity belongs to */
  demoSessionId: string;
  
  /** ISO timestamp when this demo data expires */
  demoExpiresAt: string;
}

/**
 * Demo memorial with full demo entity metadata
 */
export interface DemoMemorial extends DemoEntity {
  /** Memorial document ID */
  memorialId: string;
  
  /** Name of the loved one */
  lovedOneName: string;
  
  /** Memorial full slug for URL */
  fullSlug: string;
  
  /** Owner user ID (will be demo user) */
  ownerUid: string;
  
  /** Optional funeral director ID */
  funeralDirectorUid?: string;
  
  /** Whether memorial is public */
  isPublic: boolean;
}

/**
 * Demo stream with full demo entity metadata
 */
export interface DemoStream extends DemoEntity {
  /** Stream document ID */
  streamId: string;
  
  /** Stream title */
  title: string;
  
  /** Associated memorial ID */
  memorialId: string;
  
  /** Stream status */
  status: 'scheduled' | 'live' | 'ended';
  
  /** Optional scheduled start time */
  scheduledStartTime?: string;
}

/**
 * Demo slideshow with full demo entity metadata
 */
export interface DemoSlideshow extends DemoEntity {
  /** Slideshow document ID */
  slideshowId: string;
  
  /** Slideshow title */
  title: string;
  
  /** Associated memorial ID */
  memorialId: string;
  
  /** Number of photos in slideshow */
  photoCount: number;
}

/**
 * Demo scenario template definition
 */
export interface DemoScenario {
  /** Unique scenario identifier */
  id: string;
  
  /** Display name for scenario */
  name: string;
  
  /** Description of what user will experience */
  description: string;
  
  /** Icon/emoji for UI display */
  icon: string;
  
  /** Initial role user will start with */
  initialRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
  
  /** Whether this scenario includes pre-populated data */
  includesData: boolean;
  
  /** Optional tour ID to start automatically */
  tourId?: string;
}

/**
 * Demo session creation request
 */
export interface CreateDemoSessionRequest {
  /** Selected scenario ID */
  scenario?: string;
  
  /** Session duration in hours (default 2) */
  duration?: number;
  
  /** Optional metadata */
  metadata?: {
    entryPoint?: string;
    referrer?: string;
  };
}

/**
 * Demo session creation response
 */
export interface CreateDemoSessionResponse {
  /** Success flag */
  success: boolean;
  
  /** Created session ID */
  sessionId: string;
  
  /** Custom token for initial authentication */
  customToken: string;
  
  /** Session expiration timestamp */
  expiresAt: string;
  
  /** Initial role assigned */
  initialRole: string;
  
  /** Memorial slug if demo data was seeded */
  memorialSlug?: string;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Demo session status response
 */
export interface DemoSessionStatus {
  /** Session ID */
  id: string;
  
  /** Current status */
  status: 'active' | 'expired' | 'ended';
  
  /** Whether session has expired */
  isExpired: boolean;
  
  /** Time remaining in seconds */
  timeRemaining: number;
  
  /** Current active role */
  currentRole: string;
  
  /** Available users for role switching */
  users: {
    admin: DemoUser;
    funeral_director: DemoUser;
    owner: DemoUser;
    viewer: DemoUser;
  };
}

/**
 * Role switch request
 */
export interface SwitchRoleRequest {
  /** Target role to switch to */
  targetRole: 'admin' | 'funeral_director' | 'owner' | 'viewer';
}

/**
 * Role switch response
 */
export interface SwitchRoleResponse {
  /** Success flag */
  success: boolean;
  
  /** Custom token for new role */
  customToken: string;
  
  /** New role */
  role: string;
  
  /** User info for new role */
  user: DemoUser;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Demo cleanup job result
 */
export interface DemoCleanupResult {
  /** Number of sessions cleaned up */
  sessionsProcessed: number;
  
  /** Number of memorials deleted */
  memorialsDeleted: number;
  
  /** Number of streams deleted */
  streamsDeleted: number;
  
  /** Number of slideshows deleted */
  slideshowsDeleted: number;
  
  /** Number of users deleted */
  usersDeleted: number;
  
  /** Any errors encountered */
  errors: string[];
  
  /** Cleanup duration in milliseconds */
  duration: number;
}
