<script lang="ts">
	import { Icon } from '$lib/components';
	import { faFolderOpen, faUpload, faEnvelope } from '@fortawesome/free-solid-svg-icons';
	
	interface Props {
		onUploadClick: () => void;
		userRole: 'client' | 'lawyer' | 'admin';
	}
	
	let { onUploadClick, userRole }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center p-12 bg-secondary rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
	<Icon icon={faFolderOpen} size="3x" class="text-muted-foreground mb-4" />
	
	<h3 class="font-title text-xl font-bold mb-2">No Documents Yet</h3>
	
	<p class="text-muted-foreground text-center mb-6 max-w-md">
		{#if userRole === 'client'}
			Upload documents for your case or receive them from your attorney
		{:else}
			Upload documents for your client or share them via messages
		{/if}
	</p>
	
	<div class="flex flex-col sm:flex-row gap-3">
		<button
			onclick={onUploadClick}
			class="flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
		>
			<Icon icon={faUpload} />
			Upload Documents
		</button>
		
		{#if userRole === 'client'}
			<button
				class="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-secondary transition-colors"
			>
				<Icon icon={faEnvelope} />
				Request Documents
			</button>
		{/if}
	</div>
	
	<p class="text-xs text-muted-foreground mt-4">
		Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 50MB)
	</p>
</div>
