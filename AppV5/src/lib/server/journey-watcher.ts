import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';

type ChangeCallback = (event: 'add' | 'change' | 'unlink', filePath: string) => void;

class JourneyWatcher {
	private watcher: FSWatcher | null = null;
	private listeners: Set<ChangeCallback> = new Set();
	private isInitialized = false;

	/**
	 * Initialize the file watcher for the journeys directory
	 */
	init(journeysDir: string) {
		if (this.isInitialized) return;

		// Watch the entire directory and filter for .journey.md files
		this.watcher = chokidar.watch(journeysDir, {
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 300,
				pollInterval: 100
			},
			depth: 0 // Only watch the directory itself, not subdirectories
		});

		const handleEvent = (event: 'add' | 'change' | 'unlink', filePath: string) => {
			// Only process .journey.md files
			if (filePath.endsWith('.journey.md')) {
				this.notifyListeners(event, filePath);
			}
		};

		this.watcher
			.on('add', (filePath: string) => handleEvent('add', filePath))
			.on('change', (filePath: string) => handleEvent('change', filePath))
			.on('unlink', (filePath: string) => handleEvent('unlink', filePath))
			.on('error', (error: unknown) => console.error('Journey watcher error:', error));

		this.isInitialized = true;
		console.log(`[JourneyWatcher] Watching directory: ${journeysDir}`);
	}

	/**
	 * Add a listener for file changes
	 */
	addListener(callback: ChangeCallback): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	/**
	 * Notify all listeners of a file change
	 */
	private notifyListeners(event: 'add' | 'change' | 'unlink', filePath: string) {
		const fileName = path.basename(filePath);
		console.log(`[JourneyWatcher] ${event}: ${fileName}`);
		
		for (const listener of this.listeners) {
			try {
				listener(event, filePath);
			} catch (err) {
				console.error('Error in journey watcher listener:', err);
			}
		}
	}

	/**
	 * Get the number of active listeners
	 */
	get listenerCount(): number {
		return this.listeners.size;
	}

	/**
	 * Close the watcher
	 */
	async close() {
		if (this.watcher) {
			await this.watcher.close();
			this.watcher = null;
			this.isInitialized = false;
			this.listeners.clear();
		}
	}
}

// Singleton instance
export const journeyWatcher = new JourneyWatcher();

/**
 * SourceFileWatcher - Watches source files referenced in journeys
 * Used for reconciliation detection
 */
class SourceFileWatcher {
	private watcher: FSWatcher | null = null;
	private listeners: Set<ChangeCallback> = new Set();
	private watchedFiles: Set<string> = new Set();
	private isInitialized = false;

	/**
	 * Watch specific source files referenced in journeys
	 */
	watchFiles(filePaths: string[]) {
		// Close existing watcher if any
		if (this.watcher) {
			this.watcher.close();
			this.isInitialized = false;
		}

		this.watchedFiles = new Set(filePaths);

		if (filePaths.length === 0) {
			console.log('[SourceFileWatcher] No files to watch');
			return;
		}

		this.watcher = chokidar.watch(filePaths, {
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 500,
				pollInterval: 100
			}
		});

		this.watcher
			.on('change', (filePath: string) => this.notifyListeners('change', filePath))
			.on('unlink', (filePath: string) => this.notifyListeners('unlink', filePath))
			.on('error', (error: unknown) => console.error('Source watcher error:', error));

		this.isInitialized = true;
		console.log(`[SourceFileWatcher] Watching ${filePaths.length} source files`);
	}

	/**
	 * Add more files to watch
	 */
	addFiles(filePaths: string[]) {
		if (!this.watcher) {
			this.watchFiles(filePaths);
			return;
		}

		for (const filePath of filePaths) {
			if (!this.watchedFiles.has(filePath)) {
				this.watcher.add(filePath);
				this.watchedFiles.add(filePath);
			}
		}
		console.log(`[SourceFileWatcher] Added ${filePaths.length} files, now watching ${this.watchedFiles.size}`);
	}

	/**
	 * Add a listener for file changes
	 */
	addListener(callback: ChangeCallback): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	/**
	 * Notify all listeners of a file change
	 */
	private notifyListeners(event: 'change' | 'unlink', filePath: string) {
		console.log(`[SourceFileWatcher] ${event}: ${filePath}`);

		for (const listener of this.listeners) {
			try {
				listener(event, filePath);
			} catch (err) {
				console.error('Error in source watcher listener:', err);
			}
		}
	}

	/**
	 * Get the number of watched files
	 */
	get watchedFileCount(): number {
		return this.watchedFiles.size;
	}

	/**
	 * Check if a file is being watched
	 */
	isWatching(filePath: string): boolean {
		return this.watchedFiles.has(filePath);
	}

	/**
	 * Close the watcher
	 */
	async close() {
		if (this.watcher) {
			await this.watcher.close();
			this.watcher = null;
			this.isInitialized = false;
			this.watchedFiles.clear();
			this.listeners.clear();
		}
	}
}

// Singleton instance for source file watching
export const sourceFileWatcher = new SourceFileWatcher();
