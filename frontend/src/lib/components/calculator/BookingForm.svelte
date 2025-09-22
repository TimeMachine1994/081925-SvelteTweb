<script lang="ts">
	import type { CalculatorFormData, Addons } from '$lib/types/livestream';
	import type { ServiceDetails } from '$lib/types/memorial';

	// New props structure - direct services and calculator data
	let { 
		services = $bindable(),
		calculatorData = $bindable(),
		lovedOneName = $bindable(''),
		funeralDirectorName = $bindable(''),
		funeralHome = $bindable('')
	} = $props<{
		services: {
			main: ServiceDetails;
			additional: Array<{
				type: 'location' | 'day';
				location: { name: string; address: string; isUnknown: boolean };
				time: { date: string | null; time: string | null; isUnknown: boolean };
				hours: number;
			}>;
		};
		calculatorData: CalculatorFormData;
		lovedOneName: string;
		funeralDirectorName: string;
		funeralHome: string;
	}>();

	// Helper functions for additional services
	function getAdditionalLocation() {
		return services.additional.find(s => s.type === 'location') || {
			type: 'location' as const,
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		};
	}

	function getAdditionalDay() {
		return services.additional.find(s => s.type === 'day') || {
			type: 'day' as const,
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		};
	}

	function toggleAdditionalLocation(enabled: boolean) {
		if (enabled) {
			const existing = services.additional.find(s => s.type === 'location');
			if (!existing) {
				services.additional.push({
					type: 'location',
					location: { name: '', address: '', isUnknown: false },
					time: { date: null, time: null, isUnknown: false },
					hours: 2
				});
			}
		} else {
			services.additional = services.additional.filter(s => s.type !== 'location');
		}
	}

	function toggleAdditionalDay(enabled: boolean) {
		if (enabled) {
			const existing = services.additional.find(s => s.type === 'day');
			if (!existing) {
				services.additional.push({
					type: 'day',
					location: { name: '', address: '', isUnknown: false },
					time: { date: null, time: null, isUnknown: false },
					hours: 2
				});
			}
		} else {
			services.additional = services.additional.filter(s => s.type !== 'day');
		}
	}

	// Derived state for UI
	let hasAdditionalLocation = $derived(services.additional.some(s => s.type === 'location'));
	let hasAdditionalDay = $derived(services.additional.some(s => s.type === 'day'));
	let additionalLocation = $derived(getAdditionalLocation());
	let additionalDay = $derived(getAdditionalDay());

</script>

<div class="space-y-8">
	<div class="card p-4 md:p-6 space-y-4">
		<h3 class="h3">In Loving Memory Of</h3>
		<label class="label">
			<span>Your Loved One's Name</span>
			<input class="input" type="text" bind:value={lovedOneName} placeholder="e.g., Jane Doe" />
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
					bind:value={services.main.time.date}
					disabled={services.main.time.isUnknown}
				/>
			</label>
			<label class="label">
				<span>Time of Livestream</span>
				<input
					class="input"
					type="time"
					bind:value={services.main.time.time}
					disabled={services.main.time.isUnknown}
				/>
			</label>
			<button
				class="btn {services.main.time.isUnknown ? 'preset-filled-primary' : 'preset-tonal-surface'}"
				onclick={() => (services.main.time.isUnknown = !services.main.time.isUnknown)}
			>
				Unknown
			</button>
		</div>
		<label class="label">
			<span>Number of Hours (Main Location): <strong>{services.main.hours}</strong></span>
			<input
				type="range"
				bind:value={services.main.hours}
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
					bind:value={services.main.location.name}
					disabled={services.main.location.isUnknown}
					placeholder="e.g., St. Mary's Church"
				/>
			</label>
			<label class="label md:col-span-3">
				<span>Location Address</span>
				<input
					class="input"
					type="text"
					bind:value={services.main.location.address}
					disabled={services.main.location.isUnknown}
					placeholder="123 Main St, Anytown, USA"
				/>
			</label>
			<button
				class="btn {services.main.location.isUnknown ? 'preset-filled-primary' : 'preset-tonal-surface'} md:col-start-3"
				onclick={() =>
					(services.main.location.isUnknown = !services.main.location.isUnknown)}
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
				<input class="input" type="text" bind:value={funeralDirectorName} />
			</label>
			<label class="label">
				<span>Funeral Home</span>
				<input class="input" type="text" bind:value={funeralHome} />
			</label>
		</div>
	</div>

	<div class="card p-4 md:p-6 space-y-6">
		<h3 class="h3">Additional Services</h3>
		<div class="flex justify-between items-center">
			<span>Add a second location for the same day?</span>
			<div class="btn-group">
				<button
					class="btn {hasAdditionalLocation ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => toggleAdditionalLocation(true)}
				>
					Yes
				</button>
				<button
					class="btn {!hasAdditionalLocation ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => toggleAdditionalLocation(false)}
				>
					No
				</button>
			</div>
		</div>

		{#if hasAdditionalLocation}
			<div class="card preset-tonal-surface p-4 space-y-4">
				<h4 class="h4">Additional Location Details</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<label class="label">
						<span>Location Name</span>
						<input class="input" type="text" bind:value={additionalLocation.location.name} />
					</label>
					<label class="label">
						<span>Location Address</span>
						<input class="input" type="text" bind:value={additionalLocation.location.address} />
					</label>
					<label class="label">
						<span>Start Time</span>
						<input class="input" type="time" bind:value={additionalLocation.time.time} />
					</label>
				</div>
				<label class="label">
					<span>Number of Hours: <strong>{additionalLocation.hours}</strong></span>
					<input
						type="range"
						bind:value={additionalLocation.hours}
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
					class="btn {hasAdditionalDay ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => toggleAdditionalDay(true)}>Yes</button
				>
				<button
					class="btn {!hasAdditionalDay ? 'preset-filled-primary' : 'preset-tonal-surface'}"
					onclick={() => toggleAdditionalDay(false)}>No</button
				>
			</div>
		</div>

		{#if hasAdditionalDay}
			<div class="card preset-tonal-surface p-4 space-y-4">
				<h4 class="h4">Additional Day Details</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<label class="label md:col-span-3">
						<span>Location Name</span>
						<input class="input" type="text" bind:value={additionalDay.location.name} />
					</label>
					<label class="label md:col-span-3">
						<span>Location Address</span>
						<input class="input" type="text" bind:value={additionalDay.location.address} />
					</label>
					<label class="label">
						<span>Date of Service</span>
						<input class="input" type="date" bind:value={additionalDay.time.date} />
					</label>
					<label class="label">
						<span>Start Time</span>
						<input class="input" type="time" bind:value={additionalDay.time.time} />
					</label>
				</div>
				<label class="label">
					<span>Number of Hours: <strong>{additionalDay.hours}</strong></span>
					<input
						type="range"
						bind:value={additionalDay.hours}
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
				<input class="checkbox" type="checkbox" bind:checked={calculatorData.addons.photography} />
				<div class="flex-1">
					<span>Photography</span>
					<span class="text-sm opacity-75 block">$400</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input class="checkbox" type="checkbox" bind:checked={calculatorData.addons.audioVisualSupport} />
				<div class="flex-1">
					<span>Audio/Visual Support</span>
					<span class="text-sm opacity-75 block">$200</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input class="checkbox" type="checkbox" bind:checked={calculatorData.addons.liveMusician} />
				<div class="flex-1">
					<span>Live Musician</span>
					<span class="text-sm opacity-75 block">$500</span>
				</div>
			</label>
			<label class="card preset-tonal-surface p-4 flex items-center space-x-4">
				<input
					type="number"
					bind:value={calculatorData.addons.woodenUsbDrives}
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