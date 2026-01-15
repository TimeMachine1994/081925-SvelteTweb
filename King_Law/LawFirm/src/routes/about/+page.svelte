<script lang="ts">
	import { faScaleBalanced, faGavel, faUsers, faAward } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>About Us - King Law Firm</title>
</svelte:head>

<section class="bg-gradient-to-br from-background via-secondary to-background py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<Icon icon={faScaleBalanced} size="2xl" class="text-gold mx-auto mb-4" />
			<h1 class="font-title text-5xl font-bold mb-4">About King Law Firm</h1>
			<p class="text-xl text-muted-foreground max-w-3xl mx-auto">
				Dedicated to Excellence in Legal Representation Since 2003
			</p>
		</div>
	</div>
</section>

<section class="py-16 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
			<div>
				<h2 class="font-title text-3xl font-bold mb-6">Our Story</h2>
				<p class="text-muted-foreground mb-4">
					Founded in 2003, King Law Firm has grown from a small practice to one of the most
					respected legal firms in the region. Our commitment to client satisfaction and legal
					excellence has remained unwavering throughout our journey.
				</p>
				<p class="text-muted-foreground mb-4">
					We believe that every client deserves personalized attention and aggressive
					representation. Our team of experienced attorneys brings decades of combined experience
					across multiple practice areas.
				</p>
			</div>
			<div class="bg-secondary p-8 rounded-lg">
				<h3 class="font-title text-2xl font-bold mb-6">Our Values</h3>
				<ul class="space-y-4">
					<li class="flex items-start space-x-3">
						<Icon icon={faGavel} class="text-gold mt-1" />
						<div>
							<div class="font-semibold mb-1">Integrity</div>
							<p class="text-sm text-muted-foreground">
								We maintain the highest ethical standards in all our dealings
							</p>
						</div>
					</li>
					<li class="flex items-start space-x-3">
						<Icon icon={faUsers} class="text-gold mt-1" />
						<div>
							<div class="font-semibold mb-1">Client Focus</div>
							<p class="text-sm text-muted-foreground">
								Your needs and goals drive everything we do
							</p>
						</div>
					</li>
					<li class="flex items-start space-x-3">
						<Icon icon={faAward} class="text-gold mt-1" />
						<div>
							<div class="font-semibold mb-1">Excellence</div>
							<p class="text-sm text-muted-foreground">
								We strive for outstanding results in every case
							</p>
						</div>
					</li>
				</ul>
			</div>
		</div>

		<div class="text-center bg-secondary p-12 rounded-lg">
			<blockquote class="font-quote text-3xl text-gold italic mb-4">
				"The good lawyer is not the man who has an eye to every side and angle of contingency,
				but who throws himself on your part so heartily that he can get you out of a scrape."
			</blockquote>
			<p class="text-muted-foreground">- Ralph Waldo Emerson</p>
		</div>
	</div>
</section>

<section class="py-16 bg-secondary">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="font-title text-3xl font-bold mb-8">Ready to Work With Us?</h2>
		<a
			href="/contact"
			class="inline-block px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
		>
			Schedule Your Free Consultation
		</a>
	</div>
</section>
