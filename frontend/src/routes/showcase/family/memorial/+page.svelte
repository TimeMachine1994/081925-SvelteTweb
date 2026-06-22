<script lang="ts">
	// Reuse the real public memorial page with a mocked memorial + streams.
	import RealMemorial from '../../../[fullSlug]/+page.svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';
	import { memorialStreams } from '../../_lib/mocks/streams';
	import { familyPersona } from '../../_lib/personas';

	const data: any = {
		memorial: heroMemorial,
		streams: memorialStreams,
		slideshows: [],
		user: { uid: familyPersona.uid, role: familyPersona.role, email: familyPersona.email }
	};
</script>

<RealMemorial {data} />
