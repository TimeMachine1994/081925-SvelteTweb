<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="min-h-screen bg-muted">
	<nav class="bg-background border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center space-x-8">
					<a href="/" class="font-title text-2xl text-gold">King Law Firm</a>
					<a href="/dashboard/client" class="hover:text-gold transition-colors">Dashboard</a>
				</div>

				<div class="flex items-center space-x-4">
					<span class="text-sm text-muted-foreground">
						Welcome, {data.user.firstName} {data.user.lastName}
					</span>
					<form method="POST" action="/logout">
						<button type="submit" class="text-sm hover:text-gold transition-colors">
							Logout
						</button>
					</form>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>
