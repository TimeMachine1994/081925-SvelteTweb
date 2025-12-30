import { json } from '@sveltejs/kit';
import { analyzeFile } from '$lib/server/file-analyzer';
import { resolve, join } from 'path';
import { access } from 'fs/promises';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { filePath, projectPath } = await request.json();

		console.log('\n[analyze-file API] === NEW REQUEST ===');
		console.log('[analyze-file API] filePath:', filePath);
		console.log('[analyze-file API] projectPath:', projectPath);

		if (!filePath) {
			console.error('[analyze-file API] ERROR: No filePath provided');
			return json({ error: 'filePath required' }, { status: 400 });
		}

		// Resolve the full file path
		let fullPath: string;
		let cleanPath = filePath;

		// Handle $lib alias (SvelteKit convention)
		if (cleanPath.startsWith('$lib/')) {
			cleanPath = 'lib/' + cleanPath.substring(5);
			console.log('[analyze-file API] Converted $lib/ to lib/, cleanPath:', cleanPath);
		} else if (cleanPath.startsWith('$lib')) {
			cleanPath = 'lib' + cleanPath.substring(4);
			console.log('[analyze-file API] Converted $lib to lib, cleanPath:', cleanPath);
		}

		// Remove @ prefix if present
		if (cleanPath.startsWith('@/')) {
			cleanPath = cleanPath.substring(2);
			console.log('[analyze-file API] Removed @/, cleanPath:', cleanPath);
		} else if (cleanPath.startsWith('@')) {
			cleanPath = cleanPath.substring(1);
			console.log('[analyze-file API] Removed @, cleanPath:', cleanPath);
		}

		// Remove leading slash
		if (cleanPath.startsWith('/')) {
			cleanPath = cleanPath.substring(1);
			console.log('[analyze-file API] Removed leading /, cleanPath:', cleanPath);
		}

		// Construct full path
		const projectRoot = projectPath || process.cwd();
		console.log('[analyze-file API] projectRoot:', projectRoot);
		
		if (projectRoot.endsWith('/src') || projectRoot.endsWith('\\src')) {
			fullPath = join(projectRoot, cleanPath);
			console.log('[analyze-file API] projectRoot ends with /src, fullPath:', fullPath);
		} else {
			fullPath = join(projectRoot, 'src', cleanPath);
			console.log('[analyze-file API] Added /src, fullPath:', fullPath);
		}

		const resolvedPath = resolve(fullPath);
		console.log('[analyze-file API] resolvedPath:', resolvedPath);

		// Security check
		if (!resolvedPath.startsWith(projectRoot.replace(/\/src$/, ''))) {
			console.error('[analyze-file API] SECURITY ERROR: Path outside project root');
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Check file exists
		try {
			await access(resolvedPath);
			console.log('[analyze-file API] File exists!');
		} catch {
			console.error('[analyze-file API] File NOT found:', resolvedPath);
			return json({ error: 'File not found', path: resolvedPath }, { status: 404 });
		}

		// Analyze the file
		const analysis = await analyzeFile(resolvedPath);

		return json({
			success: true,
			analysis
		});
	} catch (error) {
		console.error('[AnalyzeFile] Error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Analysis failed'
			},
			{ status: 500 }
		);
	}
};
