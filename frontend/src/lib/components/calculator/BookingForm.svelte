<script lang="ts">
	import type { CalculatorFormData } from '$lib/types/livestream';

	let { formData = $bindable() } = $props<{ formData: CalculatorFormData }>();
</script>

<div class="booking-form">
	<div class="form-section">
		<h3>In Loving Memory Of</h3>
		<label>
			<span>Your Loved One's Name</span>
			<input type="text" bind:value={formData.lovedOneName} placeholder="e.g., Jane Doe" />
		</label>
	</div>

	<div class="form-section">
		<h3>Main Service Details</h3>
		<div class="form-group">
			<label>
				<span>Date of Service</span>
				<input
					type="date"
					bind:value={formData.mainService.time.date}
					disabled={formData.mainService.time.isUnknown}
				/>
			</label>
			<label>
				<span>Time of Livestream</span>
				<input
					type="time"
					bind:value={formData.mainService.time.time}
					disabled={formData.mainService.time.isUnknown}
				/>
			</label>
			<button
				class:toggled={formData.mainService.time.isUnknown}
				onclick={() => (formData.mainService.time.isUnknown = !formData.mainService.time.isUnknown)}
			>
				Unknown
			</button>
		</div>
		<label>
			<span>Number of Hours (Main Location)</span>
			<input
				type="range"
				bind:value={formData.mainService.hours}
				min="1"
				max="8"
				step="1"
			/>
			<span>{formData.mainService.hours} hour(s)</span>
		</label>
		<div class="form-group">
			<label>
				<span>Location Name</span>
				<input
					type="text"
					bind:value={formData.mainService.location.name}
					disabled={formData.mainService.location.isUnknown}
					placeholder="e.g., St. Mary's Church"
				/>
			</label>
			<label>
				<span>Location Address</span>
				<input
					type="text"
					bind:value={formData.mainService.location.address}
					disabled={formData.mainService.location.isUnknown}
					placeholder="123 Main St, Anytown, USA"
				/>
			</label>
			<button
				class:toggled={formData.mainService.location.isUnknown}
				onclick={() =>
					(formData.mainService.location.isUnknown = !formData.mainService.location.isUnknown)}
			>
				Unknown
			</button>
		</div>
	</div>

	<div class="form-section">
		<h3>Funeral Professional Information (Optional)</h3>
		<div class="form-group">
			<label>
				<span>Funeral Director Name</span>
				<input type="text" bind:value={formData.funeralDirectorName} />
			</label>
			<label>
				<span>Funeral Home</span>
				<input type="text" bind:value={formData.funeralHome} />
			</label>
		</div>
	</div>

	<div class="form-section">
		<h3>Additional Services</h3>
		<div class="toggle-group">
			<span>Add a second location for the same day?</span>
			<div>
				<button
					class:toggled={formData.additionalLocation.enabled}
					onclick={() => (formData.additionalLocation.enabled = true)}
				>
					Yes
				</button>
				<button
					class:toggled={!formData.additionalLocation.enabled}
					onclick={() => (formData.additionalLocation.enabled = false)}
				>
					No
				</button>
			</div>
		</div>

		{#if formData.additionalLocation.enabled}
			<div class="sub-section">
				<h4>Additional Location Details</h4>
				<div class="form-group">
					<label>
						<span>Location Name</span>
						<input type="text" bind:value={formData.additionalLocation.location.name} />
					</label>
					<label>
						<span>Location Address</span>
						<input type="text" bind:value={formData.additionalLocation.location.address} />
					</label>
					<label>
						<span>Start Time</span>
						<input type="time" bind:value={formData.additionalLocation.startTime} />
					</label>
				</div>
				<label>
					<span>Number of Hours</span>
					<input
						type="range"
						bind:value={formData.additionalLocation.hours}
						min="1"
						max="8"
						step="1"
					/>
					<span>{formData.additionalLocation.hours} hour(s)</span>
				</label>
			</div>
		{/if}

		<div class="toggle-group">
			<span>Add another day of service?</span>
			<div>
				<button
					class:toggled={formData.additionalDay.enabled}
					onclick={() => (formData.additionalDay.enabled = true)}>Yes</button
				>
				<button
					class:toggled={!formData.additionalDay.enabled}
					onclick={() => (formData.additionalDay.enabled = false)}>No</button
				>
			</div>
		</div>

		{#if formData.additionalDay.enabled}
			<div class="sub-section">
				<h4>Additional Day Details</h4>
				<div class="form-group">
					<label>
						<span>Location Name</span>
						<input type="text" bind:value={formData.additionalDay.location.name} />
					</label>
					<label>
						<span>Location Address</span>
						<input type="text" bind:value={formData.additionalDay.location.address} />
					</label>
					<label>
						<span>Start Time</span>
						<input type="time" bind:value={formData.additionalDay.startTime} />
					</label>
				</div>
				<label>
					<span>Number of Hours</span>
					<input
						type="range"
						bind:value={formData.additionalDay.hours}
						min="1"
						max="8"
						step="1"
					/>
					<span>{formData.additionalDay.hours} hour(s)</span>
				</label>
			</div>
		{/if}
	</div>

	<div class="form-section">
		<h3>Add-ons</h3>
		<div class="addons-grid">
			<label class="addon-card">
				<input type="checkbox" bind:checked={formData.addons.photography} />
				<span>Photography</span>
				<span class="price">$400</span>
			</label>
			<label class="addon-card">
				<input type="checkbox" bind:checked={formData.addons.audioVisualSupport} />
				<span>Audio/Visual Support</span>
				<span class="price">$200</span>
			</label>
			<label class="addon-card">
				<input type="checkbox" bind:checked={formData.addons.liveMusician} />
				<span>Live Musician</span>
				<span class="price">$500</span>
			</label>
			<label class="addon-card">
				<input
					type="number"
					bind:value={formData.addons.woodenUsbDrives}
					min="0"
					class="addon-quantity"
				/>
				<span>Wooden USB Drive</span>
				<span class="price">$300 (first) / $100 (each add'l)</span>
			</label>
		</div>
	</div>
</div>

<style>
	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}
	.form-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-weight: 500;
	}
	input,
	button {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}
	button {
		cursor: pointer;
		background-color: #f0f0f0;
		transition: background-color 0.2s;
	}
	button:hover {
		background-color: #e0e0e0;
	}
	button.toggled {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	input[type='range'] {
		padding: 0;
	}
</style>