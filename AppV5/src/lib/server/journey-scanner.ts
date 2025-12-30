import fs from 'fs/promises';
import path from 'path';
import { parseJourneyMarkdown, extractFileReferencesFromJourney } from './journey-parser';
import type { RootJourney, FileProfile } from '$lib/types/journey';

export async function scanJourneyFiles(journeysDir: string): Promise<RootJourney[]> {
	const journeys: RootJourney[] = [];

	try {
		const files = await fs.readdir(journeysDir);
		const journeyFiles = files.filter(f => f.endsWith('.journey.md'));

		for (const file of journeyFiles) {
			const filePath = path.join(journeysDir, file);
			const content = await fs.readFile(filePath, 'utf-8');
			const journey = parseJourneyMarkdown(content);

			if (journey) {
				journeys.push(journey);
			} else {
				console.warn(`Failed to parse journey file: ${file}`);
			}
		}

		return journeys;
	} catch (error) {
		console.error('Error scanning journey files:', error);
		return [];
	}
}

export async function loadJourneysWithFiles(
	journeysDir: string,
	projectRoot: string
): Promise<{ journeys: RootJourney[]; files: FileProfile[] }> {
	const journeys = await scanJourneyFiles(journeysDir);
	const fileProfiles = new Map<string, FileProfile>();

	for (const journey of journeys) {
		const fileRefs = extractFileReferencesFromJourney(journey);

		for (const fileRef of fileRefs) {
			if (!fileProfiles.has(fileRef)) {
				const profile = await createFileProfile(fileRef, projectRoot, journey.id);
				if (profile) {
					fileProfiles.set(fileRef, profile);
				}
			}
		}
	}

	return {
		journeys,
		files: Array.from(fileProfiles.values())
	};
}

async function createFileProfile(
	fileRef: string,
	projectRoot: string,
	journeyId: string
): Promise<FileProfile | null> {
	try {
		const filePath = path.join(projectRoot, 'src', fileRef);
		const fileName = path.basename(fileRef);
		const exists = await fs.access(filePath).then(() => true).catch(() => false);

		const profile: FileProfile = {
			id: generateFileId(fileRef),
			path: fileRef,
			title: fileName.replace(/\.(svelte|ts|js)$/, ''),
			description: exists ? 'File found in project' : 'Referenced file not found',
			tags: [journeyId, ...extractTagsFromPath(fileRef)],
			metadata: {
				journey: journeyId
			},
			codeSnippets: [],
			relatedPOTJs: [],
			notes: [],
			chatHistory: []
		};

		if (exists) {
			const content = await fs.readFile(filePath, 'utf-8');
			profile.codeSnippets = extractCodeSnippets(content, fileRef);
		}

		return profile;
	} catch (error) {
		console.error(`Error creating file profile for ${fileRef}:`, error);
		return null;
	}
}

function generateFileId(filePath: string): string {
	return 'f-' + filePath.replace(/[^a-zA-Z0-9]/g, '-');
}

function extractTagsFromPath(filePath: string): string[] {
	const tags: string[] = [];
	
	if (filePath.includes('/routes/')) tags.push('route');
	if (filePath.includes('/lib/')) tags.push('library');
	if (filePath.includes('/components/')) tags.push('component');
	if (filePath.includes('/api/')) tags.push('api');
	if (filePath.includes('/utils/')) tags.push('utility');
	if (filePath.endsWith('.svelte')) tags.push('svelte');
	if (filePath.endsWith('.ts')) tags.push('typescript');
	if (filePath.endsWith('.js')) tags.push('javascript');
	if (filePath.includes('+page.svelte')) tags.push('page');
	if (filePath.includes('+layout.svelte')) tags.push('layout');
	if (filePath.includes('+page.server.ts')) tags.push('server');
	
	return tags;
}

function extractCodeSnippets(content: string, filePath: string): any[] {
	const snippets = [];
	const lines = content.split('\n');
	
	if (lines.length > 20) {
		const language = filePath.endsWith('.svelte') ? 'svelte' : 
		                 filePath.endsWith('.ts') ? 'typescript' : 'javascript';
		
		snippets.push({
			id: 'preview',
			language,
			code: lines.slice(0, 20).join('\n') + '\n// ...',
			lineStart: 1,
			lineEnd: 20
		});
	}
	
	return snippets;
}

export async function getJourneyById(journeysDir: string, id: string): Promise<RootJourney | null> {
	const journeyPath = path.join(journeysDir, `${id}.journey.md`);
	
	try {
		const content = await fs.readFile(journeyPath, 'utf-8');
		return parseJourneyMarkdown(content);
	} catch (error) {
		console.error(`Error loading journey ${id}:`, error);
		return null;
	}
}
