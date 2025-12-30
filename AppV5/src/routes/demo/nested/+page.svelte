<script lang="ts">
	import NestedItem from '$lib/components/NestedItem.svelte';

	const sampleData = [
		{
			id: '1',
			title: 'Project Alpha',
			content: 'Main project container',
			children: [
				{
					id: '1.1',
					title: 'Documentation',
					content: 'Project documentation and guides',
					children: [
						{ id: '1.1.1', title: 'Getting Started', content: 'Quick start guide' },
						{ id: '1.1.2', title: 'API Reference', content: 'Full API documentation' },
						{
							id: '1.1.3',
							title: 'Examples',
							children: [
								{ id: '1.1.3.1', title: 'Basic Usage' },
								{ id: '1.1.3.2', title: 'Advanced Patterns' }
							]
						}
					]
				},
				{
					id: '1.2',
					title: 'Source Code',
					children: [
						{ id: '1.2.1', title: 'Components', content: 'UI components' },
						{ id: '1.2.2', title: 'Utils', content: 'Helper functions' },
						{ id: '1.2.3', title: 'Styles', content: 'CSS and themes' }
					]
				}
			]
		},
		{
			id: '2',
			title: 'Project Beta',
			content: 'Secondary project',
			children: [
				{ id: '2.1', title: 'Research', content: 'Research notes and findings' },
				{
					id: '2.2',
					title: 'Experiments',
					children: [
						{ id: '2.2.1', title: 'Experiment A' },
						{ id: '2.2.2', title: 'Experiment B' }
					]
				}
			]
		},
		{
			id: '3',
			title: 'Standalone Item',
			content: 'A leaf node with no children'
		}
	];
</script>

<div class="container">
	<header>
		<h1>Nested Items</h1>
		<p class="subtitle">Click the arrows to expand/collapse nested content</p>
	</header>

	<div class="items-container">
		{#each sampleData as item (item.id)}
			<NestedItem {item} />
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 42rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 600;
		color: #0f172a;
		margin: 0 0 0.5rem;
	}

	.subtitle {
		color: #64748b;
		font-size: 0.9375rem;
		margin: 0;
	}

	.items-container {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
</style>
