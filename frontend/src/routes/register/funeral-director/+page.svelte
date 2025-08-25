<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import { enhance } from '$app/forms';

	let { form }: { form?: { error?: any; success?: boolean } } = $props();
</script>

<div class="TODO: replace-with-theme-class">
	<div class="TODO: replace-with-theme-class">
		<h2 class="TODO: replace-with-theme-class">Funeral Director Registration</h2>
		<p class="TODO: replace-with-theme-class">
			Create an account to manage memorials for the families you serve.
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
					<label for="directorName" class="TODO: replace-with-theme-class"
						>Your Name</label
					>
					<input
						id="directorName"
						name="directorName"
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
				<div class="TODO: replace-with-theme-class">
					<label for="funeralHomeName" class="TODO: replace-with-theme-class"
						>Funeral Home Name</label
					>
					<input
						id="funeralHomeName"
						name="funeralHomeName"
						type="text"
						required
						class="TODO: replace-with-theme-class"
					/>
				</div>
			</div>

			{#if form?.error}
				<p class="TODO: replace-with-theme-class">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="TODO: replace-with-theme-class">
					Success! Please check your email for your login details.
				</p>
			{/if}

			<div class="TODO: replace-with-theme-class">
				<button
					type="submit"
					class="TODO: replace-with-theme-class"
				>
					Create Account & Memorial
				</button>
			</div>
		</form>
	</div>
</div>