<script lang="ts">
	import { user } from '$lib/auth';
	import { Heart, HeartOff } from 'lucide-svelte';
	
	let { memorialId, isFollowing = false }: { memorialId: string; isFollowing?: boolean } = $props();
	
	let following = $state(isFollowing);
	let isLoading = $state(false);
	
	async function toggleFollow() {
		if (!$user || isLoading) return;
		
		isLoading = true;
		
		try {
			const response = await fetch('/api/memorial/follow', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memorialId,
					action: following ? 'unfollow' : 'follow'
				})
			});
			
			if (response.ok) {
				following = !following;
			} else {
				console.error('Failed to toggle follow status');
			}
		} catch (error) {
			console.error('Error toggling follow:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

{#if $user}
	<button
		onclick={toggleFollow}
		disabled={isLoading}
		class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
		class:bg-red-100={following}
		class:text-red-700={following}
		class:hover:bg-red-200={following}
		class:bg-yellow-100={!following}
		class:text-yellow-700={!following}
		class:hover:bg-yellow-200={!following}
	>
		{#if isLoading}
			<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
		{:else if following}
			<HeartOff class="w-4 h-4" />
		{:else}
			<Heart class="w-4 h-4" />
		{/if}
		
		{following ? 'Unfollow' : 'Follow Memorial'}
	</button>
{/if}
