<script lang="ts">
	import ServicePageTemplate from '$lib/components/ServicePageTemplate.svelte';
	import { faUsers } from '@fortawesome/free-solid-svg-icons';

	const whatWeHandle = [
		'Divorce and legal separation',
		'Child custody and visitation',
		'Child and spousal support',
		'Estate planning and wills',
		'Trust administration',
		'Probate proceedings',
		'Adoption services',
		'Prenuptial agreements'
	];

	const whyChooseUs = [
		'Compassionate approach to sensitive matters',
		'Focus on amicable resolutions',
		'Experienced in complex custody cases',
		'Comprehensive estate planning services',
		'Personalized attention to family needs'
	];
</script>

<ServicePageTemplate
	title="Family & Estate Law"
	icon={faUsers}
	description="Navigate life's transitions with compassionate legal guidance. We provide thoughtful counsel during challenging family and estate matters."
	{whatWeHandle}
	{whyChooseUs}
/>
