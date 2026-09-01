// frontend/src/routes/blog/[slug]/+page.server.ts

import { adminDb, adminStorage } from '$lib/server/admin';
import { slugify } from '$lib/utils/calculator';
import type { PageServerLoad } from './$types';
import type { BlogPost } from '../+page.server';
import { error, redirect, isRedirect } from '@sveltejs/kit';

// Helper function to convert storage path to public URL
async function getStorageUrl(storagePath: string): Promise<string> {
    try {
        if (!storagePath) return '';
        
        // If it's already a full URL, return as-is
        if (storagePath.startsWith('http')) {
            return storagePath;
        }
        
        // Get download URL from Firebase Storage
        const file = adminStorage.bucket().file(storagePath);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491' // Far future date for public images
        });
        
        // Ensure URL is absolute (signed URLs should already be absolute)
        return url;
    } catch (err) {
        console.error('Error getting storage URL for:', storagePath, err);
        // If error, try to construct a fallback URL if possible
        if (storagePath && !storagePath.startsWith('http')) {
            // This is a fallback - signed URLs are preferred for security
            return `https://firebasestorage.googleapis.com/v0/b/${adminStorage.bucket().name}/o/${encodeURIComponent(storagePath)}?alt=media`;
        }
        return storagePath; // Return original path as last resort
    }
}

export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;
    
    try {
        console.log('🔍 Fetching blog post by slug:', slug);

        // Redirect legacy/unslugified URLs (e.g. with spaces) to the canonical clean slug
        const normalized = slugify(slug);
        if (normalized && normalized !== slug) {
            throw redirect(301, `/blog/${normalized}`);
        }

        // Query Firestore for the blog post by slug
        const postQuery = await adminDb.collection('blog')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        
        let postDoc = postQuery.docs[0];

        // Fallback: some legacy posts have unslugified slugs (spaces, punctuation)
        // stored in Firestore. Match by normalized slug/title so clean URLs resolve.
        if (!postDoc) {
            const publishedQuery = await adminDb.collection('blog')
                .where('status', '==', 'published')
                .limit(100)
                .get();
            postDoc = publishedQuery.docs.find((doc) => {
                const data = doc.data();
                return slugify(data.slug || '') === normalized || slugify(data.title || '') === normalized;
            })!;

            if (!postDoc) {
                console.warn('❌ Blog post not found:', slug);
                throw error(404, 'Blog post not found');
            }
        }

        const postData = postDoc.data();
        
        const post: BlogPost = {
            id: postDoc.id,
            ...postData,
            publishedAt: postData.publishedAt?.toDate() || null,
            createdAt: postData.createdAt?.toDate() || new Date(),
            updatedAt: postData.updatedAt?.toDate() || new Date()
        } as BlogPost;

        // Normalize slug so canonical/OG URLs never contain spaces
        post.slug = slugify(post.slug || post.title || '');

        // Convert storage paths to proper URLs
        if (post.featuredImage) {
            post.featuredImage = await getStorageUrl(post.featuredImage);
        }
        if (post.authorAvatar) {
            post.authorAvatar = await getStorageUrl(post.authorAvatar);
        }
        
        // Get related posts (same category, excluding current post)
        const relatedQuery = await adminDb.collection('blog')
            .where('status', '==', 'published')
            .where('category', '==', post.category)
            .orderBy('publishedAt', 'desc')
            .limit(4)
            .get();
        
        const relatedPosts = await Promise.all(
            relatedQuery.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    publishedAt: doc.data().publishedAt?.toDate() || null,
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                }) as BlogPost)
                .filter(relatedPost => relatedPost.id !== post.id)
                .slice(0, 3)
                .map(async (relatedPost) => {
                    // Normalize slug and resolve storage paths (raw paths render as broken relative URLs)
                    relatedPost.slug = slugify(relatedPost.slug || relatedPost.title || '');
                    if (relatedPost.featuredImage) {
                        relatedPost.featuredImage = await getStorageUrl(relatedPost.featuredImage);
                    }
                    return relatedPost;
                })
        );
        
        console.log('✅ Successfully loaded blog post:', post.title);
        console.log('📸 Featured image URL:', post.featuredImage);
        
        return {
            post,
            relatedPosts
        };
        
    } catch (err: any) {
        if (isRedirect(err)) {
            throw err;
        }

        console.error('❌ Error fetching blog post:', err);
        
        if (err?.status === 404) {
            throw err;
        }
        
        throw error(500, 'Failed to load blog post');
    }
};
