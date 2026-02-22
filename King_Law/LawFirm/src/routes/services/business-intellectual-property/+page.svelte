<script lang="ts">
	import ServicePageTemplate from '$lib/components/ServicePageTemplate.svelte';
	import { faHandshake } from '@fortawesome/free-solid-svg-icons';

	const whatWeHandle = [
		'Business formation and structuring',
		'Contract drafting and negotiation',
		'Trademark and copyright registration',
		'Patent applications and protection',
		'Trade secret protection',
		'Business disputes and litigation',
		'Partnership agreements',
		'Mergers and acquisitions'
	];

	const whyChooseUs = [
		'Deep understanding of business law',
		'Proactive protection of intellectual assets',
		'Experience with startups and established businesses',
		'Strategic legal counsel for growth',
		'Cost-effective legal solutions'
	];
</script>

<ServicePageTemplate
	title="Business & Intellectual Property"
	icon={faHandshake}
	description="Protect your business interests and intellectual assets with comprehensive legal counsel. We help businesses navigate complex legal landscapes with confidence."
	{whatWeHandle}
	{whyChooseUs}
/>
