<script lang="ts">
	// Reuse the real admin memorial detail page with a mocked memorial + streams.
	// This screen composes several admin editor sub-components; see Phase 6 notes
	// for any that perform their own network calls.
	import RealMemorialDetail from '../../../admin/services/memorials/[memorialId]/+page.svelte';
	import { adminMemorialDetail } from '../../_lib/mocks/memorials';
	import { memorialStreams } from '../../_lib/mocks/streams';

	const data: any = {
		memorial: adminMemorialDetail,
		streams: memorialStreams,
		slideshows: [],
		followerCount: 12
	};
</script>

<RealMemorialDetail {data} />
