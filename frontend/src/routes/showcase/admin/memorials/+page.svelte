<script lang="ts">
	// Reuse the real admin memorials data grid with mock memorials.
	import RealMemorials from '../../../admin/services/memorials/+page.svelte';
	import { adminMemorials } from '../../_lib/mocks/memorials';

	const data: any = { memorials: adminMemorials, searchQuery: '' };
</script>

<RealMemorials {data} />
