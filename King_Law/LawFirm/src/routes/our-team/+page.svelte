<script lang="ts">
	const teamMembers = [
		{
			name: 'Ben King',
			title: 'Founder & Lead Attorney',
			bio: 'Ben built King Law around a single premise: busy professionals deserve one attorney who coordinates their entire legal landscape. He serves as personal general counsel for Orlando\'s executives, physicians, and business leaders — managing employment matters, real estate, business entities, and disputes under one integrated strategy.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-Ben.jpg'
		},
		{
			name: 'CJ',
			title: 'Operations & Client Strategy',
			bio: 'CJ ensures every client engagement runs smoothly from intake through resolution. He coordinates timelines, manages documentation workflows, and keeps the operational infrastructure running so nothing falls through the cracks.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-CJ.jpg'
		},
		{
			name: 'Em',
			title: 'Client Relations & Legal Support',
			bio: 'Em is the first point of contact for many clients and manages the secure client portal experience. She ensures clear communication, timely updates, and a seamless interface between clients and their legal team.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-EM.jpg'
		},
	 
		{
			name: 'Austin',
			title: 'Research & Case Preparation',
			bio: 'Austin drives the research and preparation that underpins every matter. From case law analysis to evidence coordination, he builds the factual and legal foundation that supports strategic decision-making.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-Austin.jpg'
		},
		{
			name: 'Andrea',
			title: 'Administrative & Document Management',
			bio: 'Andrea manages the firm\'s document systems, filing workflows, and scheduling coordination. Her precision and reliability ensure that deadlines are met and records are maintained with the thoroughness our clients expect.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-Andrea.jpg'
		}
	];
</script>

<div class="min-h-screen pt-20">
	<!-- Hero Section -->
	<section class="py-24 bg-king-blue">
		<div class="max-w-5xl mx-auto px-6 lg:px-8 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">The People Behind King Law</p>
			<h1 class="font-title text-5xl md:text-6xl text-white leading-tight mb-6">
				Meet Our Team
			</h1>
			<p class="text-xl text-white/70 leading-relaxed max-w-3xl mx-auto">
				A focused team built for coordination, not volume. Digital-first efficiency with high-touch 
				access — you always know who's handling your matter and how to reach them.
			</p>
		</div>
	</section>

	<!-- Team Members - Alternating Layout -->
	<section class="py-16 bg-white dark:bg-background">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			{#each teamMembers as member, i}
				<div class="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center py-8 lg:py-16 {i !== teamMembers.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''}">
					<!-- Image -->
					<div class="{i % 2 === 1 ? 'lg:order-2' : ''}">
						<div class="relative">
							<div class="bg-white dark:bg-card rounded-2xl overflow-hidden depth-card">
								{#if member.image}
									<img src={member.image} alt={member.name} class="aspect-[4/5] w-full object-cover" />
								{:else}
									<div class="aspect-[4/5] bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center">
										<div class="text-center">
											<div class="w-24 h-24 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
												<span class="text-5xl text-gray-500">👤</span>
											</div>
											<p class="text-gray-500 text-sm">Photo Coming Soon</p>
										</div>
									</div>
								{/if}
							</div>
							<!-- Decorative element -->
							<div class="absolute -bottom-3 {i % 2 === 1 ? '-left-3' : '-right-3'} w-20 h-20 bg-gold rounded-xl -z-10 hidden sm:block"></div>
						</div>
					</div>

					<!-- Content -->
					<div class="{i % 2 === 1 ? 'lg:order-1' : ''}">
						<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">{member.title}</p>
						<h2 class="font-title text-4xl text-king-blue dark:text-white mb-6">{member.name}</h2>
						<p class="text-gray-500 dark:text-white/60 text-lg leading-relaxed">
							{member.bio}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-24 bg-king-blue">
		<div class="max-w-3xl mx-auto px-6 lg:px-8 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Ready to Get Started?</p>
			<h2 class="font-title text-4xl text-white mb-6">Start With a Conversation</h2>
			<p class="text-white/60 text-lg mb-10">
				Tell us what's on your plate. We'll outline how coordinated counsel can simplify your legal landscape.
			</p>
			<a href="/schedule" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold transition-all depth-gold">
				Schedule a Consultation
			</a>
		</div>
	</section>
</div>
