<script lang="ts">
	import type { PageData } from './$types';
	import { BookOpen } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const { memorials } = data;
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-4xl mx-auto">
		<header class="text-center mb-10">
			<h1 class="text-4xl font-extrabold text-gray-800 tracking-tight">Select a Memorial to Book</h1>
			<p class="mt-3 text-lg text-gray-500">Choose one of your created memorials to proceed with the booking and calculator.</p>
		</header>

		{#if memorials && memorials.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each memorials as memorial}
					<a href={`/app/book/${memorial.id}`} class="group block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
						<h2 class="text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{memorial.lovedOneName}</h2>
						<p class="text-gray-500 mt-2">Created on: {new Date(memorial.createdAt).toLocaleDateString()}</p>
						<div class="mt-6 flex items-center justify-center text-indigo-500">
							<BookOpen class="w-5 h-5 mr-2"/>
							<span class="font-semibold">Book Service</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="text-center bg-white p-10 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold text-gray-700">No Memorials Found</h2>
				<p class="mt-4 text-gray-500">You haven't created any memorials yet. Please create one to proceed.</p>
				<a href="/register/loved-one" class="mt-6 inline-block bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
					Create a Memorial
				</a>
			</div>
		{/if}
	</div>
</div>