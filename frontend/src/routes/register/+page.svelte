<script lang="ts">
	import Register from '$lib/components/Register.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<Register {form} />