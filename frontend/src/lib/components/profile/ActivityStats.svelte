<script lang="ts">
	import { Heart, MessageCircle, Users } from 'lucide-svelte';

	interface Props {
		stats: {
			memorialsOwned: number;
			memorialsFollowing: number;
			totalComments: number;
		};
		role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	}

	let { stats, role }: Props = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
	<!-- Owned Memorials -->
	{#if role !== 'viewer'}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">
						{role === 'funeral_director' ? 'Managing' : 'Owned'}
					</p>
					<p class="text-3xl font-bold text-gray-900 mt-1">{stats.memorialsOwned}</p>
				</div>
				<div class="bg-blue-100 rounded-full p-3">
					<Heart class="h-6 w-6 text-blue-600" />
				</div>
			</div>
		</div>
	{/if}

	<!-- Following -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-gray-600">Following</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats.memorialsFollowing}</p>
			</div>
			<div class="bg-green-100 rounded-full p-3">
				<Users class="h-6 w-6 text-green-600" />
			</div>
		</div>
	</div>

	<!-- Comments -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-gray-600">Comments</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats.totalComments}</p>
			</div>
			<div class="bg-purple-100 rounded-full p-3">
				<MessageCircle class="h-6 w-6 text-purple-600" />
			</div>
		</div>
	</div>
</div>
