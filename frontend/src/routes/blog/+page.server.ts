// frontend/src/routes/blog/+page.server.ts

import { adminDb } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorBio?: string;
    authorAvatar?: string;
    featuredImage?: string;
    featuredImageAlt?: string;
    category: string;
    tags?: string[];
    status: string;
    publishedAt?: Date;
    featured: boolean;
    viewCount: number;
    readingTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

export const load: PageServerLoad = async () => {
    try {
        console.log('🔍 Fetching blog posts from Firestore...');
        
        // First, let's see ALL blog posts to debug
        const allBlogPosts = await adminDb.collection('blog').limit(10).get();
        console.log('📊 Total blog documents found:', allBlogPosts.size);
        
        // Debug: Show what posts we found
        console.log(`📊 Found ${allBlogPosts.size} blog posts in Firestore`);
        
        // Now try the published query
        const allPostsQuery = adminDb.collection('blog')
            .where('status', '==', 'published')
            .limit(20);
        
        const allSnapshot = await allPostsQuery.get();
        console.log('📊 Published posts found:', allSnapshot.size);
        
        const allPosts = allSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            publishedAt: doc.data().publishedAt?.toDate() || null,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as BlogPost[];
        
        // Sort and filter posts in JavaScript instead of Firestore
        const sortedPosts = allPosts.sort((a, b) => {
            const dateA = a.publishedAt || a.createdAt;
            const dateB = b.publishedAt || b.createdAt;
            return dateB.getTime() - dateA.getTime();
        });
        
        const featuredPosts = sortedPosts.filter(post => post.featured).slice(0, 3);
        const latestPosts = sortedPosts.filter(post => !post.featured).slice(0, 9);
        
        const categoryCounts: Record<string, number> = {};
        allPosts.forEach((post: BlogPost) => {
            if (post.category) {
                categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
            }
        });
        
        console.log('✅ Successfully loaded blog posts:', {
            featured: featuredPosts.length,
            latest: latestPosts.length,
            total: featuredPosts.length + latestPosts.length
        });
        
        return {
            featuredPosts,
            latestPosts,
            categoryCounts,
            totalPosts: featuredPosts.length + latestPosts.length,
            usingMockData: false
        };
        
    } catch (error) {
        console.error('❌ Error fetching blog posts:', error);
        
        // Fallback to empty data if Firestore fails
        return { 
            featuredPosts: [], 
            latestPosts: [], 
            categoryCounts: {}, 
            totalPosts: 0,
            usingMockData: false,
            error: 'Failed to load blog posts'
        };
    }
};
