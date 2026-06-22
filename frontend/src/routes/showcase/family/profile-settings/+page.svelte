<script lang="ts">
	// Showcase wrapper: reuse the real Profile Settings page with a mock profile.
	import Real from '../../../profile/settings/+page.svelte';
	import { familyPersona } from '../../_lib/personas';

	const data: any = {
		user: familyPersona,
		profile: {
			displayName: 'Jordan Rivera',
			name: 'Jordan Rivera',
			email: 'family@example.com',
			phone: '(407) 555-0142',
			address: { street: '482 Magnolia Street', city: 'Orlando', state: 'FL', zip: '32801' }
		}
	};
</script>

<Real {data} />
