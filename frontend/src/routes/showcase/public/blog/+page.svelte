<script lang="ts">
	// Showcase wrapper: reuse the real Blog listing with mock posts.
	import Real from '../../../blog/+page.svelte';
	import showcaseData from '../../_lib/showcase-data.json';

	const posts = showcaseData.blogPosts.map((p) => ({
		...p,
		category: 'memorial-planning',
		readTime: 4,
		featuredImage: p.coverImage,
		date: p.publishedAt
	}));

	const data: any = {
		user: null,
		featuredPosts: posts.slice(0, 1),
		latestPosts: posts,
		categoryCounts: { 'memorial-planning': posts.length },
		totalPosts: posts.length,
		error: null,
		usingMockData: true
	};
</script>

<Real {data} />
