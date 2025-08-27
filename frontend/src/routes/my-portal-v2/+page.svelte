<script lang="ts">
	import type { PageData } from './$types';
    import OwnerPortalV2 from '$lib/components/portals/OwnerPortalV2.svelte';

    export let data: PageData;
</script>

<div class="TODO: replace-with-theme-class">
	<div class="flex justify-between items-center">
		<h1 class="TODO: replace-with-theme-class">My Portal</h1>
		<form action="/logout" method="POST">
			<button type="submit" class="btn btn-sm btn-outline-primary">Logout</button>
		</form>
	</div>
    <p class="TODO: replace-with-theme-class">Welcome, {data.user?.displayName}!</p>

    <OwnerPortalV2 memorials={data.memorials} />
</div>