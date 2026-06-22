<script lang="ts">
	// Reuse the real admin "memorial owners" data grid with mock users.
	import RealUsers from '../../../admin/users/memorial-owners/+page.svelte';
	import { adminUsers } from '../../_lib/mocks/users';

	const data: any = { users: adminUsers };
</script>

<RealUsers {data} />
