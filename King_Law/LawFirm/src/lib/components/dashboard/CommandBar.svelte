<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy, tick } from 'svelte';
	import {
		Search,
		LayoutDashboard,
		Briefcase,
		FileText,
		MessageSquare,
		Receipt,
		CreditCard,
		Users,
		KeyRound,
		Settings,
		Sun,
		Moon,
		LogOut
	} from 'lucide-svelte';
	import { themeStore } from '$lib/stores/theme.svelte.ts';

	type CommandItem = {
		id: string;
		icon: any;
		label: string;
		description?: string;
		action: () => void;
		keywords?: string[];
	};

	let {
		user,
		onLogout
	}: {
		user: any;
		onLogout: () => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement;
	let listEl: HTMLDivElement;

	// Build command list based on user role
	let commands = $derived<CommandItem[]>(buildCommands());

	function buildCommands(): CommandItem[] {
		const role = user?.role || 'client';
		const base = `/dashboard/${role}`;
		const items: CommandItem[] = [];

		// Navigation commands (role-based)
		if (role === 'client') {
			items.push(
				{ id: 'nav-dash', icon: LayoutDashboard, label: 'Dashboard', description: 'Go to client dashboard', action: () => navigate(base), keywords: ['home', 'overview'] },
				{ id: 'nav-docs', icon: FileText, label: 'Documents', description: 'View your documents', action: () => navigate(`${base}/documents`), keywords: ['files', 'uploads'] },
				{ id: 'nav-invoices', icon: Receipt, label: 'Invoices', description: 'View and pay invoices', action: () => navigate(`${base}/invoices`), keywords: ['payment', 'invoice', 'bill', 'pay'] }
			);
		} else if (role === 'lawyer') {
			items.push(
				{ id: 'nav-dash', icon: LayoutDashboard, label: 'Dashboard', description: 'Go to lawyer dashboard', action: () => navigate(base), keywords: ['home', 'overview'] },
				{ id: 'nav-docs', icon: FileText, label: 'All Documents', description: 'Browse all documents', action: () => navigate(`${base}/documents`), keywords: ['files', 'uploads'] }
			);
		} else if (role === 'admin') {
			items.push(
				{ id: 'nav-dash', icon: LayoutDashboard, label: 'Dashboard', description: 'Admin overview', action: () => navigate(base), keywords: ['home', 'overview'] },
				{ id: 'nav-users', icon: Users, label: 'Manage Users', description: 'View all user accounts', action: () => navigate(`${base}/users`), keywords: ['accounts', 'people'] },
				{ id: 'nav-codes', icon: KeyRound, label: 'Staff Codes', description: 'Manage registration codes', action: () => navigate(`${base}/staff-codes`), keywords: ['employee', 'registration'] },
				{ id: 'nav-settings', icon: Settings, label: 'Settings', description: 'System configuration', action: () => navigate(`${base}/settings`), keywords: ['config', 'password'] }
			);
		} else if (role === 'staff') {
			items.push(
				{ id: 'nav-dash', icon: LayoutDashboard, label: 'Dashboard', description: 'Staff dashboard', action: () => navigate(base), keywords: ['home', 'overview'] }
			);
		}

		// Theme commands (available to all)
		items.push(
			{ id: 'theme-toggle', icon: themeStore.isDark ? Sun : Moon, label: themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', description: 'Toggle theme', action: () => { themeStore.toggle(); close(); }, keywords: ['dark', 'light', 'theme', 'mode'] }
		);

		// Logout
		items.push(
			{ id: 'logout', icon: LogOut, label: 'Sign Out', description: 'Log out of your account', action: () => { close(); onLogout(); }, keywords: ['logout', 'exit', 'signout'] }
		);

		return items;
	}

	let filteredCommands = $derived(() => {
		if (!query.trim()) return commands;
		const q = query.toLowerCase();
		return commands.filter(cmd =>
			cmd.label.toLowerCase().includes(q) ||
			cmd.description?.toLowerCase().includes(q) ||
			cmd.keywords?.some(k => k.includes(q))
		);
	});

	function navigate(href: string) {
		close();
		goto(href);
	}

	function close() {
		open = false;
		query = '';
		selectedIndex = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		// Global: CMD+K / Ctrl+K to open
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = !open;
			if (open) {
				tick().then(() => inputEl?.focus());
			}
			return;
		}

		// Escape to close
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			close();
			return;
		}

		if (!open) return;

		const items = filteredCommands();

		// Arrow navigation
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
			scrollToSelected();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			scrollToSelected();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (items[selectedIndex]) {
				items[selectedIndex].action();
			}
		}
	}

	function scrollToSelected() {
		tick().then(() => {
			const el = listEl?.querySelector(`[data-index="${selectedIndex}"]`);
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	// Reset selected index when query changes
	$effect(() => {
		query;
		selectedIndex = 0;
	});

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]">
		<button
			class="absolute inset-0"
			onclick={close}
			aria-label="Close command bar"
			tabindex="-1"
		></button>

		<!-- Command Bar Panel -->
		<div
			class="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-label="Command bar"
		>
			<!-- Search Input -->
			<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
				<Search class="w-5 h-5 text-muted-foreground shrink-0" />
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Type a command or search..."
					class="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
					autocomplete="off"
				/>
				<kbd class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
					ESC
				</kbd>
			</div>

			<!-- Results -->
			<div bind:this={listEl} class="max-h-72 overflow-y-auto py-2">
				{#if filteredCommands().length > 0}
					{#each filteredCommands() as cmd, i}
						<button
							data-index={i}
							onclick={() => cmd.action()}
							onmouseenter={() => selectedIndex = i}
							class="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors
								{i === selectedIndex ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}"
						>
							<cmd.icon class="w-4 h-4 shrink-0" />
							<div class="flex-1 min-w-0">
								<span class="font-medium text-foreground">{cmd.label}</span>
								{#if cmd.description}
									<span class="ml-2 text-xs text-muted-foreground">{cmd.description}</span>
								{/if}
							</div>
							{#if i === selectedIndex}
								<kbd class="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
									↵
								</kbd>
							{/if}
						</button>
					{/each}
				{:else}
					<div class="px-4 py-8 text-center text-sm text-muted-foreground">
						No results for "{query}"
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
				<div class="flex items-center gap-3">
					<span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate</span>
					<span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">↵</kbd> select</span>
					<span class="flex items-center gap-1"><kbd class="font-mono bg-muted px-1 rounded">esc</kbd> close</span>
				</div>
			</div>
		</div>
	</div>
{/if}
