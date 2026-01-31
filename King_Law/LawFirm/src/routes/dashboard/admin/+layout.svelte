<script lang="ts">
	import type { LayoutData } from './$types';
	import { authStore } from '$lib/stores/auth.svelte.ts';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="min-h-screen bg-muted">
	<nav class="bg-background border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center space-x-8">
					<a href="/" class="flex items-center">
						<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-10 w-auto" />
					</a>
					<a href="/dashboard/admin" class="hover:text-gold transition-colors">Dashboard</a>
					<a href="/dashboard/admin/users" class="hover:text-gold transition-colors">Users</a>
					<a href="/dashboard/admin/staff-codes" class="hover:text-gold transition-colors">Staff Codes</a>
					<a href="/dashboard/admin/settings" class="hover:text-gold transition-colors">Settings</a>
				</div>

				<div class="flex items-center space-x-4">
					<span class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
						Admin
					</span>
					<span class="text-sm text-muted-foreground">
						{authStore.user?.firstName} {authStore.user?.lastName}
					</span>
					<button 
						onclick={async () => {
							await authStore.logout();
							window.location.href = '/login';
						}}
						class="text-sm hover:text-gold transition-colors"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>
