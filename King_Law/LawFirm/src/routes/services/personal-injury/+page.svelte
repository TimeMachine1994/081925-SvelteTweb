<script lang="ts">
	import ServicePageTemplate from '$lib/components/ServicePageTemplate.svelte';
	import { faGavel } from '@fortawesome/free-solid-svg-icons';

	const whatWeHandle = [
		'Car, truck, and motorcycle accidents',
		'Slip and fall injuries',
		'Medical malpractice',
		'Product liability',
		'Workplace injuries',
		'Wrongful death cases',
		'Dog bites and animal attacks',
		'Catastrophic injuries'
	];

	const whyChooseUs = [
		'No fees unless we win your case',
		'Aggressive negotiation with insurance companies',
		'Proven track record of substantial settlements',
		'Compassionate, personalized representation',
		'Available 24/7 for emergencies'
	];
</script>

<ServicePageTemplate
	title="Personal Injury & Civil Suits"
	icon={faGavel}
	description="When you've been injured due to someone else's negligence, you deserve justice. Our experienced personal injury attorneys fight tirelessly to secure the compensation you need."
	{whatWeHandle}
	{whyChooseUs}
/>
