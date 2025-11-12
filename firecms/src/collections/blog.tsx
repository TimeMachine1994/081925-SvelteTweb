// firecms/src/collections/blog.tsx

import { buildCollection, buildProperty } from "@firecms/core";
import { BlogPost } from "../types/blog";

console.log("🏗️ Initializing Blog Collection Schema");

/**
 * Schema definition for the 'blog' collection in Firestore.
 * Comprehensive blog management for Tributestream content marketing.
 */
export const blogCollection = buildCollection<BlogPost>({
    id: "blog",
    name: "Blog Posts",
    path: "blog",
    description: "Blog posts and articles for Tributestream content marketing",
    permissions: ({ authController }) => {
        // Check multiple ways to determine admin status
        const isAdmin = authController.extra?.admin || 
                       (authController as any).isAdmin || 
                       authController.user?.email?.includes("austinbryanfilm@gmail.com") ||
                       authController.user?.email?.includes("@tributestream.com") ||
                       authController.user?.email?.includes("@firecms.co") ||
                       false;
        
        // Only log occasionally to reduce spam
        if (Math.random() < 0.01) { // Log ~1% of permission checks
            console.log("📝 Blog Collection Permissions Check:", {
                authControllerExists: !!authController,
                extraExists: !!authController.extra,
                adminFlag: authController.extra?.admin,
                directAdminFlag: (authController as any).isAdmin,
                emailCheck: authController.user?.email,
                finalIsAdmin: isAdmin,
                timestamp: new Date().toISOString()
            });
        }
        
        return {
            // Full CRUD access for admin users
            read: isAdmin,
            edit: isAdmin,
            create: isAdmin,
            delete: isAdmin,
        };
    },
    properties: {
        // === CORE BLOG INFORMATION ===
        id: buildProperty({
            dataType: "string",
            name: "Post ID",
            readOnly: true,
            description: "Unique identifier for the blog post"
        }),
        title: buildProperty({
            dataType: "string",
            name: "Post Title",
            validation: { required: true },
            description: "Title of the blog post"
        }),
        slug: buildProperty({
            dataType: "string",
            name: "URL Slug",
            validation: { required: true },
            description: "URL-friendly version of the title"
        }),
        excerpt: buildProperty({
            dataType: "string",
            name: "Excerpt",
            multiline: true,
            validation: { required: true },
            description: "Brief summary of the blog post (150-200 characters)"
        }),
        content: buildProperty({
            dataType: "string",
            name: "Post Content",
            markdown: true,
            validation: { required: true },
            description: "Full content of the blog post in Markdown format"
        }),
        
        // === AUTHOR INFORMATION ===
        authorName: buildProperty({
            dataType: "string",
            name: "Author Name",
            validation: { required: true },
            description: "Name of the blog post author"
        }),
        authorEmail: buildProperty({
            dataType: "string",
            name: "Author Email",
            validation: { required: true },
            description: "Email address of the author"
        }),
        authorBio: buildProperty({
            dataType: "string",
            name: "Author Bio",
            multiline: true,
            description: "Brief biography of the author"
        }),
        authorAvatar: buildProperty({
            dataType: "string",
            name: "Author Avatar",
            storage: {
                storagePath: "blog-authors",
                acceptedFiles: ["image/*"],
                maxSize: 1024 * 1024 * 2 // 2 MB
            },
            description: "Author profile picture"
        }),
        
        // === FEATURED IMAGE ===
        featuredImage: buildProperty({
            dataType: "string",
            name: "Featured Image",
            storage: {
                storagePath: "blog-featured",
                acceptedFiles: ["image/*"],
                maxSize: 1024 * 1024 * 5 // 5 MB
            },
            description: "Main featured image for the blog post"
        }),
        featuredImageAlt: buildProperty({
            dataType: "string",
            name: "Featured Image Alt Text",
            description: "Alt text for the featured image (accessibility)"
        }),
        
        // === CATEGORIZATION ===
        category: buildProperty({
            dataType: "string",
            name: "Category",
            enumValues: [
                { id: "memorial-planning", label: "Memorial Planning" },
                { id: "grief-support", label: "Grief Support" },
                { id: "technology", label: "Technology" },
                { id: "funeral-industry", label: "Funeral Industry" },
                { id: "livestreaming", label: "Livestreaming" },
                { id: "company-news", label: "Company News" },
                { id: "customer-stories", label: "Customer Stories" }
            ],
            validation: { required: true },
            description: "Primary category for the blog post"
        }),
        tags: buildProperty({
            dataType: "array",
            name: "Tags",
            of: {
                dataType: "string"
            },
            description: "Tags for better content organization and SEO"
        }),
        
        // === PUBLISHING CONTROLS ===
        status: buildProperty({
            dataType: "string",
            name: "Publication Status",
            enumValues: [
                { id: "draft", label: "Draft" },
                { id: "published", label: "Published" },
                { id: "scheduled", label: "Scheduled" },
                { id: "archived", label: "Archived" }
            ],
            defaultValue: "draft",
            validation: { required: true },
            description: "Current publication status"
        }),
        publishedAt: buildProperty({
            dataType: "date",
            name: "Published Date",
            description: "Date and time when the post was/will be published"
        }),
        featured: buildProperty({
            dataType: "boolean",
            name: "Featured Post",
            defaultValue: false,
            description: "Mark as featured post for homepage display"
        }),
        
        // === SEO FIELDS ===
        metaTitle: buildProperty({
            dataType: "string",
            name: "Meta Title",
            description: "SEO title (60 characters max)"
        }),
        metaDescription: buildProperty({
            dataType: "string",
            name: "Meta Description",
            multiline: true,
            description: "SEO meta description (160 characters max)"
        }),
        keywords: buildProperty({
            dataType: "array",
            name: "SEO Keywords",
            of: {
                dataType: "string"
            },
            description: "SEO keywords for search optimization"
        }),
        
        // === ENGAGEMENT METRICS ===
        viewCount: buildProperty({
            dataType: "number",
            name: "View Count",
            defaultValue: 0,
            description: "Number of times the post has been viewed"
        }),
        readingTime: buildProperty({
            dataType: "number",
            name: "Reading Time (minutes)",
            description: "Estimated reading time in minutes"
        }),
        
        // === TIMESTAMPS ===
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        }),
        updatedAt: buildProperty({
            dataType: "date",
            name: "Updated At",
            autoValue: "on_update",
            readOnly: true
        })
    },
    
    // Collection-level configuration
    defaultSize: "m"
});

console.log("✅ Blog Collection Schema initialized successfully");
