import { json } from '@sveltejs/kit';
import { loadJourneysWithFiles } from '$lib/server/journey-scanner';
import path from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Get project path from query params, default to AppV5 directory
		const projectPath = url.searchParams.get('projectPath') || process.cwd();
		
		const journeysDir = path.join(process.cwd(), 'journeys');
		const projectRoot = projectPath;
		
		const { journeys, files } = await loadJourneysWithFiles(journeysDir, projectRoot);

		return json({
			journeys,
			files,
			stats: {
				journeyCount: journeys.length,
				fileCount: files.length
			}
		});
	} catch (error) {
		console.error('Error loading journeys:', error);
		return json(
			{ 
				error: 'Failed to load journeys',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
