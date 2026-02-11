<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { User, Mail, Shield, Calendar } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
</script>

<div class="max-w-2xl">
	<h1 class="font-title text-4xl mb-8">Profile</h1>

	<div class="bg-background border border-border rounded-lg overflow-hidden">
		<!-- Avatar + Name Header -->
		<div class="bg-king-blue p-8 flex items-center gap-5">
			<div class="w-16 h-16 rounded-full bg-gold text-king-blue flex items-center justify-center text-2xl font-bold shrink-0">
				{authStore.user?.firstName?.[0]}{authStore.user?.lastName?.[0]}
			</div>
			<div class="text-white">
				<h2 class="text-2xl font-bold">{authStore.user?.firstName} {authStore.user?.lastName}</h2>
				<Badge variant={authStore.user?.role} class="mt-1" />
			</div>
		</div>

		<!-- Details -->
		<div class="divide-y divide-border">
			<div class="flex items-center gap-4 px-6 py-4">
				<User class="w-5 h-5 text-muted-foreground shrink-0" />
				<div>
					<p class="text-xs text-muted-foreground">Full Name</p>
					<p class="text-sm font-medium">{authStore.user?.firstName} {authStore.user?.lastName}</p>
				</div>
			</div>
			<div class="flex items-center gap-4 px-6 py-4">
				<Mail class="w-5 h-5 text-muted-foreground shrink-0" />
				<div>
					<p class="text-xs text-muted-foreground">Email</p>
					<p class="text-sm font-medium">{authStore.user?.email}</p>
				</div>
			</div>
			<div class="flex items-center gap-4 px-6 py-4">
				<Shield class="w-5 h-5 text-muted-foreground shrink-0" />
				<div>
					<p class="text-xs text-muted-foreground">Role</p>
					<p class="text-sm font-medium capitalize">{authStore.user?.role}</p>
				</div>
			</div>
		</div>

		<!-- Placeholder for future edit functionality -->
		<div class="px-6 py-4 bg-muted/30 border-t border-border text-center">
			<p class="text-sm text-muted-foreground">Profile editing coming soon</p>
		</div>
	</div>
</div>
