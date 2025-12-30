import { readdir, readFile, stat, access } from 'fs/promises';
import { join, relative, dirname } from 'path';

export interface RouteInfo {
	path: string;
	filePath: string;
	type: 'page' | 'layout' | 'server' | 'api';
	hasServerLogic: boolean;
	hasLayout: boolean;
	parentLayout?: string;
	imports: string[];
	content?: string;
}

export interface RouteTree {
	routes: RouteInfo[];
	layouts: RouteInfo[];
	apiEndpoints: RouteInfo[];
	rootPath: string;
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function extractImports(content: string): string[] {
	const imports: string[] = [];
	const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;

	let match;
	while ((match = importRegex.exec(content)) !== null) {
		const importPath = match[1];
		if (importPath.startsWith('$lib') || importPath.startsWith('./') || importPath.startsWith('../')) {
			imports.push(importPath);
		}
	}

	return imports;
}

async function scanApiRoutes(
	dir: string,
	apiEndpoints: RouteInfo[],
	projectPath: string,
	routePath: string = '/api'
): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		const relPath = relative(join(projectPath, 'src'), fullPath);

		if (entry.isDirectory()) {
			await scanApiRoutes(fullPath, apiEndpoints, projectPath, join(routePath, entry.name));
		} else if (entry.name === '+server.ts' || entry.name === '+server.js') {
			const content = await readFile(fullPath, 'utf-8');
			apiEndpoints.push({
				path: routePath,
				filePath: relPath,
				type: 'api',
				hasServerLogic: true,
				hasLayout: false,
				imports: extractImports(content),
				content: content.slice(0, 4000)
			});
		}
	}
}

async function scanRoutesRecursive(
	dir: string,
	routePath: string,
	routes: RouteInfo[],
	layouts: RouteInfo[],
	apiEndpoints: RouteInfo[],
	projectPath: string
): Promise<void> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		const relPath = relative(join(projectPath, 'src'), fullPath);

		if (entry.isDirectory()) {
			const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
			const newRoutePath = isGroup ? routePath : (routePath === '' ? `/${entry.name}` : `${routePath}/${entry.name}`);

			if (entry.name === 'api') {
				await scanApiRoutes(fullPath, apiEndpoints, projectPath, '/api');
			} else {
				await scanRoutesRecursive(fullPath, newRoutePath, routes, layouts, apiEndpoints, projectPath);
			}
		} else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.ts')) {
			let fileContent = '';
			try {
				fileContent = await readFile(fullPath, 'utf-8');
			} catch {
				continue;
			}
			const imports = extractImports(fileContent);

			if (entry.name === '+page.svelte') {
				const hasServer = await fileExists(join(dir, '+page.server.ts'));
				const hasLayout = await fileExists(join(dir, '+layout.svelte'));

				routes.push({
					path: routePath || '/',
					filePath: relPath,
					type: 'page',
					hasServerLogic: hasServer,
					hasLayout,
					imports,
					content: fileContent.slice(0, 4000)
				});
			} else if (entry.name === '+layout.svelte') {
				const hasServer = await fileExists(join(dir, '+layout.server.ts'));

				layouts.push({
					path: routePath || '/',
					filePath: relPath,
					type: 'layout',
					hasServerLogic: hasServer,
					hasLayout: false,
					imports,
					content: fileContent.slice(0, 4000)
				});
			}
		}
	}
}

function linkParentLayouts(routes: RouteInfo[], layouts: RouteInfo[]): void {
	for (const route of routes) {
		let currentPath = dirname(route.path);
		while (currentPath && currentPath !== '.' && currentPath !== '/') {
			const parentLayout = layouts.find((l) => l.path === currentPath);
			if (parentLayout) {
				route.parentLayout = parentLayout.filePath;
				break;
			}
			currentPath = dirname(currentPath);
		}
		if (!route.parentLayout) {
			const rootLayout = layouts.find((l) => l.path === '/' || l.path === '');
			if (rootLayout) {
				route.parentLayout = rootLayout.filePath;
			}
		}
	}
}

export async function analyzeRoutes(projectPath: string): Promise<RouteTree> {
	const routesDir = join(projectPath, 'src', 'routes');
	const routes: RouteInfo[] = [];
	const layouts: RouteInfo[] = [];
	const apiEndpoints: RouteInfo[] = [];

	if (!(await fileExists(routesDir))) {
		console.warn(`[RouteAnalyzer] Routes directory not found: ${routesDir}`);
		return { routes, layouts, apiEndpoints, rootPath: projectPath };
	}

	await scanRoutesRecursive(routesDir, '', routes, layouts, apiEndpoints, projectPath);
	linkParentLayouts(routes, layouts);

	console.log(
		`[RouteAnalyzer] Found ${routes.length} pages, ${layouts.length} layouts, ${apiEndpoints.length} API endpoints`
	);

	return {
		routes,
		layouts,
		apiEndpoints,
		rootPath: projectPath
	};
}
