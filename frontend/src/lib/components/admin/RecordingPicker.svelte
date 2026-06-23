<script lang="ts">
	/**
	 * RecordingPicker
	 *
	 * Admin tool to choose which Mux recording(s) of each stream are published on
	 * the public memorial page, and in what order. Persists to
	 * `mux.publishedRecordings` via the admin recordings API.
	 */

	interface Recording {
		assetId: string;
		vodPlaybackId: string;
		duration?: number;
		createdAt: string;
	}

	interface Stream {
		id: string;
		title?: string;
		status?: string;
		mux?: {
			recordings?: Recording[];
			vodPlaybackId?: string | null;
			publishedRecordings?: string[];
		} | null;
	}

	let {
		memorialId,
		streams = [],
		onSaved
	}: { memorialId: string; streams: Stream[]; onSaved?: () => void } = $props();

	// Only streams that actually have recordings are pickable
	const recordedStreams = $derived(
		streams.filter((s) => (s.mux?.recordings?.length ?? 0) > 0 || !!s.mux?.vodPlaybackId)
	);

	function recordingsOf(stream: Stream): Recording[] {
		const recs = stream.mux?.recordings ?? [];
		if (recs.length) return recs;
		if (stream.mux?.vodPlaybackId) {
			return [{ assetId: '', vodPlaybackId: stream.mux.vodPlaybackId, createdAt: '' }];
		}
		return [];
	}

	// Per-stream ordered selection of vodPlaybackIds.
	// Default to the stream's saved selection, else the latest recording (matches player fallback).
	function initialSelection(stream: Stream): string[] {
		const saved = stream.mux?.publishedRecordings ?? [];
		if (saved.length) return [...saved];
		const recs = recordingsOf(stream);
		return recs.length ? [recs[recs.length - 1].vodPlaybackId] : [];
	}

	let selections = $state<Record<string, string[]>>(
		Object.fromEntries(streams.map((s) => [s.id, initialSelection(s)]))
	);
	let savingStreamId = $state<string | null>(null);
	let messages = $state<Record<string, { type: 'success' | 'error'; text: string }>>({});

	function isSelected(streamId: string, vodId: string): boolean {
		return (selections[streamId] ?? []).includes(vodId);
	}

	function toggle(streamId: string, vodId: string) {
		const current = selections[streamId] ?? [];
		selections[streamId] = current.includes(vodId)
			? current.filter((id) => id !== vodId)
			: [...current, vodId];
	}

	function move(streamId: string, vodId: string, dir: -1 | 1) {
		const current = [...(selections[streamId] ?? [])];
		const idx = current.indexOf(vodId);
		const next = idx + dir;
		if (idx < 0 || next < 0 || next >= current.length) return;
		[current[idx], current[next]] = [current[next], current[idx]];
		selections[streamId] = current;
	}

	function orderOf(streamId: string, vodId: string): number {
		return (selections[streamId] ?? []).indexOf(vodId);
	}

	function thumbnailUrl(vodId: string): string {
		return `https://image.mux.com/${vodId}/thumbnail.png?width=320&time=1`;
	}

	function formatDuration(seconds?: number): string {
		if (!seconds && seconds !== 0) return '';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}m ${s}s`;
	}

	function formatDate(iso: string): string {
		if (!iso) return '';
		const d = new Date(iso);
		return isNaN(d.getTime()) ? '' : d.toLocaleString();
	}

	async function save(stream: Stream) {
		savingStreamId = stream.id;
		messages = { ...messages, [stream.id]: undefined as never };
		try {
			const res = await fetch(
				`/api/admin/memorials/${memorialId}/streams/${stream.id}/recordings`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ publishedRecordings: selections[stream.id] ?? [] })
				}
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || `Failed (${res.status})`);
			}
			messages = {
				...messages,
				[stream.id]: { type: 'success', text: 'Saved. Viewers will refresh automatically.' }
			};
			onSaved?.();
		} catch (err) {
			messages = {
				...messages,
				[stream.id]: { type: 'error', text: err instanceof Error ? err.message : 'Save failed' }
			};
		} finally {
			savingStreamId = null;
		}
	}
</script>

<div class="recording-picker">
	{#if recordedStreams.length === 0}
		<p class="empty">No recordings available yet. Recordings appear here after a stream ends and Mux finishes processing.</p>
	{:else}
		{#each recordedStreams as stream (stream.id)}
			{@const recs = recordingsOf(stream)}
			<div class="stream-block">
				<div class="stream-head">
					<h3>{stream.title || 'Untitled Stream'}</h3>
					<span class="count">{(selections[stream.id] ?? []).length} of {recs.length} published</span>
				</div>

				<div class="recordings">
					{#each recs as rec, i (rec.vodPlaybackId)}
						{@const order = orderOf(stream.id, rec.vodPlaybackId)}
						<div class="recording {order >= 0 ? 'selected' : ''}">
							<label class="select">
								<input
									type="checkbox"
									checked={isSelected(stream.id, rec.vodPlaybackId)}
									onchange={() => toggle(stream.id, rec.vodPlaybackId)}
								/>
								{#if order >= 0}
									<span class="order-badge">{order + 1}</span>
								{/if}
							</label>

							<img class="thumb" src={thumbnailUrl(rec.vodPlaybackId)} alt="Recording {i + 1} preview" loading="lazy" />

							<div class="meta">
								<div class="meta-title">Session {i + 1}</div>
								<div class="meta-line">{formatDuration(rec.duration)}</div>
								<div class="meta-line muted">{formatDate(rec.createdAt)}</div>
								<div class="meta-line id">{rec.vodPlaybackId}</div>
							</div>

							{#if order >= 0}
								<div class="reorder">
									<button type="button" title="Move up" disabled={order === 0} onclick={() => move(stream.id, rec.vodPlaybackId, -1)}>↑</button>
									<button type="button" title="Move down" disabled={order === (selections[stream.id]?.length ?? 0) - 1} onclick={() => move(stream.id, rec.vodPlaybackId, 1)}>↓</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if messages[stream.id]}
					<div class="msg {messages[stream.id].type}">{messages[stream.id].text}</div>
				{/if}

				<div class="actions">
					<button
						class="save-btn"
						onclick={() => save(stream)}
						disabled={savingStreamId === stream.id}
					>
						{savingStreamId === stream.id ? 'Saving…' : 'Save published recordings'}
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.recording-picker {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.empty {
		color: #718096;
		font-style: italic;
	}

	.stream-block {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f8fafc;
	}

	.stream-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.stream-head h3 {
		margin: 0;
		font-size: 1.05rem;
		color: #1a202c;
	}

	.count {
		font-size: 0.8rem;
		color: #718096;
	}

	.recordings {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.recording {
		display: grid;
		grid-template-columns: auto 160px 1fr auto;
		align-items: center;
		gap: 0.85rem;
		padding: 0.6rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.recording.selected {
		border-color: #d5ba7f;
		box-shadow: 0 0 0 1px #d5ba7f33;
	}

	.select {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
	}

	.order-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.4rem;
		height: 1.4rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: #d5ba7f;
		color: #1a202c;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.thumb {
		width: 160px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 0.375rem;
		background: #1a202c;
	}

	.meta {
		min-width: 0;
	}

	.meta-title {
		font-weight: 600;
		color: #2d3748;
	}

	.meta-line {
		font-size: 0.8rem;
		color: #4a5568;
	}

	.meta-line.muted {
		color: #a0aec0;
	}

	.meta-line.id {
		font-family: monospace;
		font-size: 0.7rem;
		color: #a0aec0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reorder {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.reorder button {
		width: 1.8rem;
		height: 1.8rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.reorder button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.actions {
		margin-top: 0.85rem;
	}

	.save-btn {
		background: #d5ba7f;
		color: #1a202c;
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.msg {
		margin-top: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
	}

	.msg.success {
		background: #ecfdf5;
		color: #047857;
	}

	.msg.error {
		background: #fef2f2;
		color: #b91c1c;
	}

	@media (max-width: 640px) {
		.recording {
			grid-template-columns: auto 1fr;
			grid-template-areas:
				'select meta'
				'thumb thumb'
				'reorder reorder';
		}
		.thumb {
			width: 100%;
		}
	}
</style>
