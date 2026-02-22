<script lang="ts">
	import { faScaleBalanced, faPhone, faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons';
	import Icon from './Icon.svelte';
</script>

<footer class="bg-secondary border border-gray-300 dark:border-gray-700 mt-auto">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Logo and Description -->
			<div>
				<div class="flex items-center space-x-3 mb-4">
					<Icon icon={faScaleBalanced} size="lg" class="text-gold" />
					<span class="font-title text-2xl font-bold">King Law</span>
				</div>
				<p class="text-muted-foreground">
					Professional legal services with a commitment to excellence and client satisfaction.
				</p>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="font-title text-lg font-semibold mb-4">Quick Links</h3>
				<ul class="space-y-2">
					<li><a href="/about" class="text-muted-foreground hover:text-gold transition-colors">About Us</a></li>
					<li><a href="/services/personal-injury" class="text-muted-foreground hover:text-gold transition-colors">Personal Injury</a></li>
					<li><a href="/services/business-intellectual-property" class="text-muted-foreground hover:text-gold transition-colors">Business Law</a></li>
					<li><a href="/services/family-estate-law" class="text-muted-foreground hover:text-gold transition-colors">Family Law</a></li>
					<li><a href="/contact" class="text-muted-foreground hover:text-gold transition-colors">Contact</a></li>
				</ul>
			</div>

			<!-- Contact Info -->
			<div>
				<h3 class="font-title text-lg font-semibold mb-4">Contact Us</h3>
				<ul class="space-y-3">
					<li class="flex items-start space-x-3">
						<Icon icon={faLocationDot} class="text-gold mt-1" />
						<span class="text-muted-foreground">123 Legal Street<br />City, State 12345</span>
					</li>
					<li class="flex items-center space-x-3">
						<Icon icon={faPhone} class="text-gold" />
						<a href="tel:555-0100" class="text-muted-foreground hover:text-gold transition-colors">
							(555) 010-0100
						</a>
					</li>
					<li class="flex items-center space-x-3">
						<Icon icon={faEnvelope} class="text-gold" />
						<a href="mailto:info@kinglaw.com" class="text-muted-foreground hover:text-gold transition-colors">
							info@kinglaw.com
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="border border-gray-300 dark:border-gray-700 mt-8 pt-8 text-center text-muted-foreground">
			<p>&copy; {new Date().getFullYear()} King Law Firm. All rights reserved.</p>
		</div>
	</div>
</footer>
