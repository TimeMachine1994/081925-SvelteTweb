import { readdir, stat, access } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import type { NestedItemData, ScanResult } from '$lib/types/journey';
import { parseMetadataFile, getFolderMetaPath } from './metadata-parser';

const IGNORED_PATTERNS = [
	'node_modules',
	'.git',
	'.svelte-kit',
	'dist',
	'build',
	'.DS_Store',
	'thumbs.db'
];

function shouldIgnore(name: string): boolean {
	if (name.endsWith('.meta.md')) return true;
	if (name.endsWith('.journey.md')) return true;
	return IGNORED_PATTERNS.some(
		(pattern) => name === pattern || name.startsWith('.')
	);
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function scanDirectory(
	dirPath: string,
	stats: { files: number; folders: number; markdownFiles: number }
): Promise<NestedItemData[]> {
	const entries = await readdir(dirPath, { withFileTypes: true });
	const items: NestedItemData[] = [];

	const sortedEntries = entries.sort((a, b) => {
		if (a.isDirectory() && !b.isDirectory()) return -1;
		if (!a.isDirectory() && b.isDirectory()) return 1;
		return a.name.localeCompare(b.name);
	});

	for (const entry of sortedEntries) {
		if (shouldIgnore(entry.name)) continue;

		const fullPath = join(dirPath, entry.name);
		const ext = extname(entry.name).slice(1);

		if (entry.isDirectory()) {
			stats.folders++;
			const children = await scanDirectory(fullPath, stats);

			const folderMetaPath = getFolderMetaPath(fullPath);
			let folderMetadata;
			if (await fileExists(folderMetaPath)) {
				folderMetadata = await parseMetadataFile(folderMetaPath);
				stats.markdownFiles++;
			}

			items.push({
				id: fullPath,
				title: entry.name,
				type: 'folder',
				path: fullPath,
				children: children.length > 0 ? children : undefined,
				metadata: folderMetadata || undefined,
				content: folderMetadata?.description || folderMetadata?.body?.slice(0, 100) || undefined
			});
		} else {
			stats.files++;
			if (ext === 'md') stats.markdownFiles++;

			const metaPath = fullPath.replace(/\.[^.]+$/, '.meta.md');
			let fileMetadata;
			if (await fileExists(metaPath)) {
				fileMetadata = await parseMetadataFile(metaPath);
			}

			items.push({
				id: fullPath,
				title: entry.name,
				type: 'file',
				path: fullPath,
				extension: ext || undefined,
				content: fileMetadata?.description || fileMetadata?.body?.slice(0, 100) || getFileTypeLabel(ext),
				metadata: fileMetadata || undefined
			});
		}
	}

	return items;
}

function getFileTypeLabel(ext: string): string {
	const labels: Record<string, string> = {
		svelte: 'Svelte Component',
		ts: 'TypeScript',
		js: 'JavaScript',
		md: 'Markdown',
		json: 'JSON Config',
		css: 'Stylesheet',
		html: 'HTML'
	};
	return labels[ext] || ext.toUpperCase();
}

export async function scanPath(rootPath: string): Promise<ScanResult> {
	const statInfo = await stat(rootPath);
	if (!statInfo.isDirectory()) {
		throw new Error('Path must be a directory');
	}

	const stats = { files: 0, folders: 0, markdownFiles: 0 };
	const tree = await scanDirectory(rootPath, stats);

	return {
		tree,
		stats,
		scannedAt: new Date().toISOString(),
		rootPath
	};
}
