<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';
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

	// Stream creation state
	let showStreamForm = $state(false);
	let streamTitle = $state('');
	let streamDate = $state('');
	let streamTime = $state('');
	let isCreatingStream = $state(false);

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

	async function handleCreateStream() {
		if (!streamTitle.trim()) {
			alert('Please enter a stream title');
			return;
		}

		if (!streamDate || !streamTime) {
			alert('Please select a date and time');
			return;
		}

		isCreatingStream = true;

		try {
			// Combine date and time into ISO format
			const scheduledStartTime = `${streamDate}T${streamTime}:00`;

			const response = await fetch(`/api/memorials/${memorial.id}/streams`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: streamTitle,
					scheduledStartTime,
					description: ''
				})
			});

			if (response.ok) {
				alert('Stream created successfully!');
				// Reload the page to show the new stream
				location.reload();
			} else {
				const error = await response.json();
				alert(`Failed to create stream: ${error.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating stream:', error);
			alert('An error occurred while creating the stream.');
		} finally {
			isCreatingStream = false;
		}
	}

	function cancelStreamForm() {
		showStreamForm = false;
		streamTitle = '';
		streamDate = '';
		streamTime = '';
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
		<div class="section-header">
			<h2>📹 Livestreams ({streams.length})</h2>
			<button class="create-btn" onclick={() => showStreamForm = !showStreamForm}>
				{showStreamForm ? '✖ Cancel' : '➕ Create Livestream'}
			</button>
		</div>

		{#if showStreamForm}
			<div class="stream-form">
				<h3>Create New Livestream</h3>
				<div class="form-group">
					<label for="stream-title">Title *</label>
					<input
						id="stream-title"
						type="text"
						bind:value={streamTitle}
						placeholder="Enter stream title (e.g., Memorial Service for {memorial.lovedOneName})"
						disabled={isCreatingStream}
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="stream-date">Date *</label>
						<input
							id="stream-date"
							type="date"
							bind:value={streamDate}
							disabled={isCreatingStream}
						/>
					</div>

					<div class="form-group">
						<label for="stream-time">Time *</label>
						<input
							id="stream-time"
							type="time"
							bind:value={streamTime}
							disabled={isCreatingStream}
						/>
					</div>
				</div>

				<div class="form-actions">
					<button 
						class="primary-btn" 
						onclick={handleCreateStream}
						disabled={isCreatingStream}
					>
						{isCreatingStream ? '⏳ Creating...' : '📅 Schedule Stream'}
					</button>
					<button 
						onclick={cancelStreamForm}
						disabled={isCreatingStream}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		{#if streams.length === 0 && !showStreamForm}
			<p class="empty-message">No livestreams yet. Click "Create Livestream" to add one.</p>
		{/if}

		<div class="streams-grid">
			{#each streams as stream}
				<StreamCard {stream} canManage={true} memorialId={memorial.id} />
			{/each}
		</div>
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
	
	/* Buttons */
	button { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; cursor: pointer; transition: all 0.2s; }
	button:hover { background: #f7fafc; }
	button:disabled { opacity: 0.5; cursor: not-allowed; }
	button.danger-btn { background: #e53e3e; color: white; border-color: #e53e3e; }
	button.danger-btn:hover { background: #c53030; }
	button.create-btn { background: #3182ce; color: white; border-color: #3182ce; }
	button.create-btn:hover { background: #2c5282; }
	button.primary-btn { background: #3182ce; color: white; border-color: #3182ce; font-weight: 600; }
	button.primary-btn:hover { background: #2c5282; }

	/* Section header */
	.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

	/* Stream form */
	.stream-form { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; }
	.stream-form h3 { margin: 0 0 1rem 0; font-size: 1.125rem; color: #2d3748; }
	
	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; font-size: 0.875rem; }
	.form-group input { width: 100%; padding: 0.625rem; border: 1px solid #cbd5e0; border-radius: 0.375rem; font-size: 0.875rem; }
	.form-group input:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
	.form-group input:disabled { background: #edf2f7; cursor: not-allowed; }
	
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	
	.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
	.form-actions button { flex: 0 0 auto; }

	.empty-message { color: #718096; font-style: italic; padding: 1rem 0; }
	
	.streams-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
</style>
