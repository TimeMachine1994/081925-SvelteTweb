<script lang="ts">
	/** @type {import('./$types').PageData} */
	let { data, form } = $props();

	console.log('📊 [my-portal/+page.svelte] Page data:', data);
	if (form) {
		console.log('📄 [my-portal/+page.svelte] Form data:', form);
	}

	// A helper function to format dates for datetime-local inputs
	function formatDateForInput(dateString: string | null) {
		if (!dateString) return '';
		try {
			const date = new Date(dateString);
			// Format to YYYY-MM-DDTHH:mm
			return date.toISOString().slice(0, 16);
		} catch (e) {
			console.error('🔥 Invalid date string:', dateString, e);
			return '';
		}
	}
</script>

<div class="portal-container">
	<h1>Welcome to Your Portal</h1>
	<p>This is your personal space. Only you can see this!</p>

	{#if data.livestreamBooking}
		<h2>Your Livestream Booking Details</h2>
		<form method="POST" action="?/updateBooking" class="booking-form">
			{#if form?.success}
				<p class="success-message">✅ {form.message}</p>
			{/if}
			{#if form?.message && !form?.success}
				<p class="error-message">🛑 {form.message}</p>
			{/if}

			<div class="form-grid">
				<label>
					Title
					<input name="title" type="text" bind:value={data.livestreamBooking.title} />
				</label>

				<label>
					Loved One's Name
					<input
						name="lovedOneName"
						type="text"
						bind:value={data.livestreamBooking.lovedOneName}
					/>
				</label>

				<label>
					Service Date
					<input
						name="serviceDate"
						type="datetime-local"
						bind:value={data.livestreamBooking.serviceDate}
					/>
				</label>

				<label>
					Livestream Time
					<input
						name="livestreamTime"
						type="text"
						bind:value={data.livestreamBooking.livestreamTime}
					/>
				</label>

				<label>
					Location Name
					<input
						name="locationName"
						type="text"
						bind:value={data.livestreamBooking.locationName}
					/>
				</label>

				<label>
					Location Address
					<input
						name="locationAddress"
						type="text"
						bind:value={data.livestreamBooking.locationAddress}
					/>
				</label>

				<label>
					Funeral Home
					<input
						name="funeralHome"
						type="text"
						bind:value={data.livestreamBooking.funeralHome}
					/>
				</label>

				<label>
					Funeral Director
					<input
						name="funeralDirector"
						type="text"
						bind:value={data.livestreamBooking.funeralDirector}
					/>
				</label>

				<label>
					Point of Contact Email
					<input name="pocEmail" type="email" bind:value={data.livestreamBooking.pocEmail} />
				</label>

				<label>
					Package Hours
					<input name="hours" type="number" bind:value={data.livestreamBooking.hours} />
				</label>

				<label>
					Total Cost
					<input
						name="totalCalculatedAmount"
						type="number"
						step="0.01"
						bind:value={data.livestreamBooking.totalCalculatedAmount}
					/>
				</label>
			</div>

			<fieldset>
				<legend>Addons</legend>
				<label>
					<input
						name="addons.photography"
						type="checkbox"
						bind:checked={data.livestreamBooking.addons.photography}
					/>
					Photography
				</label>
				<label>
					<input
						name="addons.liveMusician"
						type="checkbox"
						bind:checked={data.livestreamBooking.addons.liveMusician}
					/>
					Live Musician
				</label>
				<label>
					<input
						name="addons.audioVisual"
						type="checkbox"
						bind:checked={data.livestreamBooking.addons.audioVisual}
					/>
					Audio/Visual Support
				</label>
			</fieldset>

			<fieldset>
				<legend>Schedule Items (Read-Only)</legend>
				{#if data.livestreamBooking.scheduleItems.length > 0}
					<ul class="schedule-list">
						{#each data.livestreamBooking.scheduleItems as item, i}
							<li>
								<strong>{item.itemName || 'No Name'}</strong> ({item.itemType}) - {item.hours}hr(s)
								<br />
								<small>
									📍 {item.locationName || 'N/A'} at {item.locationAddress || 'N/A'}
									<br />
									⏰ Starts at {item.startTime} on {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
								</small>
							</li>
						{/each}
					</ul>
				{:else}
					<p>No schedule items found.</p>
				{/if}
			</fieldset>
			<!-- Hidden input to pass complex data that isn't directly editable yet -->
			<input
				type="hidden"
				name="scheduleItems"
				value={JSON.stringify(data.livestreamBooking.scheduleItems)}
			/>

			<button type="submit">Save Changes</button>
		</form>
	{:else}
		<div class="no-booking">
			<p>You have not created a booking yet.</p>
		</div>
	{/if}

	<form action="/logout" method="POST" class="logout-form">
		<button type="submit" class="logout-button">Logout</button>
	</form>
</div>

<style>
	.portal-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		background-color: #ffffff;
	}

	h1,
	h2 {
		text-align: center;
		color: #333;
	}

	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		font-weight: 500;
		color: #555;
	}

	input[type='text'],
	input[type='number'],
	input[type='email'],
	input[type='datetime-local'] {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		margin-top: 0.25rem;
	}

	fieldset {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	legend {
		font-weight: 600;
		padding: 0 0.5rem;
		color: #333;
	}

	fieldset label {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	.schedule-list {
		list-style-type: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.schedule-list li {
		background-color: #f9f9f9;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #007bff;
	}

	button[type='submit'] {
		padding: 0.8rem 1.6rem;
		border: none;
		border-radius: 6px;
		background-color: #28a745;
		color: white;
		font-size: 1.1rem;
		cursor: pointer;
		transition: background-color 0.2s;
		align-self: center;
	}

	button[type='submit']:hover {
		background-color: #218838;
	}

	.logout-form {
		margin-top: 2rem;
		text-align: center;
	}

	.logout-button {
		background-color: #dc3545;
	}

	.logout-button:hover {
		background-color: #c82333;
	}

	.no-booking {
		text-align: center;
		padding: 2rem;
		background-color: #f2f2f2;
		border-radius: 8px;
		margin: 2rem 0;
	}

	.success-message {
		color: #155724;
		background-color: #d4edda;
		border: 1px solid #c3e6cb;
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
	}

	.error-message {
		color: #721c24;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
	}
</style>