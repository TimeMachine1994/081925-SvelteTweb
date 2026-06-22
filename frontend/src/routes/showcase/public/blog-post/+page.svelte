<script lang="ts">
	// Showcase wrapper: reuse the real Blog post page with a mock post.
	import Real from '../../../blog/[slug]/+page.svelte';
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
		post: posts[0],
		relatedPosts: posts.slice(1)
	};
</script>

<Real {data} />
