<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { homepageState, homepageActions } from '$lib/stores/homepage';
	import {
		HeroSection,
		TrustBadgesSection,
		TestimonialsSection,
		HowItWorksSection,
		ProductProofSection,
		PackagesSection,
		RegionalTrustSection,
		FAQSection
	} from '$lib/components/homepage';
	
	// Import data
	import {
		trustBadges,
		testimonials,
		partnerFuneralHomes,
		familySteps,
		directorSteps,
		sampleTimeline,
		productFeatures,
		packages,
		regionalFeatures,
		faqItems
	} from './homepage-data';

	const theme = getTheme('minimal');

	// Navigation functions
	function handleCreateTribute(name: string) {
		console.log('🎯 Creating tribute for:', name);
		const params = new URLSearchParams();
		if (name.trim()) {
			params.set('name', name.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearchTributes(query: string) {
		console.log('🔍 Searching tributes for:', query);
		if (query.trim()) {
			goto(`/search?q=${encodeURIComponent(query.trim())}`);
		}
	}

	function handleBookDemo() {
		console.log('📞 Booking demo');
		goto('/book-demo');
	}

	function handleHowItWorks() {
		console.log('📋 Scrolling to how it works');
		document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
	}

	function handlePackageSelection(packageName: string) {
		console.log('📦 Package selected:', packageName);
		const params = new URLSearchParams();
		params.set('package', packageName.toLowerCase());
		if ($homepageState.lovedOneName.trim()) {
			params.set('name', $homepageState.lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleContactClick() {
		goto('/contact');
	}
</script>

<svelte:head>
	<title>Beautiful, reliable memorial livestreams - Tributestream</title>
	<meta name="description" content="Custom links. On-site technicians. Heirloom recordings. Professional memorial livestreaming for families and funeral directors." />
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<HeroSection
		lovedOneName={$homepageState.lovedOneName}
		searchQuery={$homepageState.searchQuery}
		onCreateTribute={handleCreateTribute}
		onSearchTributes={handleSearchTributes}
		onBookDemo={handleBookDemo}
		onHowItWorks={handleHowItWorks}
		onLovedOneNameChange={homepageActions.updateLovedOneName}
		onSearchQueryChange={homepageActions.updateSearchQuery}
	/>
	
	<TrustBadgesSection badges={trustBadges} />
	
	<TestimonialsSection 
		testimonials={testimonials}
		partnerFuneralHomes={partnerFuneralHomes}
	/>
	
	<HowItWorksSection
		familySteps={familySteps}
		directorSteps={directorSteps}
		sampleTimeline={sampleTimeline}
		activeTab={$homepageState.activeTab}
		currentStep={$homepageState.currentStep}
		onTabChange={homepageActions.setActiveTab}
		onStepChange={homepageActions.setCurrentStep}
	/>
	
	<ProductProofSection
		videoSrc="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_-_about_us%20(1080p).mp4?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a"
		posterSrc="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/video-posters%2Ftributestream-demo-poster.jpg?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a"
		features={productFeatures}
	/>
	
	<PackagesSection 
		packages={packages}
		onPackageSelection={handlePackageSelection}
	/>
	
	<RegionalTrustSection
		phoneNumber="407-221-5922"
		serviceAreas={["Orange", "Seminole", "Lake", "Volusia"]}
		features={regionalFeatures}
	/>
	
	<FAQSection 
		faqItems={faqItems}
		onContactClick={handleContactClick}
	/>
</div>
