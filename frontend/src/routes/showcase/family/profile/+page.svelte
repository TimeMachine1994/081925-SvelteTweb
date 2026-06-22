<script lang="ts">
	// Reuse the real Profile component with mocked owner data.
	import Profile from '$lib/components/Profile.svelte';
	import { familyPersona } from '../../_lib/personas';
	import { ownerMemorials } from '../../_lib/mocks/memorials';

	const data = {
		profile: {
			email: familyPersona.email,
			displayName: familyPersona.displayName,
			hasPaidForMemorial: true,
			memorialCount: ownerMemorials.length
		},
		user: { role: familyPersona.role, uid: familyPersona.uid },
		funeralDirector: null,
		memorials: ownerMemorials
	};
</script>

<Profile {data} form={undefined} />
