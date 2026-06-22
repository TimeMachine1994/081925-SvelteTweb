<script lang="ts">
	// Reuse the real Login component. Submitting the form is intercepted by the
	// showcase layout (no Firebase call) and advances to the profile screen.
	import Login from '$lib/components/Login.svelte';
</script>

<Login />
