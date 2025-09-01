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
</div>