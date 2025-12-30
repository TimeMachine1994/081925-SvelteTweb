import { json } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { generatePOTJUpdate } from '$lib/server/gemini-reconcile';
import { createJourneySnapshots } from '$lib/server/file-snapshot';
import { parseJourneyMarkdown } from '$lib/server/journey-parser';
import { updateJourneyMarkdownFile } from '$lib/server/journey-writer';
import type { POTJ, RootJourney } from '$lib/types/journey';
import type { RequestHandler } from './$types';

/**
 * Load a journey by ID
 */
async function loadJourney(journeyId: string): Promise<RootJourney | null> {
	const journeysDir = join(process.cwd(), 'journeys');
	const journeyPath = join(journeysDir, `${journeyId}.journey.md`);

	try {
		const content = await readFile(journeyPath, 'utf-8');
		return parseJourneyMarkdown(content);
	} catch {
		return null;
	}
}

/**
 * Find a POTJ within a journey
 */
function findPOTJ(journey: RootJourney, potjId: string): POTJ | null {
	const allPOTJs = [
		...journey.sections.beginning.items,
		...journey.sections.middle.items,
		...journey.sections.end.items
	];
	return allPOTJs.find((p) => p.id === potjId) || null;
}

/**
 * Resolve file path from @/ notation
 */
function resolveFilePath(fileRef: string | undefined, projectPath: string): string | null {
	if (!fileRef) return null;

	let cleanPath = fileRef;
	if (cleanPath.startsWith('@/')) cleanPath = cleanPath.slice(2);
	if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

	return join(projectPath, 'src', cleanPath);
}

export const POST: RequestHandler = async ({ request }) => {
	const { journeyId, potjId, projectPath } = await request.json();

	if (!journeyId || !potjId) {
		return json({ error: 'journeyId and potjId required' }, { status: 400 });
	}

	const resolvedProjectPath = projectPath || process.cwd();

	try {
		// 1. Load current journey and POTJ
		const journey = await loadJourney(journeyId);
		if (!journey) {
			return json({ success: false, error: 'Journey not found' }, { status: 404 });
		}

		const potj = findPOTJ(journey, potjId);
		if (!potj) {
			return json({ success: false, error: 'POTJ not found' }, { status: 404 });
		}

		// 2. Read current file content
		const filePath = resolveFilePath(potj.fileRef, resolvedProjectPath);
		if (!filePath) {
			return json({ success: false, error: 'No file reference in POTJ' }, { status: 400 });
		}

		let fileContent: string;
		try {
			fileContent = await readFile(filePath, 'utf-8');
		} catch {
			return json({ success: false, error: 'File not found or unreadable' }, { status: 404 });
		}

		// 3. Generate updated POTJ metadata via AI
		console.log(`[Reconcile] Generating update for POTJ ${potjId}...`);
		const updatedPOTJ = await generatePOTJUpdate(potj, fileContent);

		// 4. Update journey markdown file
		await updateJourneyMarkdownFile(journeyId, potjId, updatedPOTJ);

		// 5. Create new snapshot for the updated file
		const updatedJourney = await loadJourney(journeyId);
		if (updatedJourney) {
			await createJourneySnapshots(updatedJourney, resolvedProjectPath);
		}

		console.log(`[Reconcile] Successfully reconciled POTJ ${potjId}`);

		return json({
			success: true,
			updatedPOTJ: {
				id: updatedPOTJ.id,
				title: updatedPOTJ.title,
				description: updatedPOTJ.description
			},
			reconciledAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('[Reconcile] Error:', error);
		return json(
			{
				success: false,
				error: 'Reconciliation failed',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
