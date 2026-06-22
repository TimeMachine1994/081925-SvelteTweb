<script lang="ts">
	// Showcase wrapper: reuse the real Tribute page with a mock memorial.
	import Real from '../../../tributes/[fullSlug]/+page.svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
	import { familyPersona } from '../../_lib/personas';

	const data: any = {
		memorial: heroMemorial,
		user: familyPersona,
		isOwner: true,
		isFollowing: false
	};
</script>

<Real {data} />
