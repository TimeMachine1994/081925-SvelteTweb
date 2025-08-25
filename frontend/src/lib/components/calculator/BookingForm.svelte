<script lang="ts">
	import type { CalculatorFormData } from '$lib/types/livestream';

	let { formData = $bindable() } = $props<{ formData: CalculatorFormData }>();

	console.log('📝 BookingForm Initializing...', { formData });
	$inspect(formData);
</script>

<div class="space-y-8">
	<div class="card p-4 md:p-6 space-y-4">
		<h3 class="h3">In Loving Memory Of</h3>
		<label class="label">
			<span>Your Loved One's Name</span>
			<input class="input" type="text" bind:value={formData.lovedOneName} placeholder="e.g., Jane Doe" />
		</label>
	</div>

	<div class="card p-4 md:p-6 space-y-4">
		<h3 class="h3">Main Service Details</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
			<label class="label">
				<span>Date of Service</span>
				<input
					class="input"
					type="date"
					bind:value={formData.mainService.time.date}
					disabled={formData.mainService.time.isUnknown}
				/>
			</label>
			<label class="label">
				<span>Time of Livestream</span>
				<input
					class="input"
					type="time"
					bind:value={formData.mainService.time.time}
					disabled={formData.mainService.time.isUnknown}
				/>
			</label>
			<button
				class="btn {formData.mainService.time.isUnknown ? 'preset-filled-primary' : 'preset-tonal-surface'}"
				onclick={() => (formData.mainService.time.isUnknown = !formData.mainService.time.isUnknown)}
			>
				Unknown
			</button>
		</div>
		<label class="label">
			<span>Number of Hours (Main Location): <strong>{formData.mainService.hours}</strong></span>
			<input
				type="range"
				bind:value={formData.mainService.hours}
				min="1"
				max="8"
				step="1"
				class="range"
			/>
		</label>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
			<label class="label md:col-span-2">
				<span>Location Name</span>
				<input
					class="input"
					type="text"
					bind:value={formData.mainService.location.name}
					disabled={formData.mainService.location.isUnknown}
					placeholder="e.g., St. Mary's Church"
				/>
			</label>
			<label class="label md:col-span-3">
				<span>Location Address</span>
				<input
					class="input"
					type="text"
					bind:value={formData.mainService.location.address}
					disabled={formData.mainService.location.isUnknown}
					placeholder="123 Main St, Anytown, USA"
				/>
			</label>
			<button
				class="btn {formData.mainService.location.isUnknown ? 'preset-filled-primary' : 'preset-tonal-surface'} md:col-start-3"
				onclick={() =>
					(formData.mainService.location.isUnknown = !formData.mainService.location.isUnknown)}
			>
				Unknown
			</button>
		</div>
	</div>

	<div class="card p-4 md:p-6 space-y-4">
		<h3 class="h3">Funeral Professional Information (Optional)</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="label">
				<span>Funeral Director Name</span>
				<input class="input" type="text" bind:value={formData.funeralDirectorName} />
			</label>
			<label class="label">
				<span>Funeral Home</span>
				<input class="input" type="text" bind:value={formData.funeralHome} />
			</label>
		</div>
	</div>

	<div class="card p-4 md:p-6 space-y-6">
		<h3 class="h3">Additional Services</h3>
		<div class="flex justify-between items-center">
			<span>Add a second location for the same day?</span>
			<div class="btn-group">
				<button
					class="btn {formData.additionalLocation.enabled ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => (formData.additionalLocation.enabled = true)}
				>
					Yes
				</button>
				<button
					class="btn {!formData.additionalLocation.enabled ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => (formData.additionalLocation.enabled = false)}
				>
					No
				</button>
			</div>
		</div>

		{#if formData.additionalLocation.enabled}
			<div class="card preset-tonal-surface p-4 space-y-4">
				<h4 class="h4">Additional Location Details</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<label class="label">
						<span>Location Name</span>
						<input class="input" type="text" bind:value={formData.additionalLocation.location.name} />
					</label>
					<label class="label">
						<span>Location Address</span>
						<input class="input" type="text" bind:value={formData.additionalLocation.location.address} />
					</label>
					<label class="label">
						<span>Start Time</span>
						<input class="input" type="time" bind:value={formData.additionalLocation.startTime} />
					</label>
				</div>
				<label class="label">
					<span>Number of Hours: <strong>{formData.additionalLocation.hours}</strong></span>
					<input
						type="range"
						bind:value={formData.additionalLocation.hours}
						min="1"
						max="8"
						step="1"
						class="range"
					/>
				</label>
			</div>
		{/if}

		<div class="flex justify-between items-center">
			<span>Add another day of service?</span>
			<div class="btn-group">
				<button
					class="btn {formData.additionalDay.enabled ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => (formData.additionalDay.enabled = true)}>Yes</button
				>
				<button
					class="btn {!formData.additionalDay.enabled ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => (formData.additionalDay.enabled = false)}>No</button
				>
			</div>
		</div>

		{#if formData.additionalDay.enabled}
			<div class="card preset-tonal-surface p-4 space-y-4">
				<h4 class="h4">Additional Day Details</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<label class="label">
						<span>Location Name</span>
						<input class="input" type="text" bind:value={formData.additionalDay.location.name} />
					</label>
					<label class="label">
						<span>Location Address</span>
						<input class="input" type="text" bind:value={formData.additionalDay.location.address} />
					</label>
					<label class="label">
						<span>Start Time</span>
						<input class="input" type="time" bind:value={formData.additionalDay.startTime} />
					</label>
				</div>
				<label class="label">
					<span>Number of Hours: <strong>{formData.additionalDay.hours}</strong></span>
					<input
						type="range"
						bind:value={formData.additionalDay.hours}
						min="1"
						max="8"
						step="1"
						class="range"
					/>
				</label>
			</div>
		{/if}
	</div>

	<div class="card p-4 md:p-6 space-y-4">
		<h3 class="h3">Add-ons</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input class="checkbox" type="checkbox" bind:checked={formData.addons.photography} />
				<div class="flex-1">
					<span>Photography</span>
					<span class="text-sm opacity-75 block">$400</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input class="checkbox" type="checkbox" bind:checked={formData.addons.audioVisualSupport} />
				<div class="flex-1">
					<span>Audio/Visual Support</span>
					<span class="text-sm opacity-75 block">$200</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input class="checkbox" type="checkbox" bind:checked={formData.addons.liveMusician} />
				<div class="flex-1">
					<span>Live Musician</span>
					<span class="text-sm opacity-75 block">$500</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input
					type="number"
					bind:value={formData.addons.woodenUsbDrives}
					min="0"
					class="input w-20 text-center"
				/>
				<div class="flex-1">
					<span>Wooden USB Drive</span>
					<span class="text-sm opacity-75 block">$300 (first) / $100 (each add'l)</span>
				</div>
			</label>
		</div>
	</div>
</div>