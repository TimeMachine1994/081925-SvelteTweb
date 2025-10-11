<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<Login {form} />
