<script lang="ts">
	import { user } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { Crown, Building2, User, Settings } from 'lucide-svelte';
	
	let isOpen = $state(false);
	
	const testAccounts = [
		{
			role: 'admin',
			email: 'admin@test.com',
			password: 'test123',
			name: 'Admin User',
			icon: Crown,
			color: 'bg-red-600'
		},
		{
			role: 'funeral_director',
			email: 'director@test.com',
			password: 'test123',
			name: 'John Director',
			icon: Building2,
			color: 'bg-amber-600'
		},
		{
			role: 'owner',
			email: 'owner@test.com',
			password: 'test123',
			name: 'Sarah Owner',
			icon: User,
			color: 'bg-green-600'
		},
		{
			role: 'viewer',
			email: 'viewer@test.com',
			password: 'test123',
			name: 'Mike Viewer',
			icon: User,
			color: 'bg-blue-600'
		}
	];
	
	async function switchToRole(account: typeof testAccounts[0]) {
		try {
			console.log(`Switching to ${account.role}: ${account.email}`);
			
			// First logout current user if any
			try {
				await fetch('/logout?dev=true', { method: 'POST' });
			} catch (e) {
				console.log('No current session to logout');
			}
			
			// Use server-side authentication to avoid browser Firebase issues
			const response = await fetch('/api/dev-role-switch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					email: account.email, 
					password: account.password 
				})
			});

			if (response.ok) {
				const result = await response.json();
				console.log(`Successfully switched to ${result.role}`);
				if (result.redirectTo) {
					window.location.href = result.redirectTo;
				} else {
					window.location.href = '/'; // Fallback to homepage
				}
			} else {
				const errorData = await response.json();
				console.error('Failed to switch roles:', errorData.error);
				alert(`Error switching to ${account.role}: ${errorData.error}`);
			}
		} catch (error: any) {
			console.error('Error switching roles:', error);
			
			// Handle different error types
			if (error.code === 'auth/user-not-found') {
				alert(`Test account ${account.email} not found. Test accounts have been created - please try again.`);
			} else if (error.code === 'auth/network-request-failed') {
				alert('Network error. Please check your internet connection and Firebase configuration.');
			} else if (error.code === 'auth/wrong-password') {
				alert('Invalid password for test account. Please check the test account setup.');
			} else {
				alert(`Error switching to ${account.role}: ${error.message || 'Unknown error'}`);
			}
		}
	}
	
	// Only show in development
	const isDev = import.meta.env.DEV;
</script>

{#if isDev}
	<div class="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs">
		<div class="flex items-center justify-between px-4 py-1">
			<div class="flex items-center gap-2">
				<Settings class="w-3 h-3" />
				<span class="font-medium">DEV MODE</span>
				{#if $user}
					<span>Current: {$user.email} ({$user.role || 'unknown'})</span>
				{:else}
					<span>Not logged in</span>
				{/if}
			</div>
			
			<button
				onclick={() => isOpen = !isOpen}
				class="px-2 py-0.5 bg-red-700 hover:bg-red-800 rounded text-xs transition-colors"
			>
				Switch Role
			</button>
		</div>
		
		{#if isOpen}
			<div class="bg-red-700 border-t border-red-500 px-4 py-2">
				<div class="grid grid-cols-3 gap-2">
					{#each testAccounts as account}
						{@const IconComponent = account.icon}
						<button
							onclick={() => switchToRole(account)}
							class="flex items-center gap-2 p-2 bg-white text-gray-900 rounded hover:bg-gray-100 transition-colors text-xs"
						>
							<div class="w-4 h-4 {account.color} rounded-full flex items-center justify-center">
								<IconComponent class="w-2.5 h-2.5 text-white" />
							</div>
							<div class="text-left">
								<div class="font-medium">{account.name}</div>
								<div class="text-xs text-gray-600">{account.role}</div>
							</div>
						</button>
					{/each}
				</div>
				<div class="mt-2 text-xs text-red-200">
					Click any role to instantly switch accounts for testing
				</div>
			</div>
		{/if}
	</div>
{/if}
