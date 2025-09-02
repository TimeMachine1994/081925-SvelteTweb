<script lang="ts">
	import type { PageData } from './$types';

	let {
		data,
		form
	}: { data: PageData; form?: { missing?: boolean; error?: string; email?: string } } = $props();
	const { memorial } = data;

	console.log('📊 Calculator page component initialized');
	console.log('Memorial data received:', memorial);
	console.log('Form data:', form);

	// Pre-populate form state using the loaded memorial data
	let bookingDetails = $state({
		lovedOneName: memorial.lovedOneName,
		memorialDate: memorial.memorialDate || '',
		creatorName: memorial.creatorName || '',
		creatorEmail: memorial.creatorEmail || ''
		// ... other fields from the booking form can be added here
	});
</script>

<div class="min-h-screen bg-gray-100 p-8">
	<div class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
		<header class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800">
				Livestream & Keepsake Calculator for {memorial.lovedOneName}
			</h1>
			<p class="text-gray-500 mt-2">
				Please confirm the details below and select your desired services.
			</p>
		</header>

		<form method="POST" class="space-y-6">
			<section>
				<h2 class="text-xl font-semibold mb-4 text-gray-700">Memorial Information</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="lovedOneName" class="block text-sm font-medium text-gray-600">Loved One's Name</label>
						<input
							id="lovedOneName"
							type="text"
							bind:value={bookingDetails.lovedOneName}
							class="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							disabled
						/>
					</div>
					<div>
						<label for="memorialDate" class="block text-sm font-medium text-gray-600">Date of Memorial</label>
						<input
							id="memorialDate"
							type="date"
							bind:value={bookingDetails.memorialDate}
							class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold mb-4 text-gray-700">Contact Information</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="creatorName" class="block text-sm font-medium text-gray-600">Your Name</label>
						<input
							id="creatorName"
							type="text"
							bind:value={bookingDetails.creatorName}
							class="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							disabled
						/>
					</div>
					<div>
						<label for="creatorEmail" class="block text-sm font-medium text-gray-600">Your Email</label>
						<input
							id="creatorEmail"
							type="email"
							bind:value={bookingDetails.creatorEmail}
							class="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							disabled
						/>
					</div>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold mb-4 text-gray-700">Service Package</h2>
				<div>
					<label for="servicePackage" class="block text-sm font-medium text-gray-600">Select a package</label>
					<select
						id="servicePackage"
						name="servicePackage"
						class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="basic">Basic Livestream</option>
						<option value="premium">Premium Livestream + Digital Keepsake</option>
						<option value="ultimate">Ultimate Memorial Package</option>
					</select>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold mb-4 text-gray-700">Booking Details</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="dateTime" class="block text-sm font-medium text-gray-600">Date and Time</label>
						<input
							id="dateTime"
							name="dateTime"
							type="datetime-local"
							class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
				</div>
				<div class="mt-6">
					<label for="specialRequests" class="block text-sm font-medium text-gray-600">Special Requests</label>
					<textarea
						id="specialRequests"
						name="specialRequests"
						rows="4"
						class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Any special instructions or requests for the service..."
					></textarea>
				</div>
			</section>

			{#if form?.missing}
				<p class="text-red-500 text-sm text-center">Please fill out all required fields.</p>
			{/if}
			{#if form?.error}
				<p class="text-red-500 text-sm text-center">{form.error}</p>
			{/if}

			<div class="text-center pt-6">
				<button
					type="submit"
					class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Proceed to Payment
				</button>
			</div>
		</form>
	</div>
</div>