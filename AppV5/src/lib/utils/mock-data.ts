import type { RootJourney, FileProfile, POTJ } from '$lib/types/journey';

export function createMockJourneys(): RootJourney[] {
	return [
		{
			id: 'guest',
			name: 'Guest',
			sections: {
				beginning: {
					type: 'beginning',
					items: [
						{
							id: 'guest-b-1',
							title: 'Landing Page',
							description: 'Initial entry point for unauthenticated users. Showcases features and value proposition.',
							section: 'beginning',
							fileRef: '/routes/+page.svelte',
							tags: ['ui', 'marketing'],
							notes: ['Focus on clear CTA', 'Mobile-first design'],
							chatHistory: []
						},
						{
							id: 'guest-b-2',
							title: 'Browse Public Content',
							description: 'Allow guests to explore available content without signing up.',
							section: 'beginning',
							fileRef: '/routes/browse/+page.svelte',
							tags: ['discovery', 'ui'],
							notes: [],
							chatHistory: []
						}
					]
				},
				middle: {
					type: 'middle',
					items: [
						{
							id: 'guest-m-1',
							title: 'Sign Up Flow',
							description: 'User registration process with email verification.',
							section: 'middle',
							fileRef: '/routes/auth/signup/+page.svelte',
							tags: ['authentication', 'forms'],
							notes: ['Add social login options', 'Validate email in real-time'],
							chatHistory: []
						},
						{
							id: 'guest-m-2',
							title: 'Onboarding',
							description: 'Welcome flow to help new users understand the platform.',
							section: 'middle',
							fileRef: '/routes/onboarding/+page.svelte',
							tags: ['ux', 'tutorial'],
							notes: [],
							chatHistory: []
						}
					]
				},
				end: {
					type: 'end',
					items: [
						{
							id: 'guest-e-1',
							title: 'First Dashboard View',
							description: 'Newly registered user sees their personalized dashboard.',
							section: 'end',
							fileRef: '/routes/dashboard/+page.svelte',
							tags: ['dashboard', 'personalization'],
							notes: [],
							chatHistory: []
						}
					]
				}
			}
		},
		{
			id: 'admin',
			name: 'Admin',
			sections: {
				beginning: {
					type: 'beginning',
					items: [
						{
							id: 'admin-b-1',
							title: 'Admin Login',
							description: 'Secure authentication for administrative access.',
							section: 'beginning',
							fileRef: '/routes/admin/login/+page.svelte',
							tags: ['authentication', 'security'],
							notes: ['Implement 2FA', 'Add rate limiting'],
							chatHistory: []
						}
					]
				},
				middle: {
					type: 'middle',
					items: [
						{
							id: 'admin-m-1',
							title: 'User Management',
							description: 'View, edit, and manage platform users.',
							section: 'middle',
							fileRef: '/routes/admin/users/+page.svelte',
							tags: ['crud', 'management'],
							notes: [],
							chatHistory: []
						},
						{
							id: 'admin-m-2',
							title: 'Content Moderation',
							description: 'Review and moderate user-generated content.',
							section: 'middle',
							fileRef: '/routes/admin/content/+page.svelte',
							tags: ['moderation', 'safety'],
							notes: [],
							chatHistory: []
						}
					]
				},
				end: {
					type: 'end',
					items: [
						{
							id: 'admin-e-1',
							title: 'Analytics Dashboard',
							description: 'Platform metrics and insights visualization.',
							section: 'end',
							fileRef: '/routes/admin/analytics/+page.svelte',
							tags: ['analytics', 'reporting'],
							notes: [],
							chatHistory: []
						}
					]
				}
			}
		},
		{
			id: 'creator',
			name: 'Creator',
			sections: {
				beginning: {
					type: 'beginning',
					items: [
						{
							id: 'creator-b-1',
							title: 'Creator Dashboard',
							description: 'Central hub for content creators to manage their work.',
							section: 'beginning',
							fileRef: '/routes/creator/+page.svelte',
							tags: ['dashboard', 'creator-tools'],
							notes: [],
							chatHistory: []
						}
					]
				},
				middle: {
					type: 'middle',
					items: [
						{
							id: 'creator-m-1',
							title: 'Content Editor',
							description: 'Rich text editor for creating and editing content.',
							section: 'middle',
							fileRef: '/routes/creator/edit/+page.svelte',
							tags: ['editor', 'content-creation'],
							notes: ['Add auto-save', 'Support markdown'],
							chatHistory: []
						},
						{
							id: 'creator-m-2',
							title: 'Media Library',
							description: 'Upload and manage images, videos, and other assets.',
							section: 'middle',
							fileRef: '/routes/creator/media/+page.svelte',
							tags: ['media', 'uploads'],
							notes: [],
							chatHistory: []
						}
					]
				},
				end: {
					type: 'end',
					items: [
						{
							id: 'creator-e-1',
							title: 'Publish & Share',
							description: 'Finalize and publish content to the platform.',
							section: 'end',
							fileRef: '/routes/creator/publish/+page.svelte',
							tags: ['publishing', 'distribution'],
							notes: [],
							chatHistory: []
						}
					]
				}
			}
		}
	];
}

export function createMockFiles(): FileProfile[] {
	return [
		{
			id: 'f-1',
			path: '/routes/+page.svelte',
			title: 'Landing Page',
			description: 'Main landing page component with hero section and feature highlights.',
			tags: ['ui', 'svelte', 'landing'],
			metadata: {
				level: 3,
				journey: 'guest',
				tags: ['ui', 'marketing']
			},
			codeSnippets: [
				{
					id: 'cs-1',
					language: 'svelte',
					code: `<script lang="ts">
  let features = [
    { icon: '🎯', title: 'Feature 1' },
    { icon: '⚡', title: 'Feature 2' },
  ];
</script>`,
					lineStart: 1,
					lineEnd: 6
				}
			],
			relatedPOTJs: ['guest-b-1'],
			notes: ['Optimize for mobile', 'A/B test CTA buttons'],
			chatHistory: []
		},
		{
			id: 'f-2',
			path: '/routes/auth/signup/+page.svelte',
			title: 'Signup Page',
			description: 'User registration form with validation and error handling.',
			tags: ['auth', 'forms', 'svelte'],
			metadata: {
				level: 3,
				journey: 'guest',
				tags: ['authentication', 'forms']
			},
			codeSnippets: [],
			relatedPOTJs: ['guest-m-1'],
			notes: [],
			chatHistory: []
		},
		{
			id: 'f-3',
			path: '/routes/admin/users/+page.svelte',
			title: 'User Management',
			description: 'Admin interface for managing platform users.',
			tags: ['admin', 'crud', 'svelte'],
			metadata: {
				level: 3,
				journey: 'admin',
				tags: ['crud', 'management']
			},
			codeSnippets: [],
			relatedPOTJs: ['admin-m-1'],
			notes: [],
			chatHistory: []
		},
		{
			id: 'f-4',
			path: '/routes/creator/edit/+page.svelte',
			title: 'Content Editor',
			description: 'Rich text editor component for content creation.',
			tags: ['creator', 'editor', 'svelte'],
			metadata: {
				level: 3,
				journey: 'creator',
				tags: ['editor', 'content-creation']
			},
			codeSnippets: [],
			relatedPOTJs: ['creator-m-1'],
			notes: [],
			chatHistory: []
		},
		{
			id: 'f-5',
			path: '/lib/utils/formatDate.ts',
			title: 'Date Formatter',
			description: 'Utility function for formatting dates consistently across the app.',
			tags: ['utility', 'helpers', 'typescript'],
			metadata: {
				level: 4,
				tags: ['utility']
			},
			codeSnippets: [
				{
					id: 'cs-2',
					language: 'typescript',
					code: `export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}`,
					lineStart: 1,
					lineEnd: 7
				}
			],
			relatedPOTJs: [],
			notes: [],
			chatHistory: []
		}
	];
}
