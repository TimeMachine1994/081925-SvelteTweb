<script lang="ts">
	// Showcase wrapper: reuse the real admin Blog (CMS) list with mock posts.
	import Real from '../../../admin/content/blog/+page.svelte';
	import showcaseData from '../../_lib/showcase-data.json';

	const posts = showcaseData.blogPosts;
	const data: any = {
		posts,
		stats: {
			published: posts.filter((p) => p.status === 'published').length,
			draft: posts.filter((p) => p.status === 'draft').length,
			scheduled: 0,
			featured: 0
		}
	};
</script>

<Real {data} />
