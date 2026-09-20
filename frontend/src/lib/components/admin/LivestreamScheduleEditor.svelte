<script lang="ts">
	// Minimal shape needed here (the page's `streams` data doesn't always carry
	// every field required by the full `Stream` type, e.g. `createdBy`).
	interface ScheduleStream {
		id: string;
		title: string;
		status: string;
		scheduledStartTime?: string | null;
	}

	interface Props {
		streams: ScheduleStream[];
	}

	let { streams }: Props = $props();

	// Per-stream datetime-local input value, keyed by stream id
	let editedTimes = $state<Record<string, string>>(
		Object.fromEntries(streams.map((s) => [s.id, toLocalInputValue(s.scheduledStartTime)]))
	);

	let savingId = $state<string | null>(null);
	let errorId = $state<string | null>(null);
	let errorMessage = $state('');

	function toLocalInputValue(isoString: string | null | undefined): string {
		if (!isoString) return '';
		const date = new Date(isoString);
		if (isNaN(date.getTime())) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function statusLabel(status: string) {
		switch (status) {
			case 'live':
				return '🔴 Live';
			case 'scheduled':
				return '📅 Scheduled';
			case 'completed':
			case 'ended':
				return '✅ Ended';
			default:
				return '⚪ Ready';
		}
	}

	async function saveTime(stream: ScheduleStream) {
		const value = editedTimes[stream.id];
		if (!value) {
			errorId = stream.id;
			errorMessage = 'Please select a date and time';
			return;
		}

		savingId = stream.id;
		errorId = null;
		try {
			const response = await fetch(`/api/streams/${stream.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduledStartTime: new Date(value).toISOString() })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || 'Failed to save start time');
			}

			// Full reload so every consumer of `streams` on this page (StreamCard,
			// the block editor, etc.) picks up the change consistently.
			window.location.reload();
		} catch (err) {
			errorId = stream.id;
			errorMessage = err instanceof Error ? err.message : 'Failed to save start time';
		} finally {
			savingId = null;
		}
	}

	async function clearTime(stream: ScheduleStream) {
		if (!confirm(`Clear the scheduled start time for "${stream.title}"?`)) return;

		savingId = stream.id;
		errorId = null;
		try {
			const response = await fetch(`/api/streams/${stream.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduledStartTime: null })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || 'Failed to clear start time');
			}

			window.location.reload();
		} catch (err) {
			errorId = stream.id;
			errorMessage = err instanceof Error ? err.message : 'Failed to clear start time';
		} finally {
			savingId = null;
		}
	}
</script>

<div class="card">
	<div class="section-header">
		<h2>🎬 Livestream Start Time</h2>
		<p class="section-subtitle">
			Controls the countdown shown to visitors and when the page auto-switches to the live video player.
		</p>
	</div>

	{#if streams.length === 0}
		<p class="empty-message">
			No livestreams yet. Add one from
			<a href="#memorial-content">Memorial Content</a> below to set a start time.
		</p>
	{:else}
		<div class="rows">
			{#each streams as stream (stream.id)}
				<div class="row">
					<div class="row-info">
						<span class="row-title">{stream.title}</span>
						<span class="row-status">{statusLabel(stream.status)}</span>
					</div>
					<div class="row-controls">
						<input
							type="datetime-local"
							bind:value={editedTimes[stream.id]}
							disabled={savingId === stream.id}
						/>
						<button
							class="save-btn"
							onclick={() => saveTime(stream)}
							disabled={savingId === stream.id}
						>
							{savingId === stream.id ? 'Saving...' : 'Save'}
						</button>
						{#if stream.scheduledStartTime}
							<button
								class="clear-btn"
								onclick={() => clearTime(stream)}
								disabled={savingId === stream.id}
							>
								Clear
							</button>
						{/if}
					</div>
					{#if errorId === stream.id}
						<p class="row-error">{errorMessage}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card { background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
	h2 { font-size: 1.25rem; margin: 0 0 0.25rem 0; }
	.section-header { margin-bottom: 1rem; }
	.section-subtitle { margin: 0; font-size: 0.875rem; color: #718096; }
	.empty-message { color: #718096; font-style: italic; padding: 0.5rem 0; }
	.empty-message a { color: #3182ce; }

	.rows { display: flex; flex-direction: column; gap: 1rem; }
	.row { border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.875rem 1rem; }
	.row-info { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.625rem; }
	.row-title { font-weight: 600; color: #2d3748; }
	.row-status { font-size: 0.8125rem; color: #718096; }
	.row-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
	.row-controls input[type='datetime-local'] {
		padding: 0.5rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}
	.save-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #3182ce;
		border-radius: 0.375rem;
		background: #3182ce;
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.save-btn:hover { background: #2c5282; }
	.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.clear-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		background: white;
		color: #c53030;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.clear-btn:hover { background: #fff5f5; }
	.clear-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.row-error { margin: 0.5rem 0 0 0; font-size: 0.8125rem; color: #c53030; }
</style>
