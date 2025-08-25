e tr<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import { enhance } from '$app/forms';
	
	let { form }: { form?: import('./$types').ActionData } = $props();
</script>

<div class="TODO: replace-with-theme-class">
	<div class="TODO: replace-with-theme-class">
		<h2 class="TODO: replace-with-theme-class">Create a Memorial</h2>
		<p class="TODO: replace-with-theme-class">
			Enter your loved one's name to create a beautiful memorial page.
		</p>
		<form method="POST" use:enhance>
			<div class="TODO: replace-with-theme-class">
				<div>
					<label for="lovedOneName" class="TODO: replace-with-theme-class"
						>Loved One's Name</label
					>
					<input
						id="lovedOneName"
						name="lovedOneName"
						type="text"
						required
						class="TODO: replace-with-theme-class"
					/>
				</div>
				<div>
					<label for="name" class="TODO: replace-with-theme-class">Your Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="TODO: replace-with-theme-class"
					/>
				</div>
				<div>
					<label for="email" class="TODO: replace-with-theme-class">Your Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="TODO: replace-with-theme-class"
					/>
				</div>
				<div>
					<label for="phone" class="TODO: replace-with-theme-class"
						>Your Phone Number</label
					>
					<input
						id="phone"
						name="phone"
						type="tel"
						class="TODO: replace-with-theme-class"
					/>
				</div>
			</div>

			{#if form?.error}
				<p class="TODO: replace-with-theme-class">{form.error}</p>
			{/if}

			<div class="TODO: replace-with-theme-class">
				<button
					type="submit"
					class="TODO: replace-with-theme-class"
				>
					Create Memorial
				</button>
			</div>
		</form>
	</div>
</div>