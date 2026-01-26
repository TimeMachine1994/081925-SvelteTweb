<script lang="ts">
	import type { MemorialBlock } from '$lib/types/memorial-blocks';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import BlockItem from './BlockItem.svelte';

	interface Props {
		blocks: MemorialBlock[];
		streams: any[];
		findStream: (streamId: string) => any;
		onReorder: (newOrder: string[]) => void;
		onEdit: (block: MemorialBlock) => void;
		onToggle: (blockId: string, enabled: boolean) => void;
		onDelete: (blockId: string) => void;
	}

	let { blocks, streams, findStream, onReorder, onEdit, onToggle, onDelete }: Props = $props();

	// Local copy for drag operations
	let items = $state<MemorialBlock[]>([]);

	// Sync items with blocks prop
	$effect(() => {
		items = [...blocks];
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: MemorialBlock[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: MemorialBlock[] }>) {
		items = e.detail.items;
		// Emit new order
		onReorder(items.map(b => b.id));
	}
</script>

<div
	class="block-list"
	use:dndzone={{ items, flipDurationMs, dropTargetStyle: { outline: '2px dashed #d5ba7f' } }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each items as block (block.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="block-wrapper">
			<BlockItem
				{block}
				stream={block.type === 'livestream' ? findStream((block.config as any).streamId) : null}
				onEdit={() => onEdit(block)}
				onToggle={(enabled) => onToggle(block.id, enabled)}
				onDelete={() => onDelete(block.id)}
			/>
		</div>
	{/each}
</div>

<style>
	.block-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 100px;
	}

	.block-wrapper {
		/* Needed for drag animation */
	}
</style>
