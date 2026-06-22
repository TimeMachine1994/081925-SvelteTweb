<script lang="ts">
	// Showcase wrapper: reuse the real Funeral Director dashboard with mock data.
	import Real from '../../../funeral-director/dashboard/+page.svelte';
	import showcaseData from '../../_lib/showcase-data.json';

	const fd = showcaseData.fdDashboard;
	const data: any = {
		funeralDirector: {
			companyName: fd.funeralHomeName,
			contactPerson: 'Pat Donnelly',
			email: 'pat@evergreenfh.com',
			phone: '(407) 555-0199',
			address: { street: '200 Chapel Road', city: 'Orlando', state: 'FL', zipCode: '32801' }
		},
		memorials: fd.memorials.map((m) => ({ ...m, streams: [] }))
	};
</script>

<Real {data} />
