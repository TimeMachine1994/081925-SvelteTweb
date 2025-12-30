import { env } from '$env/dynamic/private';
import type { RouteTree, RouteInfo } from './route-analyzer';
import type { POTJ, JourneySectionType, ModuleType, POTJAnalysis } from '$lib/types/journey';
import { analyzeFile } from './file-analyzer';

const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface JourneyDefinition {
	id: string;
	name: string;
	persona: string;
	goal: string;
	routes: string[];
}

interface JourneyClassification {
	journeys: JourneyDefinition[];
}

export async function classifyJourneys(routeTree: RouteTree): Promise<JourneyClassification> {
	const apiKey = env.GEMINI_API_KEY;

	if (!apiKey) {
		console.warn('[GeminiJourney] No API key, using default classification');
		return createDefaultClassification(routeTree);
	}

	const routeSummary = routeTree.routes.map((r) => ({
		path: r.path,
		hasAuth: r.imports.some((i) => i.includes('auth')),
		hasServer: r.hasServerLogic,
		parentLayout: r.parentLayout
	}));

	const prompt = `Analyze this web application's route structure and identify distinct user journeys.

## Routes Found:
${JSON.stringify(routeSummary, null, 2)}

## API Endpoints:
${routeTree.apiEndpoints.map((e) => e.path).join('\n')}

Based on the route paths and patterns, identify 2-5 distinct user journeys (personas).

Common patterns to look for:
- **Guest journey**: Public pages, marketing, signup, login flows
- **Admin journey**: /admin/**, management pages, user administration
- **User/Member journey**: Authenticated user features, dashboard, settings
- **Creator journey**: Content creation, editing, publishing flows
- **Developer journey**: Dev tools, documentation, API references

Rules:
1. Each route should belong to exactly one journey
2. Routes can be assigned based on path patterns (e.g., /admin/** → Admin journey)
3. Public routes typically belong to Guest journey
4. Consider authentication requirements implied by the routes

Respond with JSON only:
{
  "journeys": [
    {
      "id": "guest",
      "name": "Guest Journey", 
      "persona": "Unauthenticated visitor exploring the platform",
      "goal": "Learn about the platform and sign up",
      "routes": ["/", "/about", "/login", "/signup"]
    }
  ]
}`;

	try {
		const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
			})
		});

		if (!response.ok) {
			console.error('[GeminiJourney] API error:', response.status);
			return createDefaultClassification(routeTree);
		}

		const data = await response.json();
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (text) {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				if (parsed.journeys && Array.isArray(parsed.journeys)) {
					return parsed;
				}
			}
		}
	} catch (err) {
		console.error('[GeminiJourney] Error classifying journeys:', err);
	}

	return createDefaultClassification(routeTree);
}

function createDefaultClassification(routeTree: RouteTree): JourneyClassification {
	const adminRoutes = routeTree.routes.filter((r) => r.path.includes('/admin'));
	const demoRoutes = routeTree.routes.filter((r) => r.path.includes('/demo'));
	const dashboardRoutes = routeTree.routes.filter((r) => r.path.includes('/dashboard'));
	const otherRoutes = routeTree.routes.filter(
		(r) =>
			!r.path.includes('/admin') && !r.path.includes('/demo') && !r.path.includes('/dashboard')
	);

	const journeys: JourneyDefinition[] = [];

	if (otherRoutes.length > 0 || routeTree.routes.some((r) => r.path === '/')) {
		journeys.push({
			id: 'app',
			name: 'Application Journey',
			persona: 'General user of the application',
			goal: 'Use the main application features',
			routes: otherRoutes.map((r) => r.path)
		});
	}

	if (adminRoutes.length > 0) {
		journeys.push({
			id: 'admin',
			name: 'Admin Journey',
			persona: 'Administrator managing the platform',
			goal: 'Manage users, content, and system settings',
			routes: adminRoutes.map((r) => r.path)
		});
	}

	if (demoRoutes.length > 0) {
		journeys.push({
			id: 'demo',
			name: 'Demo Journey',
			persona: 'User exploring demo features',
			goal: 'Explore and test demo functionality',
			routes: demoRoutes.map((r) => r.path)
		});
	}

	if (dashboardRoutes.length > 0) {
		journeys.push({
			id: 'dashboard',
			name: 'Dashboard Journey',
			persona: 'Authenticated user viewing dashboard',
			goal: 'Monitor and manage their data',
			routes: dashboardRoutes.map((r) => r.path)
		});
	}

	if (journeys.length === 0) {
		journeys.push({
			id: 'app',
			name: 'Application Journey',
			persona: 'General user',
			goal: 'Use the application',
			routes: routeTree.routes.map((r) => r.path)
		});
	}

	return { journeys };
}

export function classifySection(route: RouteInfo): JourneySectionType {
	const path = route.path.toLowerCase();

	if (
		path === '/' ||
		path === '' ||
		path.includes('/login') ||
		path.includes('/signin') ||
		path.includes('/signup') ||
		path.includes('/register') ||
		path.includes('/welcome') ||
		path.includes('/onboarding') ||
		path.includes('/landing')
	) {
		return 'beginning';
	}

	if (
		path.includes('/success') ||
		path.includes('/complete') ||
		path.includes('/confirmation') ||
		path.includes('/thank') ||
		path.includes('/logout') ||
		path.includes('/signout') ||
		path.includes('/analytics') ||
		path.includes('/reports') ||
		path.includes('/summary')
	) {
		return 'end';
	}

	return 'middle';
}

export function determineModuleType(route: RouteInfo): ModuleType {
	if (route.type === 'layout') return 'layout';
	if (route.type === 'api') return 'endpoint';
	if (route.hasServerLogic) return 'logic';
	return 'page';
}

export async function generatePOTJEntry(
	route: RouteInfo,
	journeyId: string,
	section: JourneySectionType,
	index: number,
	projectPath?: string
): Promise<POTJ> {
	const apiKey = env.GEMINI_API_KEY;

	if (!apiKey) {
		return createBasicPOTJ(route, journeyId, section, index, projectPath);
	}

	const sectionLetter = section === 'beginning' ? 'b' : section === 'middle' ? 'm' : 'e';
	const potjId = `${journeyId}-${sectionLetter}-${index}`;

	const prompt = `Generate a Journey documentation entry (POTJ) for this route.

## Route Information:
- Path: ${route.path}
- File: ${route.filePath}
- Type: ${route.type}
- Has Server Logic: ${route.hasServerLogic}
- Parent Layout: ${route.parentLayout || 'None'}
- Imports: ${route.imports.slice(0, 10).join(', ') || 'None'}

## Code Content:
\`\`\`
${route.content || 'Content not available'}
\`\`\`

Generate a user-focused POTJ entry. Focus on USER EXPERIENCE, not implementation details.

Respond with JSON only:
{
  "title": "Clear, user-focused title (e.g., 'User Dashboard', 'Sign Up Flow')",
  "description": "2-3 sentences describing what the user experiences at this step",
  "keyBehavior": ["User action or system behavior 1", "User action 2", "System response 3"],
  "tags": ["relevant-tag-1", "relevant-tag-2"],
  "codeSnippet": {
    "startLine": 10,
    "endLine": 25,
    "code": "Most important 5-15 lines of code"
  }
}`;

	try {
		const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
			})
		});

		if (!response.ok) {
			return createBasicPOTJ(route, journeyId, section, index, projectPath);
		}

		const data = await response.json();
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (text) {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);

				return {
					id: potjId,
					title: parsed.title || generateDefaultTitle(route),
					moduleType: determineModuleType(route),
					description: parsed.description,
					section,
					fileRef: route.filePath,
					tags: parsed.tags || [],
					keyBehavior: parsed.keyBehavior || [],
					codeReference: parsed.codeSnippet
						? {
								file: route.filePath,
								lines: `${parsed.codeSnippet.startLine}-${parsed.codeSnippet.endLine}`,
								language: route.filePath.endsWith('.svelte') ? 'svelte' : 'typescript',
								code: parsed.codeSnippet.code
							}
						: undefined,
					dependencies: route.imports.filter((i) => i.startsWith('$lib')),
					parentLayout: route.parentLayout,
					chatHistory: []
				};
			}
		}
	} catch (err) {
		console.error('[GeminiJourney] Error generating POTJ:', err);
	}

	return createBasicPOTJ(route, journeyId, section, index, projectPath);
}

/**
 * Check if import path is a framework module
 */
function isFrameworkModule(path: string): boolean {
	const frameworkPrefixes = ['$app/', '$env/', 'svelte/', 'svelte', '@sveltejs/'];
	return frameworkPrefixes.some(prefix => path.startsWith(prefix));
}

async function createBasicPOTJ(
	route: RouteInfo,
	journeyId: string,
	section: JourneySectionType,
	index: number,
	projectPath?: string
): Promise<POTJ> {
	const sectionLetter = section === 'beginning' ? 'b' : section === 'middle' ? 'm' : 'e';
	const potjId = `${journeyId}-${sectionLetter}-${index}`;

	// Try to get file analysis for complexity summary and full analysis data
	let metadata: POTJ['metadata'] = undefined;
	let analysis: POTJAnalysis | undefined = undefined;
	
	if (projectPath && route.filePath) {
		try {
			const fullPath = route.filePath.startsWith('/')
				? `${projectPath}/src${route.filePath}`
				: `${projectPath}/src/${route.filePath}`;
			const fileAnalysis = await analyzeFile(fullPath);
			
			// Build metadata summary
			metadata = {
				stateCount: fileAnalysis.summary.stateCount,
				functionCount: fileAnalysis.summary.functionCount,
				importCount: fileAnalysis.summary.importCount,
				keyFunctions: fileAnalysis.functions.slice(0, 5).map((f) => f.name),
				keyState: fileAnalysis.state.slice(0, 5).map((s) => s.name)
			};
			
			// Build full analysis for persistence
			const projectImports = fileAnalysis.imports.filter(i => !isFrameworkModule(i.path));
			const frameworkImports = fileAnalysis.imports.filter(i => isFrameworkModule(i.path));
			
			analysis = {
				state: fileAnalysis.state.map(s => ({
					name: s.name,
					type: s.type,
					initialValue: s.initialValue,
					line: s.line,
					isState: s.isState,
					isDerived: s.isDerived
				})),
				functions: fileAnalysis.functions.map(f => ({
					name: f.name,
					params: f.params,
					returnType: f.returnType,
					isAsync: f.isAsync,
					isExported: f.isExported,
					line: f.line,
					endLine: f.endLine
				})),
				imports: {
					projectFiles: projectImports.map(i => ({
						path: i.path,
						imports: i.imports,
						defaultImport: i.defaultImport,
						category: i.category,
						line: i.line
					})),
					frameworkModules: frameworkImports.map(i => ({
						path: i.path,
						imports: i.imports,
						defaultImport: i.defaultImport,
						category: i.category,
						line: i.line
					}))
				},
				metadata: {
					analyzedAt: new Date().toISOString(),
					stateCount: fileAnalysis.summary.stateCount,
					functionCount: fileAnalysis.summary.functionCount,
					importCount: fileAnalysis.summary.importCount
				}
			};
		} catch (err) {
			console.warn(`[GeminiJourney] Could not analyze file ${route.filePath}:`, err);
			// File analysis failed, continue without metadata/analysis
		}
	}

	return {
		id: potjId,
		title: generateDefaultTitle(route),
		moduleType: determineModuleType(route),
		description: `User interacts with the ${route.path || 'home'} route.`,
		section,
		fileRef: route.filePath,
		tags: extractTagsFromPath(route.path),
		keyBehavior: [],
		dependencies: route.imports.filter((i) => i.startsWith('$lib')),
		parentLayout: route.parentLayout,
		chatHistory: [],
		metadata,
		analysis
	};
}

function generateDefaultTitle(route: RouteInfo): string {
	if (route.path === '/' || route.path === '') {
		return route.type === 'layout' ? 'Root Layout' : 'Home Page';
	}

	const parts = route.path.split('/').filter(Boolean);
	const title = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

	const suffix = route.type === 'layout' ? ' Layout' : route.type === 'api' ? ' API' : ' Page';

	return title + suffix;
}

function extractTagsFromPath(path: string): string[] {
	const tags: string[] = [];
	const lowerPath = path.toLowerCase();

	if (lowerPath.includes('auth') || lowerPath.includes('login')) tags.push('authentication');
	if (lowerPath.includes('admin')) tags.push('admin');
	if (lowerPath.includes('dashboard')) tags.push('dashboard');
	if (lowerPath.includes('settings')) tags.push('settings');
	if (lowerPath.includes('api')) tags.push('api');
	if (lowerPath.includes('user')) tags.push('user-management');
	if (path === '/' || path === '') tags.push('entry-point');

	return tags;
}
