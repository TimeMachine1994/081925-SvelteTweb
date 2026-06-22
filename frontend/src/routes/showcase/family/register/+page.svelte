<script lang="ts">
	// Reuse the real "create a memorial" registration markup. The form submit
	// is intercepted by the showcase layout and advances to the login screen
	// instead of POSTing / running reCAPTCHA.
	import RealRegister from '../../../register/loved-one/+page.svelte';
</script>

<RealRegister />
