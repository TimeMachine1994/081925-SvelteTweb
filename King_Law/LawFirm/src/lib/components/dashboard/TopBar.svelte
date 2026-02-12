<script lang="ts">
	import { page } from '$app/stores';
	import { getBreadcrumbs } from '$lib/utils/breadcrumbs';
	import { Search, Bell, Menu, ChevronRight, Sun, Moon, X } from 'lucide-svelte';
	import { themeStore } from '$lib/stores/theme.svelte.ts';
	import { notificationsStore } from '$lib/stores/notifications.svelte.ts';

	type User = {
		id: string;
		firstName: string;
		lastName: string;
		role: string;
		email: string;
	};

	let {
		user,
		onToggleSidebar,
		onLogout
	}: {
		user: User;
		onToggleSidebar: () => void;
		onLogout: () => void;
	} = $props();

	let breadcrumbs = $derived(getBreadcrumbs($page.url.pathname));
	let showUserMenu = $state(false);
	let showNotifications = $state(false);

	const roleBadgeColors: Record<string, string> = {
		client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
		lawyer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		staff: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
		admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
	};

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu-container')) {
			showUserMenu = false;
		}
		if (!target.closest('.notification-container')) {
			showNotifications = false;
		}
	}

	function openCommandBar() {
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
	<!-- Left: Hamburger + Breadcrumbs -->
	<div class="flex items-center gap-3">
		<button
			onclick={onToggleSidebar}
			class="p-2 rounded-md hover:bg-muted transition-colors lg:hidden"
			aria-label="Toggle sidebar"
		>
			<Menu class="w-5 h-5 text-foreground" />
		</button>

		<nav aria-label="Breadcrumb" class="hidden sm:flex items-center gap-1 text-sm">
			{#each breadcrumbs as crumb, i}
				{#if i > 0}
					<ChevronRight class="w-3.5 h-3.5 text-muted-foreground" />
				{/if}
				{#if i === breadcrumbs.length - 1}
					<span class="text-foreground font-medium">{crumb.label}</span>
				{:else}
					<a href={crumb.href} class="text-muted-foreground hover:text-foreground transition-colors">
						{crumb.label}
					</a>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- Right: Search hint + Notifications + User -->
	<div class="flex items-center gap-2">
		<!-- Search Trigger (opens CMD+K) -->
		<button
			onclick={openCommandBar}
			class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors border border-border"
			aria-label="Search"
		>
			<Search class="w-4 h-4" />
			<span class="hidden md:inline">Search...</span>
			<kbd class="hidden md:inline text-[10px] px-1.5 py-0.5 bg-background rounded border border-border font-mono">⌘K</kbd>
		</button>

		<!-- Theme Toggle -->
		<button
			onclick={() => themeStore.setMode(themeStore.isDark ? 'light' : 'dark')}
			class="p-2 rounded-md hover:bg-muted transition-colors"
			aria-label="Toggle dark mode"
		>
			{#if themeStore.isDark}
				<Sun class="w-5 h-5 text-muted-foreground" />
			{:else}
				<Moon class="w-5 h-5 text-muted-foreground" />
			{/if}
		</button>

		<!-- Notification Bell -->
		<div class="relative notification-container">
			<button
				onclick={() => showNotifications = !showNotifications}
				class="p-2 rounded-md hover:bg-muted transition-colors relative"
				aria-label="Notifications"
			>
				<Bell class="w-5 h-5 text-muted-foreground" />
				{#if notificationsStore.unreadCount > 0}
					<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
				{/if}
			</button>

			{#if showNotifications}
				<div class="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
					<div class="flex items-center justify-between px-4 py-3 border-b border-border">
						<h3 class="text-sm font-semibold">Notifications</h3>
						{#if notificationsStore.unreadCount > 0}
							<button
								onclick={() => notificationsStore.markAllAsRead()}
								class="text-xs text-gold hover:underline"
							>Mark all read</button>
						{/if}
					</div>
					<div class="max-h-72 overflow-y-auto">
						{#if notificationsStore.notifications.length > 0}
							{#each notificationsStore.notifications as notification}
								<div class="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors {notification.read ? 'opacity-60' : ''}">
									<div class="flex-1 min-w-0">
										{#if notification.href}
											<a href={notification.href} onclick={() => { notificationsStore.markAsRead(notification.id); showNotifications = false; }} class="text-sm font-medium text-foreground hover:text-gold">
												{notification.title}
											</a>
										{:else}
											<span class="text-sm font-medium text-foreground">{notification.title}</span>
										{/if}
										{#if notification.description}
											<p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
										{/if}
									</div>
									<button
										onclick={() => notificationsStore.dismiss(notification.id)}
										class="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
										aria-label="Dismiss"
									><X class="w-3.5 h-3.5" /></button>
								</div>
							{/each}
						{:else}
							<div class="px-4 py-8 text-center text-sm text-muted-foreground">
								No notifications
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- User Menu -->
		<div class="relative user-menu-container">
			<button
				onclick={() => (showUserMenu = !showUserMenu)}
				class="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition-colors"
				aria-label="User menu"
			>
				<div
					class="w-8 h-8 rounded-full bg-king-blue text-white flex items-center justify-center text-xs font-bold"
				>
					{user?.firstName?.[0]}{user?.lastName?.[0]}
				</div>
				<span class="hidden md:block text-sm font-medium text-foreground">
					{user?.firstName}
				</span>
				<span
					class="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize {roleBadgeColors[user?.role] || ''}"
				>
					{user?.role}
				</span>
			</button>

			{#if showUserMenu}
				<div class="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
					<div class="px-3 py-2 border-b border-border">
						<p class="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
						<p class="text-xs text-muted-foreground">{user?.email}</p>
					</div>
					<button
						onclick={() => {
							showUserMenu = false;
							onLogout();
						}}
						class="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
					>
						Logout
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>
