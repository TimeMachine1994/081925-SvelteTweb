<script lang="ts">
	import ServicePageTemplate from '$lib/components/ServicePageTemplate.svelte';
	import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

	const whatWeHandle = [
		'DUI and traffic violations',
		'Drug offenses',
		'Theft and property crimes',
		'Assault and violent crimes',
		'White collar crimes',
		'Domestic violence charges',
		'Juvenile defense',
		'Expungement and record sealing'
	];

	const whyChooseUs = [
		'Aggressive courtroom representation',
		'Thorough investigation of charges',
		'Protection of constitutional rights',
		'Experience with complex criminal cases',
		'Available for immediate arrest response'
	];
</script>

<ServicePageTemplate
	title="Criminal Defense"
	icon={faShieldHalved}
	description="Facing criminal charges? Protect your rights and freedom with experienced defense counsel. We provide aggressive representation at every stage of the legal process."
	{whatWeHandle}
	{whyChooseUs}
/>
