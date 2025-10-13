<script lang="ts">
	import RegisterMinimalModern from '$lib/components/RegisterMinimalModern.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<RegisterMinimalModern {form} />
