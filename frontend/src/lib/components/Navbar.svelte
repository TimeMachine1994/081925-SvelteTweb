<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/auth';
</script>

<nav class="navbar">
	<div class="navbar-container">
		<a href="/" class="navbar-logo">TWeb</a>
		<ul class="nav-menu">
			<li class="nav-item">
				<a href="/" class="nav-links" class:active={$page.url.pathname === '/'}>Home</a>
			</li>
			{#if $user}
				<li class="nav-item">
					<a href="/my-portal" class="nav-links" class:active={$page.url.pathname === '/my-portal'}>My Portal</a>
				</li>
				<li class="nav-item">
					<a href="/logout" class="nav-links">Logout</a>
				</li>
			{:else}
				<li class="nav-item">
					<a href="/login" class="nav-links" class:active={$page.url.pathname === '/login'}>Login</a>
				</li>
				<li class="nav-item">
					<a href="/register" class="nav-links" class:active={$page.url.pathname === '/register'}>Register</a>
				</li>
			{/if}
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

	.nav-links.active {
		border-bottom: 4px solid #1888ff;
	}
</style>