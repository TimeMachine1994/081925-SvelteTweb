<script lang="ts">
	import { user } from '$lib/auth';
	import { HelpCircle, Settings2, Mail, Calculator, Grid, Lock } from 'lucide-svelte';
</script>

<nav class="sticky top-0 z-50 w-full bg-black">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<a href="/" class="text-2xl font-extrabold italic text-white flex items-center">Tributestream<sup>®</sup></a>

		<ul class="flex items-center space-x-6 text-white">
			<li>
				<a href="/why-tributestream" class="flex items-center gap-2 hover:text-gray-300">
					<HelpCircle class="w-4 h-4" />Why Tributestream?
				</a>
			</li>
			<li>
				<a href="/how-it-works" class="flex items-center gap-2 hover:text-gray-300">
					<Settings2 class="w-4 h-4" />How Does Livestreaming Work?
				</a>
			</li>
			<li>
				<a href="/contact" class="flex items-center gap-2 hover:text-gray-300">
					<Mail class="w-4 h-4" />Contact Tributestream
				</a>
			</li>
			<li>
				<a href="/pricing" class="flex items-center gap-2 hover:text-gray-300">
					<Calculator class="w-4 h-4" />Pricing Calculator
				</a>
			</li>
			<li>
				{#if $user}
					<a href="/my-portal" class="btn-gold flex items-center gap-2">
						<Grid class="w-4 h-4" />My Portal
					</a>
				{:else}
					<a href="/login" class="btn-gold flex items-center gap-2">
						<Lock class="w-4 h-4" />Login
					</a>
				{/if}
			</li>
		</ul>
	</div>
</nav>