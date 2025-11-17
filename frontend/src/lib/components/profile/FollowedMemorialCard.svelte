<script lang="ts">
	import { Calendar, MapPin, Users, X } from 'lucide-svelte';
	import type { Memorial } from '$lib/types/memorial';

	interface Props {
		memorial: Memorial;
		onUnfollow?: () => void;
	}

	let { memorial, onUnfollow }: Props = $props();

	let isUnfollowing = $state(false);

	async function handleUnfollow() {
		if (!memorial.id || isUnfollowing) return;

		isUnfollowing = true;
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/follow`, {
				method: 'DELETE'
			});

			if (response.ok) {
				onUnfollow?.();
			} else {
				console.error('Failed to unfollow memorial');
			}
		} catch (error) {
			console.error('Error unfollowing memorial:', error);
		} finally {
			isUnfollowing = false;
		}
	}

	function formatDate(dateStr: string | undefined | null) {
		if (!dateStr) return '';
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
	<div class="flex items-start justify-between mb-4">
		<div class="flex-1">
			<a
				href="/{memorial.fullSlug || memorial.slug}"
				class="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
			>
				{memorial.lovedOneName}
			</a>
			{#if memorial.birthDate && memorial.deathDate}
				<p class="text-sm text-gray-600 mt-1">
					{formatDate(memorial.birthDate)} - {formatDate(memorial.deathDate)}
				</p>
			{/if}
		</div>

		<button
			onclick={handleUnfollow}
			disabled={isUnfollowing}
			class="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
			title="Unfollow"
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<div class="space-y-2">
		{#if memorial.services?.main?.location?.name}
			<div class="flex items-center text-sm text-gray-600">
				<MapPin class="h-4 w-4 mr-2 flex-shrink-0" />
				<span class="truncate">{memorial.services.main.location.name}</span>
			</div>
		{/if}

		{#if memorial.services?.main?.time?.date}
			<div class="flex items-center text-sm text-gray-600">
				<Calendar class="h-4 w-4 mr-2 flex-shrink-0" />
				<span>{formatDate(memorial.services.main.time.date)}</span>
			</div>
		{/if}

		<div class="flex items-center text-sm text-gray-600">
			<Users class="h-4 w-4 mr-2 flex-shrink-0" />
			<span>{memorial.followerCount || 0} followers</span>
		</div>
	</div>

	<div class="mt-4 pt-4 border-t border-gray-200">
		<a
			href="/{memorial.fullSlug || memorial.slug}"
			class="text-sm text-blue-600 hover:text-blue-700 font-medium"
		>
			View Memorial →
		</a>
	</div>
</div>
