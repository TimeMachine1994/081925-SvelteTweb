// Test data fixtures for consistent testing
export const testMemorials = [
  {
    id: 'memorial-1',
    lovedOneName: 'John Doe',
    slug: 'celebration-of-life-for-john-doe',
    fullSlug: 'celebration-of-life-for-john-doe',
    ownerUid: 'owner-1',
    ownerEmail: 'owner1@test.com',
    creatorEmail: 'owner1@test.com',
    creatorName: 'Jane Doe',
    services: {
      main: {
        location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
        time: { date: '2024-06-15', time: '14:00', isUnknown: false },
        hours: 2
      },
      additional: []
    },
    isPublic: true,
    content: 'A loving tribute to John Doe...',
    isPaid: true,
    birthDate: '1950-01-01',
    deathDate: '2024-01-01',
    memorialDate: '2024-06-15',
    familyContactName: 'Jane Doe',
    familyContactEmail: 'jane@example.com',
    familyContactPhone: '(555) 123-4567',
    photos: [],
    embeds: [],
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z')
  },
  {
    id: 'memorial-2',
    lovedOneName: 'Mary Smith',
    slug: 'celebration-of-life-for-mary-smith',
    fullSlug: 'celebration-of-life-for-mary-smith',
    ownerUid: 'owner-2',
    ownerEmail: 'owner2@test.com',
    creatorEmail: 'owner2@test.com',
    creatorName: 'Bob Smith',
    services: {
      main: {
        location: { name: 'Community Center', address: '456 Oak Ave', isUnknown: false },
        time: { date: '2024-07-20', time: '10:00', isUnknown: false },
        hours: 3
      },
      additional: [
        {
          location: { name: 'Reception Hall', address: '789 Pine St', isUnknown: false },
          time: { date: '2024-07-20', time: '13:00', isUnknown: false },
          hours: 2
        }
      ]
    },
    isPublic: false,
    content: 'In loving memory of Mary Smith...',
    isPaid: false,
    birthDate: '1945-05-15',
    deathDate: '2024-06-01',
    memorialDate: '2024-07-20',
    familyContactName: 'Bob Smith',
    familyContactEmail: 'bob@example.com',
    familyContactPhone: '(555) 987-6543',
    photos: [],
    embeds: [],
    createdAt: new Date('2024-06-02T00:00:00Z'),
    updatedAt: new Date('2024-06-02T00:00:00Z')
  }
];

export const testUsers = [
  {
    uid: 'owner-1',
    email: 'owner1@test.com',
    displayName: 'Jane Doe',
    role: 'owner',
    phone: '(555) 123-4567',
    memorialCount: 1,
    hasPaidForMemorial: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-02T00:00:00Z'
  },
  {
    uid: 'owner-2',
    email: 'owner2@test.com',
    displayName: 'Bob Smith',
    role: 'owner',
    phone: '(555) 987-6543',
    memorialCount: 1,
    hasPaidForMemorial: false,
    createdAt: '2024-06-01T00:00:00Z',
    lastLoginAt: '2024-06-02T00:00:00Z'
  },
  {
    uid: 'director-1',
    email: 'director1@test.com',
    displayName: 'John Director',
    role: 'funeral_director',
    phone: '(555) 555-5555',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-02T00:00:00Z'
  },
  {
    uid: 'admin-1',
    email: 'admin1@test.com',
    displayName: 'Admin User',
    role: 'admin',
    phone: '(555) 111-1111',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-02T00:00:00Z'
  }
];

export const testFuneralDirectors = [
  {
    id: 'fd-1',
    uid: 'director-1',
    email: 'director1@test.com',
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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'fd-2',
    uid: 'director-2',
    email: 'director2@test.com',
    companyName: 'Peaceful Rest Funeral Home',
    contactPerson: 'Sarah Director',
    phone: '(555) 666-6666',
    address: {
      street: '789 Service Blvd',
      city: 'Town',
      state: 'State',
      zipCode: '54321'
    },
    status: 'pending',
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z')
  }
];

export const testStreams = [
  {
    id: 'stream-1',
    memorialId: 'memorial-1',
    title: 'Memorial Service Live Stream',
    description: 'Live coverage of John Doe memorial service',
    scheduledStartTime: new Date('2024-06-15T14:00:00Z'),
    isLive: false,
    isVisible: true,
    rtmpEnabled: true,
    whipEnabled: false,
    rtmpUrl: 'rtmp://live.cloudflare.com/live',
    rtmpStreamKey: 'test-stream-key-1',
    cloudflareInputId: 'input-1',
    cloudflareStreamId: null,
    recordingUrl: null,
    thumbnailUrl: null,
    viewerCount: 0,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    createdBy: 'director-1'
  },
  {
    id: 'stream-2',
    memorialId: 'memorial-1',
    title: 'Phone Stream',
    description: 'Mobile phone streaming',
    scheduledStartTime: new Date('2024-06-15T14:00:00Z'),
    isLive: false,
    isVisible: false,
    rtmpEnabled: false,
    whipEnabled: true,
    rtmpUrl: null,
    rtmpStreamKey: null,
    cloudflareInputId: 'input-2',
    cloudflareStreamId: null,
    recordingUrl: null,
    thumbnailUrl: null,
    viewerCount: 0,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    createdBy: 'director-1'
  }
];

export const testCalculatorConfigs = [
  {
    memorialId: 'memorial-1',
    selectedTier: 'standard',
    totalPrice: 199,
    services: {
      main: {
        location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
        time: { date: '2024-06-15', time: '14:00', isUnknown: false },
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
  },
  {
    memorialId: 'memorial-2',
    selectedTier: 'premium',
    totalPrice: 299,
    services: {
      main: {
        location: { name: 'Community Center', address: '456 Oak Ave', isUnknown: false },
        time: { date: '2024-07-20', time: '10:00', isUnknown: false },
        hours: 3
      },
      additional: [
        {
          location: { name: 'Reception Hall', address: '789 Pine St', isUnknown: false },
          time: { date: '2024-07-20', time: '13:00', isUnknown: false },
          hours: 2
        }
      ]
    },
    addOns: ['professional_editing', 'custom_graphics'],
    bookingDetails: {
      hasReception: true,
      receptionLocation: 'Reception Hall',
      specialRequests: 'Please ensure wheelchair accessibility'
    }
  }
];

export const testAuditLogs = [
  {
    id: 'audit-1',
    timestamp: new Date('2024-06-01T10:00:00Z'),
    action: 'memorial_created',
    userId: 'owner-1',
    userEmail: 'owner1@test.com',
    resourceType: 'memorial',
    resourceId: 'memorial-1',
    details: {
      lovedOneName: 'John Doe',
      ownerEmail: 'owner1@test.com'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    result: 'success'
  },
  {
    id: 'audit-2',
    timestamp: new Date('2024-06-01T11:00:00Z'),
    action: 'stream_created',
    userId: 'director-1',
    userEmail: 'director1@test.com',
    resourceType: 'stream',
    resourceId: 'stream-1',
    details: {
      memorialId: 'memorial-1',
      streamType: 'rtmp'
    },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    result: 'success'
  },
  {
    id: 'audit-3',
    timestamp: new Date('2024-06-01T12:00:00Z'),
    action: 'login_attempt',
    userId: 'owner-1',
    userEmail: 'owner1@test.com',
    resourceType: 'auth',
    resourceId: null,
    details: {
      method: 'email_password'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    result: 'success'
  },
  {
    id: 'audit-4',
    timestamp: new Date('2024-06-01T13:00:00Z'),
    action: 'access_denied',
    userId: 'owner-1',
    userEmail: 'owner1@test.com',
    resourceType: 'admin',
    resourceId: null,
    details: {
      attemptedAction: 'admin_portal_access',
      reason: 'insufficient_permissions'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    result: 'failure'
  }
];
