<script lang="ts">
	// Showcase wrapper: reuse the real admin User Detail page with a mock user.
	import Real from '../../../admin/users/memorial-owners/[userId]/+page.svelte';
	import { ownerMemorials } from '../../_lib/mocks/memorials';

	const data: any = {
		user: {
			uid: 'demo-family-owner',
			email: 'family@example.com',
			displayName: 'Jordan Rivera',
			role: 'owner',
			suspended: false,
			hasPaidForMemorial: true,
			phone: '(407) 555-0142',
			createdAt: '2026-04-15T10:00:00.000Z',
			lastLoginAt: '2026-05-01T08:12:00.000Z'
		},
		funeralDirector: null,
		stats: {
			memorialCount: 1,
			streamCount: 1,
			slideshowCount: 0,
			chatMessageCount: 12,
			invitationCount: 3,
			scheduleRequestCount: 1,
			followedMemorialsCount: 2
		},
		memorials: ownerMemorials,
		streams: [],
		slideshows: [],
		scheduleRequests: [],
		adminActions: []
	};
</script>

<Real {data} />
