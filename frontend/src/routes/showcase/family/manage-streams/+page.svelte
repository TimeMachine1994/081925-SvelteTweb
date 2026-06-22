<script lang="ts">
	// Showcase wrapper: reuse the real Manage Streams page with mock data.
	import Real from '../../../memorials/[id]/manage-streams/+page.svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
	import { memorialStreams } from '../../_lib/mocks/streams';

	const data: any = { memorial: heroMemorial, streams: memorialStreams, canManage: true };
</script>

<Real {data} />
