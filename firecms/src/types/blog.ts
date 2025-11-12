// firecms/src/types/blog.ts

/**
 * Defines the data structure for a BlogPost document in Firestore.
 * Comprehensive blog management for Tributestream content marketing.
 */
export type BlogPost = {
    // Core blog information
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string; // Markdown content
    
    // Author information
    authorName: string;
    authorEmail: string;
    authorBio?: string;
    authorAvatar?: string;
    
    // Featured image
    featuredImage?: string;
    featuredImageAlt?: string;
    
    // Categorization
    category: 'memorial-planning' | 'grief-support' | 'technology' | 'funeral-industry' | 'livestreaming' | 'company-news' | 'customer-stories';
    tags?: string[];
    
    // Publishing controls
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    publishedAt?: Date;
    featured: boolean;
    
    // SEO fields
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    
    // Engagement metrics
    viewCount: number;
    readingTime?: number; // in minutes
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Blog category configuration for UI display
 */
export const BLOG_CATEGORIES = {
    'memorial-planning': {
        label: 'Memorial Planning',
        color: '#D5BA7F',
        description: 'Planning and organizing memorial services'
    },
    'grief-support': {
        label: 'Grief Support',
        color: '#8B9DC3',
        description: 'Resources and guidance for grief and healing'
    },
    'technology': {
        label: 'Technology',
        color: '#7C9885',
        description: 'Livestreaming technology and digital solutions'
    },
    'funeral-industry': {
        label: 'Funeral Industry',
        color: '#A67C7C',
        description: 'Industry insights and professional resources'
    },
    'livestreaming': {
        label: 'Livestreaming',
        color: '#B8860B',
        description: 'Live streaming services and best practices'
    },
    'company-news': {
        label: 'Company News',
        color: '#6B7280',
        description: 'Tributestream updates and announcements'
    },
    'customer-stories': {
        label: 'Customer Stories',
        color: '#DC2626',
        description: 'Real stories from families and funeral directors'
    }
} as const;

/**
 * Blog post status configuration
 */
export const BLOG_STATUS = {
    'draft': {
        label: 'Draft',
        color: '#6B7280',
        description: 'Post is being written'
    },
    'published': {
        label: 'Published',
        color: '#059669',
        description: 'Post is live and visible'
    },
    'scheduled': {
        label: 'Scheduled',
        color: '#D97706',
        description: 'Post is scheduled for future publication'
    },
    'archived': {
        label: 'Archived',
        color: '#9CA3AF',
        description: 'Post is no longer active'
    }
} as const;
