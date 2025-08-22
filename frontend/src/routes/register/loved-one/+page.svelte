<script lang="ts">
	import { enhance } from '$app/forms';
	
	let { form }: { form?: import('./$types').ActionData } = $props();
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
	<div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
		<h2 class="text-2xl font-bold text-center text-gray-900">Create a Memorial</h2>
		<p class="text-center text-gray-600">
			Enter your loved one's name to create a beautiful memorial page.
		</p>
		<form method="POST" use:enhance>
			<div class="space-y-4">
				<div>
					<label for="lovedOneName" class="block text-sm font-medium text-gray-700"
						>Loved One's Name</label
					>
					<input
						id="lovedOneName"
						name="lovedOneName"
						type="text"
						required
						class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">Your Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">Your Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700"
						>Your Phone Number</label
					>
					<input
						id="phone"
						name="phone"
						type="tel"
						class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
			</div>

			{#if form?.error}
				<p class="mt-4 text-sm text-red-600">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="mt-4 text-sm text-green-600">
					Success! Please check your email for your login details.
				</p>
			{/if}

			<div class="mt-6">
				<button
					type="submit"
					class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Create Memorial
				</button>
			</div>
		</form>
	</div>
</div>