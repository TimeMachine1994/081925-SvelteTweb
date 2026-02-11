<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		Briefcase,
		FileText,
		MessageSquare,
		Receipt,
		CreditCard,
		Users,
		KeyRound,
		Settings,
		LogOut,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	type NavItem = {
		icon: any;
		label: string;
		href: string;
	};

	type User = {
		id: string;
		firstName: string;
		lastName: string;
		role: string;
		email: string;
	};

	let {
		user,
		collapsed = false,
		onToggle,
		onLogout
	}: {
		user: User;
		collapsed?: boolean;
		onToggle: () => void;
		onLogout: () => void;
	} = $props();

	const navItems: Record<string, NavItem[]> = {
		client: [
			{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/client' },
			{ icon: Briefcase, label: 'My Cases', href: '/dashboard/client' },
			{ icon: FileText, label: 'Documents', href: '/dashboard/client/documents' },
			{ icon: MessageSquare, label: 'Messages', href: '/dashboard/client' },
			{ icon: Receipt, label: 'Invoices', href: '/dashboard/client' },
			{ icon: CreditCard, label: 'Pay Bill', href: '/pay-bill' }
		],
		lawyer: [
			{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/lawyer' },
			{ icon: Briefcase, label: 'Cases', href: '/dashboard/lawyer' },
			{ icon: Users, label: 'Clients', href: '/dashboard/lawyer' },
			{ icon: FileText, label: 'Documents', href: '/dashboard/lawyer/documents' },
			{ icon: MessageSquare, label: 'Messages', href: '/dashboard/lawyer' }
		],
		staff: [
			{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/staff' },
			{ icon: Briefcase, label: 'Assigned Cases', href: '/dashboard/staff' }
		],
		admin: [
			{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
			{ icon: Users, label: 'Users', href: '/dashboard/admin/users' },
			{ icon: KeyRound, label: 'Staff Codes', href: '/dashboard/admin/staff-codes' },
			{ icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' }
		]
	};

	let items = $derived(navItems[user?.role] || []);

	function isActive(href: string): boolean {
		const current = $page.url.pathname;
		// Exact match for dashboard home, startsWith for sub-routes
		if (href === `/dashboard/${user?.role}`) {
			return current === href;
		}
		return current.startsWith(href);
	}

	const roleBadgeColors: Record<string, string> = {
		client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
		lawyer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
		staff: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
		admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
	};
</script>

<aside
	class="flex flex-col h-full bg-king-blue text-white transition-all duration-300 {collapsed
		? 'w-16'
		: 'w-60'}"
>
	<!-- Logo & Collapse Toggle -->
	<div class="flex items-center justify-between px-3 h-16 border-b border-white/10 shrink-0">
		{#if !collapsed}
			<a href="/dashboard/{user?.role}" class="flex items-center gap-2">
				<img
					src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png"
					alt="King Law"
					class="h-8 w-auto"
				/>
			</a>
		{:else}
			<a href="/dashboard/{user?.role}" class="mx-auto">
				<img
					src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png"
					alt="King Law"
					class="h-8 w-auto"
				/>
			</a>
		{/if}
		<button
			onclick={onToggle}
			class="p-1 rounded hover:bg-white/10 transition-colors hidden lg:block"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<ChevronRight class="w-4 h-4" />
			{:else}
				<ChevronLeft class="w-4 h-4" />
			{/if}
		</button>
	</div>

	<!-- Nav Items -->
	<nav class="flex-1 overflow-y-auto py-4 px-2">
		<ul class="space-y-1">
			{#each items as item}
				{@const active = isActive(item.href)}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
							{active
							? 'bg-gold text-king-blue'
							: 'text-white/70 hover:bg-white/10 hover:text-white'}"
						aria-label={collapsed ? item.label : undefined}
						title={collapsed ? item.label : undefined}
					>
						<item.icon class="w-5 h-5 shrink-0" />
						{#if !collapsed}
							<span>{item.label}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- User Section -->
	<div class="border-t border-white/10 px-3 py-4 shrink-0">
		{#if !collapsed}
			<div class="flex items-center gap-3 mb-3">
				<div
					class="w-8 h-8 rounded-full bg-gold text-king-blue flex items-center justify-center text-sm font-bold shrink-0"
				>
					{user?.firstName?.[0]}{user?.lastName?.[0]}
				</div>
				<div class="min-w-0">
					<p class="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
					<span
						class="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize {roleBadgeColors[
							user?.role
						] || ''}"
					>
						{user?.role}
					</span>
				</div>
			</div>
		{:else}
			<div class="flex justify-center mb-3">
				<div
					class="w-8 h-8 rounded-full bg-gold text-king-blue flex items-center justify-center text-sm font-bold"
					title="{user?.firstName} {user?.lastName}"
				>
					{user?.firstName?.[0]}{user?.lastName?.[0]}
				</div>
			</div>
		{/if}

		<button
			onclick={onLogout}
			class="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
			aria-label="Logout"
		>
			<LogOut class="w-5 h-5 shrink-0" />
			{#if !collapsed}
				<span>Logout</span>
			{/if}
		</button>
	</div>
</aside>
