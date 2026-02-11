<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';
	import { authStore } from '$lib/stores/auth.svelte.ts';

	let { children }: { children: any } = $props();

	let sidebarCollapsed = $state(false);
	let mobileOpen = $state(false);

	function toggleSidebar() {
		if (window.innerWidth < 1024) {
			mobileOpen = !mobileOpen;
		} else {
			sidebarCollapsed = !sidebarCollapsed;
		}
	}

	function closeMobileSidebar() {
		mobileOpen = false;
	}

	async function handleLogout() {
		await authStore.logout();
		window.location.href = '/login';
	}
</script>

<div class="flex h-screen overflow-hidden bg-muted">
	<!-- Desktop Sidebar -->
	<div class="hidden lg:flex shrink-0">
		<Sidebar
			user={authStore.user}
			collapsed={sidebarCollapsed}
			onToggle={toggleSidebar}
			onLogout={handleLogout}
		/>
	</div>

	<!-- Mobile Sidebar Overlay -->
	{#if mobileOpen}
		<div class="fixed inset-0 z-40 lg:hidden">
			<!-- Backdrop -->
			<button
				class="absolute inset-0 bg-black/50"
				onclick={closeMobileSidebar}
				aria-label="Close sidebar"
			></button>
			<!-- Sidebar -->
			<div class="relative z-50 h-full w-60">
				<Sidebar
					user={authStore.user}
					collapsed={false}
					onToggle={closeMobileSidebar}
					onLogout={handleLogout}
				/>
			</div>
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="flex flex-col flex-1 min-w-0 overflow-hidden">
		<TopBar
			user={authStore.user}
			onToggleSidebar={toggleSidebar}
			onLogout={handleLogout}
		/>

		<main id="main-content" class="flex-1 overflow-y-auto p-4 lg:p-6">
			{@render children()}
		</main>
	</div>
</div>
