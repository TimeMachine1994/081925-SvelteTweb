<script lang="ts">
	import { Icon } from '$lib/components';
	import { faFile, faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
	
	interface UploadingFile {
		id: string;
		file: File;
		progress: number;
		status: 'uploading' | 'success' | 'error';
		error?: string;
		speed?: number;
		timeRemaining?: number;
	}
	
	interface Props {
		files: UploadingFile[];
		onCancel?: (id: string) => void;
	}
	
	let { files = [], onCancel }: Props = $props();
	
	const overallProgress = $derived(() => {
		if (files.length === 0) return 0;
		const total = files.reduce((sum, f) => sum + f.progress, 0);
		return Math.round(total / files.length);
	});
	
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
	
	function formatSpeed(bytesPerSecond: number): string {
		if (bytesPerSecond < 1024) return bytesPerSecond.toFixed(0) + ' B/s';
		if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
		return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
	}
	
	function formatTime(seconds: number): string {
		if (seconds < 60) return Math.round(seconds) + 's';
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

{#if files.length > 0}
	<div class="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-background border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
		<!-- Header -->
		<div class="flex items-center justify-between mb-3">
			<h3 class="font-semibold text-sm">
				Uploading {files.length} {files.length === 1 ? 'file' : 'files'}
			</h3>
			<div class="text-sm text-muted-foreground">
				{overallProgress()}%
			</div>
		</div>
		
		<!-- Overall Progress Bar -->
		<div class="mb-4">
			<div class="h-2 bg-secondary rounded-full overflow-hidden">
				<div
					class="h-full bg-gold transition-all duration-300"
					style="width: {overallProgress()}%"
				></div>
			</div>
		</div>
		
		<!-- File List -->
		<div class="space-y-3 max-h-64 overflow-y-auto">
			{#each files as uploadFile}
				<div class="flex items-start gap-3">
					<!-- Icon -->
					<div class="mt-1">
						{#if uploadFile.status === 'uploading'}
							<Icon icon={faSpinner} class="text-gold animate-spin" />
						{:else if uploadFile.status === 'success'}
							<Icon icon={faCheck} class="text-green-600 dark:text-green-400" />
						{:else}
							<Icon icon={faTimes} class="text-red-600 dark:text-red-400" />
						{/if}
					</div>
					
					<!-- File Info -->
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium truncate">{uploadFile.file.name}</div>
						<div class="text-xs text-muted-foreground">
							{formatFileSize(uploadFile.file.size)}
						</div>
						
						<!-- Progress Bar for Individual File -->
						{#if uploadFile.status === 'uploading'}
							<div class="mt-1">
								<div class="h-1 bg-secondary rounded-full overflow-hidden">
									<div
										class="h-full bg-gold transition-all duration-300"
										style="width: {uploadFile.progress}%"
									></div>
								</div>
								<div class="flex items-center justify-between mt-1 text-xs text-muted-foreground">
									<span>{uploadFile.progress}%</span>
									{#if uploadFile.speed}
										<span>{formatSpeed(uploadFile.speed)}</span>
									{/if}
									{#if uploadFile.timeRemaining}
										<span>{formatTime(uploadFile.timeRemaining)} left</span>
									{/if}
								</div>
							</div>
						{:else if uploadFile.status === 'success'}
							<div class="text-xs text-green-600 dark:text-green-400 mt-1">
								Upload complete
							</div>
						{:else if uploadFile.status === 'error'}
							<div class="text-xs text-red-600 dark:text-red-400 mt-1">
								{uploadFile.error || 'Upload failed'}
							</div>
						{/if}
					</div>
					
					<!-- Cancel Button -->
					{#if uploadFile.status === 'uploading' && onCancel}
						<button
							onclick={() => onCancel?.(uploadFile.id)}
							class="p-1 hover:bg-secondary rounded transition-colors"
							title="Cancel upload"
						>
							<Icon icon={faTimes} class="text-sm" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
