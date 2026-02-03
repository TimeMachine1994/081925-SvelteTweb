<script lang="ts">
	const teamMembers = [
		{
			name: 'Ben King',
			title: 'Founder & Lead Attorney',
			bio: 'Ben founded King Law with a clear mission: to provide exceptional legal representation to those who need it most. With a passion for justice and a commitment to every client, Ben leads the firm with integrity and dedication.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-Ben.jpg'
		},
		{
			name: 'CJ',
			title: 'Team Member',
			bio: 'CJ brings dedication and expertise to every case, ensuring clients receive the attention and support they deserve throughout their legal journey.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-CJ.jpg'
		},
		{
			name: 'Em',
			title: 'Team Member',
			bio: 'Em is committed to providing compassionate and thorough legal support, helping clients navigate complex situations with clarity and confidence.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-EM.jpg'
		},
		{
			name: 'Jessica',
			title: 'Team Member',
			bio: 'Jessica combines attention to detail with a client-first approach, ensuring every aspect of a case is handled with professionalism and care.',
			image: null
		},
		{
			name: 'Austin',
			title: 'Team Member',
			bio: 'Austin brings energy and dedication to the team, working tirelessly to support clients and contribute to successful case outcomes.',
			image: 'https://kinglawbucket.s3.us-east-2.amazonaws.com/public/020226-Photos-Headshots/020226-Shoot-Austin.jpg'
		},
		{
			name: 'Andrea',
			title: 'Team Member',
			bio: 'Andrea is passionate about helping clients through challenging times, providing reliable support and clear communication every step of the way.',
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
				Dedicated professionals committed to fighting for your rights. When you work with King Law, 
				you get a team that truly cares about your outcome.
			</p>
		</div>
	</section>

	<!-- Team Members - Alternating Layout -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			{#each teamMembers as member, i}
				<div class="grid lg:grid-cols-2 gap-12 items-center py-16 {i !== teamMembers.length - 1 ? 'border-b border-gray-100' : ''}">
					<!-- Image -->
					<div class="{i % 2 === 1 ? 'lg:order-2' : ''}">
						<div class="relative">
							<div class="bg-white rounded-2xl overflow-hidden shadow-xl">
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
							<div class="absolute -bottom-3 {i % 2 === 1 ? '-left-3' : '-right-3'} w-20 h-20 bg-gold rounded-xl -z-10"></div>
						</div>
					</div>

					<!-- Content -->
					<div class="{i % 2 === 1 ? 'lg:order-1' : ''}">
						<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">{member.title}</p>
						<h2 class="font-title text-4xl text-king-blue mb-6">{member.name}</h2>
						<p class="text-gray-500 text-lg leading-relaxed">
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
			<h2 class="font-title text-4xl text-white mb-6">Work With Our Team</h2>
			<p class="text-white/60 text-lg mb-10">
				Schedule your free consultation today. We're here to listen, advise, and fight for you.
			</p>
			<a href="/contact" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold transition-all hover:shadow-xl">
				Contact Us Today
			</a>
		</div>
	</section>
</div>
