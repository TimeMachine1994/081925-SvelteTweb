<script lang="ts">
	import { user } from '$lib/auth';
</script>

<div class="min-h-screen bg-gray-100">
	<div class="container mx-auto px-4 py-16">
		<header class="text-center mb-12">
			<h1 class="text-5xl font-extrabold text-gray-900 leading-tight">
				Simple, Transparent Pricing
			</h1>
			<p class="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
				Choose the perfect way to honor your loved one. All packages include a dedicated
				livestreaming professional and state-of-the-art equipment.
			</p>
		</header>

		<div class="text-center">
			{#if $user}
				<a
					href="/app/book"
					class="btn-gold text-lg font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
				>
					Book a Service Now
				</a>
			{:else}
				<a
					href="/login"
					class="btn-gold text-lg font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
				>
					Login to Book a Service
				</a>
			{/if}
			<p class="mt-4 text-gray-500">
				You will be able to select a memorial and calculate the final price on the next page.
			</p>
		</div>
	</div>
</div>