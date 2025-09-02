<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { Memorial } from '$lib/types/memorial';

	let { data, form } = $props();
	let displayName = $state(data.profile?.displayName || '');

	console.log('👨‍💻 Profile component data:', data);
</script>

{#if data.profile}
	<h2>Profile</h2>
	<p>Email: {data.profile.email}</p>

	<form method="POST" action="?/updateProfile" use:enhance>
		<label>
			Display Name:
			<input type="text" name="displayName" bind:value={displayName} />
		</label>
		<button type="submit">Save</button>
	</form>

	{#if form?.message}
		<p>{form.message}</p>
	{/if}

	<form method="POST" action="/logout">
		<button type="submit">Logout</button>
	</form>

	<button onclick={() => goto('/contact')}>Contact Support</button>

	{#if data.memorials && data.memorials.length > 0}
		<h3>Your Tributes</h3>
		<ul>
			{#each data.memorials as memorial}
				<li>
					<a href="/tributes/{memorial.slug}">{memorial.lovedOneName}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.bookings && data.bookings.length > 0}
		<h3>Your Bookings</h3>
		<ul>
			{#each data.bookings as booking}
				{@const memorial = data.memorials.find((m: Memorial) => m.id === booking.memorialId)}
				{#if memorial}
					<li>
						<a href="/tributes/{memorial.slug}">{memorial.lovedOneName}</a> - Status: {booking.status}
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
{:else}
	<p>Loading profile...</p>
{/if}