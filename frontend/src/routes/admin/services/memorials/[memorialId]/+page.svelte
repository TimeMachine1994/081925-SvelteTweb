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

	// Emergency embed state
	let showEmergencyEmbed = $state(false);
	let embedCode = $state('');
	let embedTitle = $state('');
	let isCreatingEmbed = $state(false);
	

	async function handleDelete() {
		const confirmMessage = `Are you sure you want to delete "${memorial.lovedOneName}"?\n\nThis will mark it as deleted and hide it from the admin list.`;
		
		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			console.log('🗑️ [DELETE] Attempting to delete memorial:', memorial.id);
			
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'delete', 
					ids: [memorial.id], 
					resourceType: 'memorial' 
				})
			});

			const result = await response.json();
			console.log('🗑️ [DELETE] Response:', result);

			if (response.ok) {
				if (result.success && result.success.length > 0) {
					alert('Memorial deleted successfully');
					goto('/admin/services/memorials');
				} else if (result.failed && result.failed.length > 0) {
					const errorMsg = result.failed[0]?.error || 'Unknown error';
					console.error('❌ [DELETE] Failed:', errorMsg);
					alert(`Failed to delete memorial: ${errorMsg}`);
				} else {
					alert('Failed to delete memorial. Please try again.');
				}
			} else {
				const errorMsg = result.error || 'Unknown error';
				console.error('❌ [DELETE] Server error:', errorMsg);
				alert(`Failed to delete memorial: ${errorMsg}`);
			}
		} catch (error) {
			console.error('❌ [DELETE] Exception:', error);
			alert('An error occurred while deleting the memorial. Check the console for details.');
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

	async function handleDeleteStream(streamId: string, streamTitle: string) {
		const confirmMessage = `Are you sure you want to delete this livestream?\n\n"${streamTitle}"\n\nThis action cannot be undone.`;
		
		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			const response = await fetch(`/api/streams/${streamId}/delete`, {
				method: 'DELETE'
			});

			if (response.ok) {
				alert('Livestream deleted successfully');
				// Reload the page to show updated stream list
				location.reload();
			} else {
				const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
				alert(`Failed to delete livestream: ${errorData.message || 'Please try again.'}`);
			}
		} catch (error) {
			console.error('Error deleting livestream:', error);
			alert('An error occurred while deleting the livestream.');
		}
	}

	async function handleCreateEmergencyEmbed() {
		if (!embedCode.trim()) {
			alert('Please enter an embed code or iframe URL');
			return;
		}

		isCreatingEmbed = true;

		try {
			const response = await fetch(`/api/memorials/${memorial.id}/emergency-embed`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					embedCode: embedCode.trim(),
					title: embedTitle.trim() || 'Emergency Embed'
				})
			});

			if (response.ok) {
				alert('Emergency embed created successfully! It will appear on the memorial page.');
				location.reload();
			} else {
				const error = await response.json();
				alert(`Failed to create embed: ${error.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating emergency embed:', error);
			alert('An error occurred while creating the embed.');
		} finally {
			isCreatingEmbed = false;
		}
	}

	function cancelEmbedForm() {
		showEmergencyEmbed = false;
		embedCode = '';
		embedTitle = '';
	}

	async function handleRemoveEmergencyEmbed() {
		if (!confirm('Are you sure you want to remove the emergency embed? Normal streams will be displayed again.')) {
			return;
		}
		
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/emergency-embed`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.json();
				alert(`Error: ${error.message}`);
				return;
			}
			
			alert('Emergency embed removed successfully!');
			window.location.reload();
		} catch (error) {
			console.error('Error removing embed:', error);
			alert('Failed to remove emergency embed. Please try again.');
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
		<p>
			Created by 
			{#if memorial.ownerUid}
				<button 
					class="owner-link" 
					onclick={() => goto(`/admin/users/memorial-owners/${memorial.ownerUid}`)}
				>
					{memorial.creatorEmail}
				</button>
			{:else}
				{memorial.creatorEmail}
			{/if}
			 • {formatDate(memorial.createdAt)}
		</p>
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
			<div class="button-group">
				<button 
					class="switcher-btn" 
					onclick={() => goto(`/admin/services/memorials/${memorial.id}/switcher`)}
				>
					🎬 Open Video Switcher
				</button>
				<button class="create-btn" onclick={() => showStreamForm = !showStreamForm}>
					{showStreamForm ? '✖ Cancel' : '➕ Create Livestream'}
				</button>
				<button class="emergency-btn" onclick={() => showEmergencyEmbed = !showEmergencyEmbed}>
					{showEmergencyEmbed ? '✖ Cancel' : '🚨 Create Emergency Embed'}
				</button>
			</div>
		</div>

		{#if memorial.emergencyEmbed}
			<div class="emergency-embed-active">
				<div class="emergency-header">
					<h3>🚨 Active Emergency Embed</h3>
					<button class="danger-btn-small" onclick={handleRemoveEmergencyEmbed}>
						🗑️ Remove
					</button>
				</div>
				<p><strong>Title:</strong> {memorial.emergencyEmbed.title}</p>
				<p class="embed-preview"><strong>Embed Code:</strong> {memorial.emergencyEmbed.embedCode.substring(0, 100)}...</p>
				<p class="warning-text">⚠️ This embed is currently showing on the memorial page and overriding normal streams.</p>
			</div>
		{/if}

		{#if showEmergencyEmbed}
			<div class="emergency-form">
				<h3>🚨 Emergency Embed Override</h3>
				<p class="info-text">Use this to quickly embed an external stream (Vimeo, YouTube, etc.) that will appear immediately on the memorial page.</p>
				
				<div class="form-group">
					<label for="embed-title">Title (optional)</label>
					<input
						id="embed-title"
						type="text"
						bind:value={embedTitle}
						placeholder="e.g., Memorial Service Live Stream"
						disabled={isCreatingEmbed}
					/>
				</div>

				<div class="form-group">
					<label for="embed-code">Embed Code or iframe URL *</label>
					<textarea
						id="embed-code"
						bind:value={embedCode}
						placeholder='Paste full iframe embed code or just the URL. Examples:
<iframe src="https://vimeo.com/..." ...></iframe>
or
https://player.vimeo.com/video/123456789'
						rows="6"
						disabled={isCreatingEmbed}
					></textarea>
				</div>

				<div class="warning-box">
					<strong>⚠️ Warning:</strong> This will override normal streams and display immediately on the memorial page.
					Use for emergency situations only.
				</div>

				<div class="form-actions">
					<button 
						class="emergency-btn" 
						onclick={handleCreateEmergencyEmbed}
						disabled={isCreatingEmbed}
					>
						{isCreatingEmbed ? '⏳ Creating...' : '🚨 Activate Emergency Embed'}
					</button>
					<button 
						onclick={cancelEmbedForm}
						disabled={isCreatingEmbed}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

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
				<div class="stream-item">
					<StreamCard {stream} canManage={true} memorialId={memorial.id} />
					<button 
						class="delete-stream-btn" 
						onclick={() => handleDeleteStream(stream.id, stream.title)}
						title="Delete this livestream"
					>
						🗑️ Delete Stream
					</button>
				</div>
			{/each}
		</div>
	</div>

	<div class="card">
		<div class="section-header">
			<h2>🖼️ Slideshows ({slideshows.length})</h2>
		</div>
		
		{#if slideshows.length === 0}
			<p class="empty-message">No slideshows yet. Create one to commemorate {memorial.lovedOneName}.</p>
		{/if}
		
		<div class="slideshows-list">
			{#each slideshows as slideshow}
				<a 
					href="/slideshow-generator?memorialId={memorial.id}&slideshowId={slideshow.id}" 
					class="slideshow-item"
					title="Click to edit slideshow"
				>
					<div class="slideshow-info">
						<h3>{slideshow.title}</h3>
						<p>{slideshow.photos?.length || 0} photos • Status: {slideshow.status}</p>
						{#if slideshow.musicTrackTitle}
							<p class="music-info">🎵 {slideshow.musicTrackTitle}</p>
						{/if}
					</div>
					<div class="slideshow-actions">
						<span class="edit-icon">✏️ Edit</span>
					</div>
				</a>
			{/each}
		</div>
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
	button.emergency-btn { background: #e53e3e; color: white; border-color: #e53e3e; font-weight: 600; }
	button.emergency-btn:hover { background: #c53030; }
	button.switcher-btn { background: #805ad5; color: white; border-color: #805ad5; font-weight: 600; }
	button.switcher-btn:hover { background: #6b46c1; }
	button.danger-btn-small { background: #e53e3e; color: white; border-color: #e53e3e; padding: 0.375rem 0.75rem; font-size: 0.875rem; }
	button.danger-btn-small:hover { background: #c53030; }

	/* Section header */
	.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.button-group { display: flex; gap: 0.5rem; }

	/* Stream form */
	.stream-form { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; }
	.stream-form h3 { margin: 0 0 1rem 0; font-size: 1.125rem; color: #2d3748; }
	
	/* Emergency embed form */
	.emergency-form { background: #f7fafc; border: 1px solid #cbd5e0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; }
	.emergency-form h3 { margin: 0 0 0.5rem 0; font-size: 1.125rem; color: #2d3748; }
	.info-text { color: #4a5568; font-size: 0.875rem; margin-bottom: 1rem; }
	.warning-box { background: #fed7d7; border: 1px solid #fc8181; border-radius: 0.375rem; padding: 0.75rem; margin-top: 1rem; margin-bottom: 1rem; color: #742a2a; font-size: 0.875rem; }
	
	/* Active emergency embed display */
	.emergency-embed-active { background: #f7fafc; border: 1px solid #cbd5e0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
	.emergency-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
	.emergency-header h3 { margin: 0; font-size: 1rem; color: #2d3748; }
	.emergency-embed-active p { margin: 0.5rem 0; font-size: 0.875rem; color: #4a5568; }
	.embed-preview { font-family: monospace; font-size: 0.75rem; background: white; padding: 0.5rem; border-radius: 0.25rem; word-break: break-all; }
	.warning-text { font-weight: 600; color: #c53030; margin-top: 0.75rem; }
	
	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; font-size: 0.875rem; }
	.form-group input { width: 100%; padding: 0.625rem; border: 1px solid #cbd5e0; border-radius: 0.375rem; font-size: 0.875rem; }
	.form-group input:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
	.form-group input:disabled { background: #edf2f7; cursor: not-allowed; }
	.form-group textarea { width: 100%; padding: 0.625rem; border: 1px solid #cbd5e0; border-radius: 0.375rem; font-size: 0.875rem; font-family: monospace; resize: vertical; }
	.form-group textarea:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
	.form-group textarea:disabled { background: #edf2f7; cursor: not-allowed; }
	
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	
	.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
	.form-actions button { flex: 0 0 auto; }

	.empty-message { color: #718096; font-style: italic; padding: 1rem 0; }
	
	.streams-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
	
	/* Stream item with delete button */
	.stream-item { 
		position: relative; 
		border: 1px solid #e2e8f0; 
		border-radius: 0.5rem; 
		padding: 1rem; 
		background: white; 
	}
	
	.delete-stream-btn { 
		position: absolute; 
		top: 1rem; 
		right: 1rem; 
		padding: 0.5rem 0.75rem; 
		background: #e53e3e; 
		color: white; 
		border: 1px solid #c53030; 
		border-radius: 0.375rem; 
		font-size: 0.875rem; 
		cursor: pointer; 
		transition: all 0.2s; 
		z-index: 10;
	}
	
	.delete-stream-btn:hover { 
		background: #c53030; 
		transform: translateY(-1px); 
		box-shadow: 0 2px 4px rgba(197, 48, 48, 0.2); 
	}
	
	.delete-stream-btn:active { 
		transform: translateY(0); 
	}
	
	/* Slideshows list */
	.slideshows-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	
	.slideshow-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		cursor: pointer;
	}
	
	.slideshow-item:hover {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateX(4px);
		box-shadow: 0 2px 8px rgba(213, 186, 127, 0.2);
	}
	
	.slideshow-info {
		flex: 1;
	}
	
	.slideshow-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #2d3748;
	}
	
	.slideshow-info p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #718096;
	}
	
	.music-info {
		color: #D5BA7F;
		font-weight: 500;
	}
	
	.slideshow-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.edit-icon {
		color: #3182ce;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
	}
	
	.slideshow-item:hover .edit-icon {
		color: #2c5282;
	}
	
	.form-group select {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}
	
	.form-group select:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}
	
	.form-group select:disabled {
		background: #edf2f7;
		cursor: not-allowed;
	}
	
	/* Edit button */
	button.edit-btn-small {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
	
	button.edit-btn-small:hover {
		background: #2c5282;
	}
	
	/* Modal styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}
	
	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}
	
	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #2d3748;
	}
	
	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #718096;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		line-height: 1;
		transition: color 0.2s;
	}
	
	.close-btn:hover {
		color: #2d3748;
		background: none;
	}
	
	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.info-section {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.info-section p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: #2d3748;
	}
	
	.info-section p:first-child {
		margin-top: 0;
	}
	
	.info-section p:last-child {
		margin-bottom: 0;
	}
	
	.code-section {
		margin-top: 1.5rem;
	}
	
	.code-section label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #4a5568;
	}
	
	.code-textarea {
		width: 100%;
		min-height: 200px;
		padding: 0.75rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
		font-size: 0.8125rem;
		line-height: 1.5;
		background: #f7fafc;
		color: #2d3748;
		resize: vertical;
	}
	
	.code-textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
		background: white;
	}
	
	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}
	
	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}
	
	button.secondary-btn {
		background: #718096;
		color: white;
		border-color: #718096;
		padding: 0.5rem 1.5rem;
	}
	
	button.secondary-btn:hover {
		background: #4a5568;
	}

	/* Clickable owner link styling */
	button.owner-link {
		background: none;
		border: none;
		color: #d5ba7f;
		text-decoration: none;
		cursor: pointer;
		font: inherit;
		padding: 0;
		margin: 0;
		transition: all 0.2s ease;
		font-weight: 600;
	}

	button.owner-link:hover {
		text-decoration: underline;
		color: #c4a76e;
		background: none;
	}
</style>
