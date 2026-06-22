<script lang="ts">
	// Reuse the real schedule/calculator markup with a mocked memorial. Tier and
	// add-on pricing is computed client-side from $lib/config/pricing, so the
	// interactive calculator works without a backend.
	import RealSchedule from '../../../schedule/+page.svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';

	const data: any = { memorial: heroMemorial };
</script>

<RealSchedule {data} />
