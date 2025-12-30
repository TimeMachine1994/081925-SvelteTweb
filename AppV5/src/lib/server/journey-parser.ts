import matter from 'gray-matter';
import type { RootJourney, POTJ, JourneySectionType, DataFlow, DataFlowItem, POTJAnalysis, POTJStateVariable, POTJFunction, POTJImport } from '$lib/types/journey';

interface JourneyFrontmatter {
	type: string;
	id: string;
	name: string;
	generated?: string;
	generator?: string;
	version?: string;
}

interface POTJMatch {
	id: string;
	title: string;
	section: JourneySectionType;
	moduleType?: string;
	file?: string;
	level?: number;
	tags: string[];
	description: string;
	keyBehavior: string[];
	codeReference?: {
		file: string;
		lines: string;
		code: string;
		language: string;
	};
	dependencies: string[];
	routes?: string[];
	linkedRoutes?: string[];
	parentLayout?: string;
	notes?: string;
	dataFlow?: DataFlow;
}

export function parseJourneyMarkdown(content: string): RootJourney | null {
	try {
		const { data, content: body } = matter(content);
		const frontmatter = data as JourneyFrontmatter;

		if (frontmatter.type !== 'journey' || !frontmatter.id || !frontmatter.name) {
			console.warn('Invalid journey frontmatter');
			return null;
		}

		const sections = {
			beginning: { type: 'beginning' as const, items: [] as POTJ[] },
			middle: { type: 'middle' as const, items: [] as POTJ[] },
			end: { type: 'end' as const, items: [] as POTJ[] }
		};

		const sectionRegex = /## 🟢 Beginning|## 🟡 Middle|## 🔴 End/g;
		const sectionMatches = Array.from(body.matchAll(sectionRegex));
		
		let currentSection: JourneySectionType | null = null;
		let currentSectionContent = '';

		for (let i = 0; i < sectionMatches.length; i++) {
			const match = sectionMatches[i];
			const nextMatch = sectionMatches[i + 1];
			
			if (currentSection) {
				sections[currentSection].items = parsePOTJsFromSection(currentSectionContent, currentSection);
			}

			if (match[0].includes('Beginning')) {
				currentSection = 'beginning';
			} else if (match[0].includes('Middle')) {
				currentSection = 'middle';
			} else if (match[0].includes('End')) {
				currentSection = 'end';
			}

			const startIndex = match.index! + match[0].length;
			const endIndex = nextMatch ? nextMatch.index! : body.indexOf('## Journey Metadata');
			currentSectionContent = body.slice(startIndex, endIndex > startIndex ? endIndex : body.length);
		}

		if (currentSection) {
			sections[currentSection].items = parsePOTJsFromSection(currentSectionContent, currentSection);
		}

		return {
			id: frontmatter.id,
			name: frontmatter.name,
			sections
		};
	} catch (error) {
		console.error('Error parsing journey markdown:', error);
		return null;
	}
}

function parsePOTJsFromSection(content: string, section: JourneySectionType): POTJ[] {
	const potjs: POTJ[] = [];
	
	const potjRegex = /### \[POTJ:([^\]]+)\] (.+?)(?=###|\n## |$)/gs;
	const matches = Array.from(content.matchAll(potjRegex));

	for (const match of matches) {
		const [, id, potjContent] = match;
		const title = potjContent.split('\n')[0].trim();
		
		const potj: POTJMatch = {
			id: id.trim(),
			title,
			section,
			tags: [],
			description: '',
			keyBehavior: [],
			dependencies: []
		};

		const typeMatch = potjContent.match(/\*\*Type\*\*:\s*(\w+)/);
		if (typeMatch) {
			potj.moduleType = typeMatch[1].toLowerCase();
		}

		const fileMatch = potjContent.match(/\*\*File\*\*:\s*`@([^`]+)`/);
		if (fileMatch) {
			potj.file = fileMatch[1];
		}

		const levelMatch = potjContent.match(/\*\*Level\*\*:\s*L(\d)/);
		if (levelMatch) {
			potj.level = parseInt(levelMatch[1]);
		}

		const routesMatch = potjContent.match(/\*\*Routes\*\*:\s*(.+)/);
		if (routesMatch) {
			potj.routes = routesMatch[1].split(',').map(r => r.trim());
		}

		const linkedRoutesMatch = potjContent.match(/\*\*Linked Routes\*\*:\s*(.+)/);
		if (linkedRoutesMatch) {
			potj.linkedRoutes = linkedRoutesMatch[1].split(',').map(r => r.trim());
		}

		const parentLayoutMatch = potjContent.match(/\*\*Parent Layout\*\*:\s*(.+)/);
		if (parentLayoutMatch) {
			potj.parentLayout = parentLayoutMatch[1].trim();
		}

		const tagsMatch = potjContent.match(/\*\*Tags\*\*:\s*(.+)/);
		if (tagsMatch) {
			potj.tags = tagsMatch[1]
				.split(/\s+/)
				.filter(t => t.startsWith('#'))
				.map(t => t.slice(1));
		}

		const descMatch = potjContent.match(/\*\*Tags\*\*:[^\n]*\n\s*\n([\s\S]+?)(?=\n\*\*Key Behavior\*\*|\n\*\*Code Reference|\n\*\*Dependencies|\n\*\*Notes|$)/);
		if (descMatch) {
			potj.description = descMatch[1].trim();
		}

		const behaviorMatch = potjContent.match(/\*\*Key Behavior\*\*:\s*\n((?:- .+\n?)+)/);
		if (behaviorMatch) {
			potj.keyBehavior = behaviorMatch[1]
				.split('\n')
				.filter(line => line.trim().startsWith('-'))
				.map(line => line.trim().slice(2));
		}

		const codeMatch = potjContent.match(/\*\*Code Reference\*\*\s*`@([^:]+):([^`]+)`:\s*```(\w+)\n([\s\S]+?)```/);
		if (codeMatch) {
			potj.codeReference = {
				file: codeMatch[1],
				lines: codeMatch[2],
				language: codeMatch[3],
				code: codeMatch[4].trim()
			};
		}

		const depsMatch = potjContent.match(/\*\*Dependencies\*\*:\s*\n((?:- .+\n?)+)/);
		if (depsMatch) {
			potj.dependencies = depsMatch[1]
				.split('\n')
				.filter(line => line.trim().startsWith('-'))
				.map(line => {
					const depMatch = line.match(/- (?:Uses|Calls)\s*`@([^`]+)`\s*-\s*(.+)/);
					return depMatch ? depMatch[1] : line.trim().slice(2);
				});
		}

		const notesMatch = potjContent.match(/\*\*Notes\*\*:\s*\n>\s*(.+)/);
		if (notesMatch) {
			potj.notes = notesMatch[1].trim();
		}

		// Parse Data Flow section
		const dataFlowMatch = potjContent.match(/\*\*Data Flow\*\*:\s*\n([\s\S]+?)(?=\n\*\*[A-Z]|\n###|$)/);
		if (dataFlowMatch) {
			potj.dataFlow = parseDataFlow(dataFlowMatch[1]);
		}

		// Parse embedded analysis data
		const analysis = parseAnalysis(potjContent);

		potjs.push({
			id: potj.id,
			title: potj.title,
			moduleType: potj.moduleType as any,
			description: potj.description,
			section: potj.section,
			fileRef: potj.file,
			tags: potj.tags,
			notes: potj.notes ? [potj.notes] : [],
			keyBehavior: potj.keyBehavior.length > 0 ? potj.keyBehavior : undefined,
			codeReference: potj.codeReference,
			dependencies: potj.dependencies.length > 0 ? potj.dependencies : undefined,
			routes: potj.routes,
			linkedRoutes: potj.linkedRoutes,
			parentLayout: potj.parentLayout,
			isExpandable: potj.moduleType === 'route' && potj.routes && potj.routes.length > 0,
			chatHistory: [],
			metadata: potj.level ? { level: potj.level as 1 | 2 | 3 | 4 } : undefined,
			analysis
		});
	}

	return potjs;
}

function parseDataFlow(content: string): DataFlow | undefined {
	const dataFlow: DataFlow = {};

	// Parse "Receives" section
	const receivesMatch = content.match(/- \*\*Receives\*\*:\s*\n((?:  - .+\n?)+)/);
	if (receivesMatch) {
		dataFlow.receives = parseDataFlowItems(receivesMatch[1]);
	}

	// Parse "Provides" section
	const providesMatch = content.match(/- \*\*Provides\*\*:\s*\n((?:  - .+\n?)+)/);
	if (providesMatch) {
		dataFlow.provides = parseDataFlowItems(providesMatch[1]);
	}

	// Parse "Emits" section
	const emitsMatch = content.match(/- \*\*Emits\*\*:\s*\n((?:  - .+\n?)+)/);
	if (emitsMatch) {
		dataFlow.emits = parseDataFlowItems(emitsMatch[1]);
	}

	// Parse "Stores" section
	const storesMatch = content.match(/- \*\*Stores\*\*:\s*\n((?:  - .+\n?)+)/);
	if (storesMatch) {
		dataFlow.stores = parseDataFlowItems(storesMatch[1]);
	}

	return Object.keys(dataFlow).length > 0 ? dataFlow : undefined;
}

function parseDataFlowItems(text: string): DataFlowItem[] {
	const items: DataFlowItem[] = [];
	const lines = text.split('\n').filter(line => line.trim().startsWith('- '));

	for (const line of lines) {
		const item = parseDataFlowItem(line);
		if (item) items.push(item);
	}

	return items;
}

function parseDataFlowItem(line: string): DataFlowItem | null {
	// Pattern: - `propName: Type` - Description [to/from Target]
	const fullMatch = line.match(/- `([^:]+)(?::\s*([^`]+))?`\s*-\s*(.+?)(?:\s+to\s+(.+?))?(?:\s+from\s+(.+?))?$/);

	if (fullMatch) {
		const [, name, type, description, destination, source] = fullMatch;
		return {
			name: name.trim(),
			type: type?.trim(),
			description: description.trim(),
			destination: destination?.trim(),
			source: source?.trim()
		};
	}

	// Fallback: just extract name and description
	const simpleMatch = line.match(/- `([^`]+)`\s*-\s*(.+)/);
	if (simpleMatch) {
		const [, name, description] = simpleMatch;
		return {
			name: name.trim(),
			description: description.trim()
		};
	}

	return null;
}

/**
 * Parse state variables table from POTJ content
 */
function parseStateTable(content: string): POTJStateVariable[] {
	const stateMatch = content.match(/#### 📊 State Variables\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
	if (!stateMatch) return [];
	
	const rows = stateMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
	return rows.map(row => {
		const cells = row.split('|').map(c => c.trim()).filter(Boolean);
		return {
			name: cells[0] || '',
			type: cells[1] === '-' ? null : cells[1] || null,
			initialValue: cells[2] === '-' ? null : cells[2] || null,
			line: parseInt(cells[3]) || 0,
			isState: true,
			isDerived: false
		};
	}).filter(s => s.name);
}

/**
 * Parse functions table from POTJ content
 */
function parseFunctionsTable(content: string): POTJFunction[] {
	const funcMatch = content.match(/#### ⚡ Functions\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
	if (!funcMatch) return [];
	
	const rows = funcMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
	return rows.map(row => {
		const cells = row.split('|').map(c => c.trim()).filter(Boolean);
		const linesStr = cells[4] || '0-0';
		const [startLine, endLine] = linesStr.split('-').map(Number);
		return {
			name: cells[0] || '',
			params: cells[1] || '()',
			returnType: cells[2] === 'void' || cells[2] === '-' ? null : cells[2] || null,
			isAsync: cells[3] === '✅',
			isExported: false,
			line: startLine || 0,
			endLine: endLine || startLine || 0
		};
	}).filter(f => f.name);
}

/**
 * Parse imports section from POTJ content
 */
function parseImportsSection(content: string): { projectFiles: POTJImport[], frameworkModules: POTJImport[] } {
	const projectFiles: POTJImport[] = [];
	const frameworkModules: POTJImport[] = [];
	
	// Parse project files table
	const projectMatch = content.match(/\*\*Project Files:\*\*\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n\*\*|\n####|\n---|\n###|$)/);
	if (projectMatch) {
		const rows = projectMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
		for (const row of rows) {
			const cells = row.split('|').map(c => c.trim()).filter(Boolean);
			if (cells.length >= 3) {
				const importName = cells[0];
				projectFiles.push({
					path: cells[1] || '',
					imports: importName.includes(',') ? importName.split(',').map(s => s.trim()) : [],
					defaultImport: importName.includes(',') ? null : importName,
					category: cells[2] || 'unknown',
					line: 0
				});
			}
		}
	}
	
	// Parse framework modules list
	const frameworkMatch = content.match(/\*\*Framework Modules:\*\*\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
	if (frameworkMatch) {
		const lines = frameworkMatch[1].trim().split('\n').filter(l => l.startsWith('-'));
		for (const line of lines) {
			const match = line.match(/`([^`]+)`\s+from\s+`([^`]+)`/);
			if (match) {
				frameworkModules.push({
					path: match[2],
					imports: [match[1]],
					defaultImport: null,
					category: 'svelte',
					line: 0
				});
			}
		}
	}
	
	return { projectFiles, frameworkModules };
}

/**
 * Parse analysis metadata from POTJ content
 */
function parseAnalysisMetadata(content: string): { analyzedAt: string; stateCount: number; functionCount: number; importCount: number } | null {
	const metaMatch = content.match(/#### 📈 Analysis Metadata\n([\s\S]*?)(?=\n---|\n###|$)/);
	if (!metaMatch) return null;
	
	const text = metaMatch[1];
	const analyzedAt = text.match(/\*\*Analyzed At\*\*:\s*(.+)/)?.[1]?.trim() || new Date().toISOString();
	const stateCount = parseInt(text.match(/\*\*State Count\*\*:\s*(\d+)/)?.[1] || '0');
	const functionCount = parseInt(text.match(/\*\*Function Count\*\*:\s*(\d+)/)?.[1] || '0');
	const importCount = parseInt(text.match(/\*\*Import Count\*\*:\s*(\d+)/)?.[1] || '0');
	
	return { analyzedAt, stateCount, functionCount, importCount };
}

/**
 * Parse complete analysis from POTJ content
 */
function parseAnalysis(content: string): POTJAnalysis | undefined {
	const state = parseStateTable(content);
	const functions = parseFunctionsTable(content);
	const imports = parseImportsSection(content);
	const metadata = parseAnalysisMetadata(content);
	
	// Only return analysis if there's actual data
	if (state.length || functions.length || imports.projectFiles.length || imports.frameworkModules.length) {
		return {
			state: state.length ? state : undefined,
			functions: functions.length ? functions : undefined,
			imports: (imports.projectFiles.length || imports.frameworkModules.length) ? imports : undefined,
			metadata: metadata || undefined
		};
	}
	
	return undefined;
}

export function extractFileReferencesFromJourney(journey: RootJourney): string[] {
	const files = new Set<string>();
	
	const allPOTJs = [
		...journey.sections.beginning.items,
		...journey.sections.middle.items,
		...journey.sections.end.items
	];

	for (const potj of allPOTJs) {
		// Main file reference
		if (potj.fileRef) {
			files.add(potj.fileRef);
		}
		
		// Dependencies (e.g., @/lib/api/auth.ts, @/routes/api/chat/+server.ts)
		if (potj.dependencies) {
			for (const dep of potj.dependencies) {
				files.add(dep);
			}
		}
		
		// Code reference file
		if (potj.codeReference?.file) {
			files.add(potj.codeReference.file);
		}
	}

	return Array.from(files);
}
