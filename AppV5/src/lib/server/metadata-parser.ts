import matter from 'gray-matter';
import { readFile } from 'node:fs/promises';
import type { JourneyMetadata } from '$lib/types/journey';

export interface ParsedMetadata extends JourneyMetadata {
	title?: string;
	body?: string;
	tags?: string[];
	uses?: string[];
}

export async function parseMetadataFile(filePath: string): Promise<ParsedMetadata | null> {
	try {
		const content = await readFile(filePath, 'utf-8');
		const { data, content: body } = matter(content);

		const metadata: ParsedMetadata = {};

		if (typeof data.level === 'number' && data.level >= 1 && data.level <= 4) {
			metadata.level = data.level as 1 | 2 | 3 | 4;
		}

		if (typeof data.journey === 'string') {
			metadata.journey = data.journey;
		}

		if (typeof data.partOf === 'string') {
			metadata.partOf = data.partOf;
		}

		if (typeof data.description === 'string') {
			metadata.description = data.description;
		}

		if (Array.isArray(data.tags)) {
			metadata.tags = data.tags.filter((t): t is string => typeof t === 'string');
		}

		if (Array.isArray(data.uses)) {
			metadata.uses = data.uses.filter((u): u is string => typeof u === 'string');
		}

		const trimmedBody = body.trim();
		if (trimmedBody) {
			metadata.body = trimmedBody;

			const titleMatch = trimmedBody.match(/^#\s+(.+)$/m);
			if (titleMatch) {
				metadata.title = titleMatch[1].trim();
			}
		}

		return metadata;
	} catch {
		return null;
	}
}

export function getMetaFilePath(sourcePath: string): string {
	return sourcePath.replace(/\.[^.]+$/, '.meta.md');
}

export function getFolderMetaPath(folderPath: string): string {
	return `${folderPath}/_folder.meta.md`;
}
