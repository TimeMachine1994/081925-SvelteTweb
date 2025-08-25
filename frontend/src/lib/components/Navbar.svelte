<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/auth';
	import { HelpCircle, Settings, Mail, Calculator, LogIn } from 'lucide-svelte';
</script>

<nav class="navbar">
	<div class="navbar-container">
		<a href="/" class="navbar-logo">Tributestream®</a>
		<ul class="nav-menu">
			<li class="nav-item">
				<a href="/why-tributestream" class="nav-links"><HelpCircle class="icon" />Why Tributestream?</a>
			</li>
			<li class="nav-item">
				<a href="/how-it-works" class="nav-links"><Settings class="icon" />How Does Livestreaming Work?</a>
			</li>
			<li class="nav-item">
				<a href="/contact" class="nav-links"><Mail class="icon" />Contact Tributestream</a>
			</li>
			<li class="nav-item">
				<a href="/pricing" class="nav-links"><Calculator class="icon" />Pricing Calculator</a>
			</li>
			<li class="nav-item">
				{#if $user}
					<a href="/my-portal" class="nav-links btn-link gold-btn">My Portal</a>
				{:else}
					<a href="/login" class="nav-links btn-link gold-btn"><LogIn class="icon" />Login</a>
				{/if}
			</li>
		</ul>
	</div>
</nav>

<style>
	.navbar {
		background: linear-gradient(90deg, rgb(28, 27, 27) 0%, rgb(26, 23, 23) 100%);
		height: 80px;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.2rem;
		position: sticky;
		top: 0;
		z-index: 999;
		width: 100%;
		transition: background-color 0.3s ease;
	}

	.navbar-container {
		display: flex;
		justify-content: space-between;
		height: 80px;
		z-index: 1;
		width: 100%;
		max-width: 1500px;
		margin: 0 auto;
		padding: 0 50px;
	}

	.navbar-logo {
		color: #fff;
		justify-self: start;
		cursor: pointer;
		text-decoration: none;
		font-size: 2rem;
		display: flex;
		align-items: center;
	}

	.nav-menu {
		display: flex;
		align-items: center;
		list-style: none;
		text-align: center;
	}

	.nav-item {
		height: 80px;
	}

	.nav-links {
		color: #fff;
		display: flex;
		align-items: center;
		text-decoration: none;
		padding: 0.5rem 1rem;
		height: 100%;
	}

	.nav-links:hover {
		border-bottom: 4px solid #fff;
		transition: all 0.2s ease-out;
	}

	.btn-link {
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		width: 100%;
		font-size: 1.2rem;
	}

	.gold-btn {
		background-color: #d4af37;
		color: black !important;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		height: auto !important;
	}

	.gold-btn:hover {
		border-bottom: none;
	}
</style>