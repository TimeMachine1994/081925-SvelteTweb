import type { Memorial, User, FuneralDirector, Stream } from '$lib/types';

// Test data factories for consistent test data generation
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  uid: 'test-user-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'owner',
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  phone: '(555) 123-4567',
  ...overrides
});

export const createTestMemorial = (overrides: Partial<Memorial> = {}): Memorial => ({
  id: 'test-memorial-id',
  lovedOneName: 'John Doe',
  slug: 'celebration-of-life-for-john-doe',
  fullSlug: 'celebration-of-life-for-john-doe',
  ownerUid: 'test-owner-uid',
  ownerEmail: 'owner@test.com',
  creatorEmail: 'owner@test.com',
  creatorName: 'Test Owner',
  services: {
    main: {
      location: { 
        name: 'Memorial Chapel', 
        address: '123 Main St, City, State 12345',
        isUnknown: false 
      },
      time: { 
        date: '2024-01-15', 
        time: '14:00',
        isUnknown: false 
      },
      hours: 2
    },
    additional: []
  },
  isPublic: true,
  content: 'A loving tribute to John Doe...',
  custom_html: null,
  isPaid: false,
  hasPaidForMemorial: false,
  birthDate: '1950-01-01',
  deathDate: '2024-01-01',
  memorialDate: '2024-01-15',
  familyContactName: 'Jane Doe',
  familyContactEmail: 'jane@example.com',
  familyContactPhone: '(555) 987-6543',
  photos: [],
  embeds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestFuneralDirector = (overrides: Partial<FuneralDirector> = {}): FuneralDirector => ({
  id: 'test-fd-id',
  uid: 'test-fd-uid',
  email: 'director@funeral.com',
  companyName: 'Memorial Services Inc',
  contactPerson: 'John Director',
  phone: '(555) 555-5555',
  address: {
    street: '456 Business Ave',
    city: 'City',
    state: 'State',
    zipCode: '12345'
  },
  status: 'approved',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestStream = (overrides: Partial<Stream> = {}): Stream => ({
  id: 'test-stream-id',
  memorialId: 'test-memorial-id',
  title: 'Memorial Service Stream',
  description: 'Live stream of memorial service',
  scheduledStartTime: new Date(Date.now() + 3600000), // 1 hour from now
  isLive: false,
  isVisible: true,
  rtmpEnabled: true,
  whipEnabled: false,
  rtmpUrl: 'rtmp://live.cloudflare.com/live',
  rtmpStreamKey: 'test-stream-key',
  cloudflareInputId: 'test-input-id',
  cloudflareStreamId: null,
  recordingUrl: null,
  thumbnailUrl: null,
  viewerCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-fd-uid',
  ...overrides
});

export const createTestCalculatorConfig = () => ({
  selectedTier: 'standard',
  totalPrice: 199,
  services: {
    main: {
      location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
      time: { date: '2024-01-15', time: '14:00', isUnknown: false },
      hours: 2
    },
    additional: []
  },
  addOns: [],
  bookingDetails: {
    hasReception: false,
    receptionLocation: '',
    specialRequests: ''
  }
});

export const createTestPaymentData = () => ({
  amount: 19900, // $199.00 in cents
  currency: 'usd',
  description: 'Memorial Service Package',
  metadata: {
    memorialId: 'test-memorial-id',
    tier: 'standard'
  }
});

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  error: success ? null : 'Mock error message'
});

// Mock Firebase document
export const mockFirebaseDoc = <T>(data: T) => ({
  id: 'test-doc-id',
  data: () => data,
  exists: () => true,
  ref: { id: 'test-doc-id' }
});

// Mock Firebase collection
export const mockFirebaseCollection = <T>(docs: T[]) => ({
  docs: docs.map(doc => mockFirebaseDoc(doc)),
  empty: docs.length === 0,
  size: docs.length
});
