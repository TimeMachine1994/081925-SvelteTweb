import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export async function POST({ request }: { request: Request }) {
	try {
		// Parse request body to get file path and optional project path
		const { filePath, projectPath } = await request.json();
		console.log('\n[file-content API] === NEW REQUEST ===');
		console.log('[file-content API] Received filePath:', filePath);
		console.log('[file-content API] Received projectPath:', projectPath);

		if (!filePath) {
			console.error('[file-content API] ERROR: No file path provided');
			return json({ error: 'File path is required' }, { status: 400 });
		}

		// Determine the project root directory
		// If projectPath is provided, use it; otherwise default to AppV5 directory
		const projectRoot = projectPath || process.cwd();
		console.log('[file-content API] Using projectRoot:', projectRoot);
		
		// Clean the file path by removing prefixes
		let cleanPath = filePath;
		console.log('[file-content API] Original cleanPath:', cleanPath);
		
		// Handle $lib alias (SvelteKit convention: $lib → src/lib)
		if (cleanPath.startsWith('$lib/')) {
			cleanPath = 'lib/' + cleanPath.substring(5);
			console.log('[file-content API] Converted $lib/ to lib/, cleanPath:', cleanPath);
		} else if (cleanPath.startsWith('$lib')) {
			cleanPath = 'lib' + cleanPath.substring(4);
			console.log('[file-content API] Converted $lib to lib, cleanPath:', cleanPath);
		}
		
		// Remove @ prefix if present (e.g., @/routes/page.svelte → routes/page.svelte)
		if (cleanPath.startsWith('@/')) {
			cleanPath = cleanPath.substring(2);
			console.log('[file-content API] Removed @/ prefix, cleanPath:', cleanPath);
		} else if (cleanPath.startsWith('@')) {
			cleanPath = cleanPath.substring(1);
			console.log('[file-content API] Removed @ prefix, cleanPath:', cleanPath);
		}
		
		// Remove leading slash if present (e.g., /routes/page.svelte → routes/page.svelte)
		if (cleanPath.startsWith('/')) {
			cleanPath = cleanPath.substring(1);
			console.log('[file-content API] Removed leading /, cleanPath:', cleanPath);
		}
		
		// Construct the full file path
		let fullPath: string;
		// Check if the CLEANED path is absolute (after removing @ and / prefixes)
		if (path.isAbsolute(cleanPath)) {
			// Path is truly absolute (like C:\Users\...), use it as-is
			fullPath = cleanPath;
			console.log('[file-content API] Using absolute cleanPath:', fullPath);
		} else {
			// Relative path - join with projectRoot
			// Only add /src if projectRoot doesn't already end with /src
			if (projectRoot.endsWith('/src') || projectRoot.endsWith('\\src')) {
				fullPath = path.join(projectRoot, cleanPath);
				console.log('[file-content API] projectRoot already has /src, fullPath:', fullPath);
			} else {
				fullPath = path.join(projectRoot, 'src', cleanPath);
				console.log('[file-content API] Added /src to path, fullPath:', fullPath);
			}
		}

		// Resolve to absolute path and check security
		const resolvedPath = path.resolve(fullPath);
		console.log('[file-content API] Resolved absolute path:', resolvedPath);
		console.log('[file-content API] Checking if resolved path starts with projectRoot...');
		console.log('[file-content API] resolvedPath:', resolvedPath);
		console.log('[file-content API] projectRoot:', projectRoot);
		console.log('[file-content API] Starts with projectRoot?', resolvedPath.startsWith(projectRoot));
		
		// Security check: ensure the resolved path is within the project directory
		// This prevents directory traversal attacks
		if (!resolvedPath.startsWith(projectRoot)) {
			console.error('[file-content API] SECURITY ERROR: Path is outside project root!');
			console.error('[file-content API] Blocked path:', resolvedPath);
			console.error('[file-content API] Project root:', projectRoot);
			return json({ 
				error: 'Access denied', 
				details: `Path ${resolvedPath} is outside project root ${projectRoot}`
			}, { status: 403 });
		}

		// Check if file exists - try with common extensions if not found
		let finalPath = resolvedPath;
		const extensions = ['', '.ts', '.js', '.svelte', '.json', '/index.ts', '/index.js', '/index.svelte'];
		let fileFound = false;
		
		for (const ext of extensions) {
			const tryPath = resolvedPath + ext;
			try {
				await fs.access(tryPath);
				finalPath = tryPath;
				fileFound = true;
				console.log('[file-content API] File found at:', tryPath);
				break;
			} catch {
				console.log('[file-content API] Not found:', tryPath);
			}
		}
		
		if (!fileFound) {
			console.error('[file-content API] File NOT found with any extension');
			return json({ error: 'File not found', triedPath: resolvedPath }, { status: 404 });
		}
		
		// Read file content using the found path
		const content = await fs.readFile(finalPath, 'utf-8');
		
		// Get file stats
		const stats = await fs.stat(finalPath);

		return json({
			content,
			path: filePath,
			size: stats.size,
			modified: stats.mtime
		});
	} catch (error) {
		console.error('Error reading file:', error);
		return json(
			{
				error: 'Failed to read file',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
