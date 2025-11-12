<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';
	
	let { data } = $props();
	const { memorial, streams, slideshows, followerCount } = data;

	function formatDate(isoString: string | null) {
		if (!isoString) return 'N/A';
		return new Date(isoString).toLocaleString();
	}

	function formatRelativeTime(isoString: string | null) {
		if (!isoString) return '';
		const date = new Date(isoString);
		const diffMs = Date.now() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	}

	const publicUrl = memorial.fullSlug ? `https://tributestream.com/${memorial.fullSlug}` : '';

	async function handleDelete() {
		const confirmMessage = `Are you sure you want to delete "${memorial.lovedOneName}"?\n\nThis will mark it as deleted and hide it from the admin list.`;
		
		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'delete', 
					ids: [memorial.id], 
					resourceType: 'memorial' 
				})
			});

			if (response.ok) {
				alert('Memorial deleted successfully');
				goto('/admin/services/memorials');
			} else {
				alert('Failed to delete memorial. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting memorial:', error);
			alert('An error occurred while deleting the memorial.');
		}
	}
</script>

<AdminLayout title="Memorial Details" subtitle="View and manage all aspects of this memorial">
	<div class="header-actions">
		<button onclick={() => goto('/admin/services/memorials')}>← Back</button>
		<div>
			<button class="danger-btn" onclick={handleDelete}>🗑️ Delete</button>
		</div>
	</div>

	<div class="card">
		<h1>💝 {memorial.lovedOneName}</h1>
		<p>{publicUrl}</p>
		<p>Created by {memorial.creatorEmail} • {formatDate(memorial.createdAt)}</p>
		<div class="badges">
			<span class:complete={memorial.isComplete}>{memorial.isComplete ? '✅ Complete' : '⚠️ Incomplete'}</span>
			<span class:paid={memorial.isPaid}>{memorial.isPaid ? '✅ Paid' : `❌ Unpaid ($${memorial.totalPrice})`}</span>
			<span>{memorial.isPublic ? '👁️ Public' : '🔒 Private'}</span>
		</div>
	</div>

	<div class="card">
		<h2>📋 Basic Information</h2>
		<div class="grid">
			<div><strong>ID:</strong> {memorial.id}</div>
			<div><strong>Loved One:</strong> {memorial.lovedOneName}</div>
			<div><strong>Slug:</strong> {memorial.fullSlug}</div>
			<div><strong>Created:</strong> {formatDate(memorial.createdAt)}</div>
			<div><strong>Updated:</strong> {formatDate(memorial.updatedAt)} ({formatRelativeTime(memorial.updatedAt)})</div>
		</div>
	</div>

	<div class="card">
		<h2>📹 Livestreams ({streams.length})</h2>
		{#each streams as stream}
			<div class="item">
				<h3>{stream.title}</h3>
				<p>Status: {stream.status} {#if stream.status === 'live'}({stream.viewerCount} viewers){/if}</p>
				{#if stream.scheduledStartTime}<p>Scheduled: {formatDate(stream.scheduledStartTime)}</p>{/if}
				{#if stream.rtmpUrl}<p>RTMP: {stream.rtmpUrl}</p>{/if}
			</div>
		{/each}
	</div>

	<div class="card">
		<h2>🖼️ Slideshows ({slideshows.length})</h2>
		{#each slideshows as slideshow}
			<div class="item">
				<h3>{slideshow.title}</h3>
				<p>{slideshow.photos?.length || 0} photos • Status: {slideshow.status}</p>
			</div>
		{/each}
	</div>

	<div class="card">
		<h2>💳 Payment</h2>
		<p>Status: {memorial.isPaid ? '✅ Paid' : '❌ Unpaid'}</p>
		<p>Amount: ${memorial.totalPrice}</p>
	</div>

	<div class="card">
		<h2>📊 Analytics</h2>
		<div class="stats">
			<div><strong>{streams.length}</strong> Streams</div>
			<div><strong>{slideshows.length}</strong> Slideshows</div>
			<div><strong>{followerCount}</strong> Followers</div>
		</div>
	</div>
</AdminLayout>

<style>
	.header-actions { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
	.card { background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
	h1 { font-size: 2rem; margin: 0 0 0.5rem 0; }
	h2 { font-size: 1.25rem; margin: 0 0 1rem 0; }
	h3 { font-size: 1.125rem; margin: 0 0 0.5rem 0; }
	.badges { display: flex; gap: 0.5rem; margin-top: 1rem; }
	.badges span { padding: 0.375rem 0.75rem; border-radius: 0.25rem; background: #e2e8f0; font-size: 0.8125rem; }
	.badges .complete { background: #c6f6d5; color: #22543d; }
	.badges .paid { background: #c6f6d5; color: #22543d; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
	.item { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.375rem; margin-bottom: 0.75rem; }
	.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center; }
	button { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; cursor: pointer; }
	button:hover { background: #f7fafc; }
	button.danger-btn { background: #e53e3e; color: white; border-color: #e53e3e; }
	button.danger-btn:hover { background: #c53030; }
</style>
