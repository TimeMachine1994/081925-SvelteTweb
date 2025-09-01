<script lang="ts">
	import type { CalculatorFormData } from '$lib/types/livestream';

	let { formData = $bindable() } = $props<{ formData: CalculatorFormData }>();
</script>

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
			onclick={() => {
				formData.mainService.time.isUnknown = !formData.mainService.time.isUnknown;
			}}
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
			class="btn {formData.mainService.location.isUnknown
				? 'preset-filled-primary'
				: 'preset-tonal-surface'} md:col-start-3"
			onclick={() => {
				formData.mainService.location.isUnknown = !formData.mainService.location.isUnknown;
			}}
		>
			Unknown
		</button>
	</div>
</div>
