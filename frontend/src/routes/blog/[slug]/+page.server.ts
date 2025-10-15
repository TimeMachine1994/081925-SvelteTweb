// frontend/src/routes/blog/[slug]/+page.server.ts

import { adminDb } from '$lib/server/admin';
import type { PageServerLoad } from './$types';
import type { BlogPost } from '../+page.server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;
    
    try {
        console.log('🔍 Fetching blog post by slug:', slug);
        
        // Query Firestore for the blog post by slug
        const postQuery = await adminDb.collection('blog')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        
        if (postQuery.empty) {
            console.warn('❌ Blog post not found:', slug);
            throw error(404, 'Blog post not found');
        }
        
        const postDoc = postQuery.docs[0];
        const postData = postDoc.data();
        
        const post: BlogPost = {
            id: postDoc.id,
            ...postData,
            publishedAt: postData.publishedAt?.toDate() || null,
            createdAt: postData.createdAt?.toDate() || new Date(),
            updatedAt: postData.updatedAt?.toDate() || new Date()
        } as BlogPost;
        
        // Get related posts (same category, excluding current post)
        const relatedQuery = await adminDb.collection('blog')
            .where('status', '==', 'published')
            .where('category', '==', post.category)
            .orderBy('publishedAt', 'desc')
            .limit(4)
            .get();
        
        const relatedPosts = relatedQuery.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                publishedAt: doc.data().publishedAt?.toDate() || null,
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }))
            .filter(relatedPost => relatedPost.id !== post.id)
            .slice(0, 3) as BlogPost[];
        
        console.log('✅ Successfully loaded blog post:', post.title);
        
        return {
            post,
            relatedPosts
        };
        
    } catch (err) {
        console.error('❌ Error fetching blog post:', err);
        
        if (err?.status === 404) {
            throw err;
        }
        
        throw error(500, 'Failed to load blog post');
    }
};
