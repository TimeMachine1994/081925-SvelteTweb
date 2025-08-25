<!-- TODO: Remove Tailwind CSS classes and replace with styles from tribute-theme.css -->
<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<div class="TODO: replace-with-theme-class">
	<div class="TODO: replace-with-theme-class">
		<h2 class="TODO: replace-with-theme-class">Register</h2>
		<p class="TODO: replace-with-theme-class">How would you like to get started?</p>
		<div class="TODO: replace-with-theme-class">
			<a href="/register/loved-one" class="TODO: replace-with-theme-class">
				I'm a family member or friend
			</a>
			<a href="/register/funeral-director" class="TODO: replace-with-theme-class">
				I'm a funeral director
			</a>
		</div>
	</div>

	<div class="TODO: replace-with-theme-class admin-register-form">
		<h3 class="TODO: replace-with-theme-class">Admin Registration (for testing)</h3>
		<form method="POST" action="?/registerAdmin">
			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
			<div class="TODO: replace-with-theme-class">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" required class="TODO: replace-with-theme-class" />
			</div>
			<div class="TODO: replace-with-theme-class">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="TODO: replace-with-theme-class"
				/>
			</div>
			<button type="submit" class="TODO: replace-with-theme-class">Register as Admin</button>
		</form>
	</div>
</div>