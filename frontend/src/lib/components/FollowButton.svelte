<script lang="ts">
	import { Heart, Users } from 'lucide-svelte';

	interface Props {
		memorialId: string;
		isFollowing?: boolean;
		followerCount?: number;
		onToggle?: (newState: boolean) => void;
	}

	let { memorialId, isFollowing = false, followerCount = 0, onToggle }: Props = $props();

	let following = $state(isFollowing);
	let count = $state(followerCount);
	let loading = $state(false);

	async function toggleFollow() {
		if (loading) return;

		loading = true;
		const previousState = following;
		const previousCount = count;

		// Optimistic update
		following = !following;
		count = following ? count + 1 : Math.max(0, count - 1);

		try {
			const response = await fetch(`/api/memorials/${memorialId}/follow`, {
				method: following ? 'POST' : 'DELETE'
			});

			if (response.ok) {
				const data = await response.json();
				if (data.followerCount !== undefined) {
					count = data.followerCount;
				}
				onToggle?.(following);
			} else {
				// Revert on error
				following = previousState;
				count = previousCount;
				console.error('Failed to toggle follow');
			}
		} catch (error) {
			// Revert on error
			following = previousState;
			count = previousCount;
			console.error('Error toggling follow:', error);
		} finally {
			loading = false;
		}
	}
</script>

<button
	onclick={toggleFollow}
	disabled={loading}
	class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
	class:bg-blue-600={following}
	class:text-white={following}
	class:hover:bg-blue-700={following}
	class:bg-white={!following}
	class:text-gray-700={!following}
	class:border={!following}
	class:border-gray-300={!following}
	class:hover:bg-gray-50={!following}
>
	<Heart class="h-5 w-5" class:fill-current={following} />
	<span>{following ? 'Following' : 'Follow'}</span>
	
	{#if count > 0}
		<span class="flex items-center gap-1 text-sm">
			<Users class="h-4 w-4" />
			{count}
		</span>
	{/if}
</button>
