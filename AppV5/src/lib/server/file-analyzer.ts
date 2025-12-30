import { readFile } from 'fs/promises';
import { extname } from 'path';

export interface StateVariable {
	name: string;
	type: string | null;
	initialValue: string | null;
	line: number;
	isState: boolean;
	isDerived: boolean;
}

export interface FunctionDefinition {
	name: string;
	params: string;
	returnType: string | null;
	isAsync: boolean;
	isExported: boolean;
	line: number;
	endLine: number;
}

export interface ImportDefinition {
	path: string;
	imports: string[];
	defaultImport: string | null;
	category: 'component' | 'utility' | 'type' | 'store' | 'external' | 'svelte' | 'unknown';
	line: number;
}

export interface PropDefinition {
	name: string;
	type: string | null;
	defaultValue: string | null;
	line: number;
}

export interface FileAnalysis {
	filePath: string;
	fileType: 'svelte' | 'typescript' | 'javascript' | 'unknown';
	state: StateVariable[];
	props: PropDefinition[];
	functions: FunctionDefinition[];
	imports: ImportDefinition[];
	summary: {
		stateCount: number;
		functionCount: number;
		importCount: number;
		propCount: number;
	};
	analyzedAt: string;
}

/**
 * Analyze a file and extract its structure
 */
export async function analyzeFile(filePath: string): Promise<FileAnalysis> {
	const content = await readFile(filePath, 'utf-8');
	const ext = extname(filePath).toLowerCase();

	let fileType: FileAnalysis['fileType'] = 'unknown';
	let scriptContent = content;

	if (ext === '.svelte') {
		fileType = 'svelte';
		scriptContent = extractSvelteScript(content);
	} else if (ext === '.ts') {
		fileType = 'typescript';
	} else if (ext === '.js') {
		fileType = 'javascript';
	}

	const state = extractStateVariables(scriptContent);
	const props = extractProps(scriptContent);
	const functions = extractFunctions(scriptContent);
	const imports = extractImports(scriptContent);

	return {
		filePath,
		fileType,
		state,
		props,
		functions,
		imports,
		summary: {
			stateCount: state.length,
			functionCount: functions.length,
			importCount: imports.length,
			propCount: props.length
		},
		analyzedAt: new Date().toISOString()
	};
}

/**
 * Extract script content from a Svelte file
 */
function extractSvelteScript(content: string): string {
	// Match <script> or <script lang="ts">
	const scriptRegex = /<script(?:\s+[^>]*)?>[\s\S]*?<\/script>/gi;
	const matches = content.match(scriptRegex);

	if (!matches) return '';

	// Combine all script blocks, removing the tags
	return matches
		.map((match) => {
			return match.replace(/<script(?:\s+[^>]*)?>/, '').replace(/<\/script>/, '');
		})
		.join('\n');
}

/**
 * Extract state variables ($state, $derived, let declarations)
 */
function extractStateVariables(content: string): StateVariable[] {
	const variables: StateVariable[] = [];
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Match $state() declarations: let name = $state(value)
		const stateMatch = line.match(/let\s+(\w+)\s*(?::\s*([^=]+))?\s*=\s*\$state\s*[<(]([^)]*)[)>]?/);
		if (stateMatch) {
			variables.push({
				name: stateMatch[1],
				type: stateMatch[2]?.trim() || inferType(stateMatch[3]),
				initialValue: stateMatch[3]?.trim() || null,
				line: lineNum,
				isState: true,
				isDerived: false
			});
			continue;
		}

		// Match $derived() declarations: let name = $derived(expression)
		const derivedMatch = line.match(/let\s+(\w+)\s*(?::\s*([^=]+))?\s*=\s*\$derived\s*\(([^)]*)\)/);
		if (derivedMatch) {
			variables.push({
				name: derivedMatch[1],
				type: derivedMatch[2]?.trim() || null,
				initialValue: derivedMatch[3]?.trim() || null,
				line: lineNum,
				isState: false,
				isDerived: true
			});
			continue;
		}

		// Match regular let declarations with initial value: let name = value
		// Skip if it's a $state or $derived (already handled)
		if (!line.includes('$state') && !line.includes('$derived') && !line.includes('$props')) {
			const letMatch = line.match(/let\s+(\w+)\s*(?::\s*([^=]+))?\s*=\s*(.+?);?\s*$/);
			if (letMatch) {
				variables.push({
					name: letMatch[1],
					type: letMatch[2]?.trim() || inferType(letMatch[3]),
					initialValue: letMatch[3]?.trim().replace(/;$/, '') || null,
					line: lineNum,
					isState: false,
					isDerived: false
				});
			}
		}
	}

	return variables;
}

/**
 * Extract props from $props() declarations
 */
function extractProps(content: string): PropDefinition[] {
	const props: PropDefinition[] = [];
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Match $props() with destructuring
		// let { prop1, prop2 = default }: { prop1: Type } = $props()
		const propsMatch = line.match(/let\s*\{\s*([^}]+)\}\s*(?::\s*\{([^}]+)\})?\s*=\s*\$props\s*\(\)/);
		if (propsMatch) {
			const propsList = propsMatch[1];
			const typeAnnotations = propsMatch[2] || '';

			// Parse individual props
			const propParts = propsList.split(',').map((p) => p.trim());
			for (const part of propParts) {
				if (!part) continue;

				// Check for default value: prop = defaultValue
				const defaultMatch = part.match(/(\w+)\s*=\s*(.+)/);
				if (defaultMatch) {
					const propName = defaultMatch[1];
					const defaultValue = defaultMatch[2];
					const type = extractPropType(propName, typeAnnotations);
					props.push({
						name: propName,
						type,
						defaultValue,
						line: lineNum
					});
				} else {
					// No default value
					const propName = part.trim();
					const type = extractPropType(propName, typeAnnotations);
					props.push({
						name: propName,
						type,
						defaultValue: null,
						line: lineNum
					});
				}
			}
		}
	}

	return props;
}

/**
 * Extract prop type from type annotations
 */
function extractPropType(propName: string, typeAnnotations: string): string | null {
	if (!typeAnnotations) return null;

	// Look for propName: Type in the annotations
	const regex = new RegExp(`${propName}\\s*[?]?\\s*:\\s*([^;,}]+)`);
	const match = typeAnnotations.match(regex);
	return match ? match[1].trim() : null;
}

/**
 * Find the end line of a function by counting braces
 */
function findFunctionEndLine(lines: string[], startIndex: number): number {
	let braceCount = 0;
	let foundFirstBrace = false;
	
	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i];
		
		for (const char of line) {
			if (char === '{') {
				braceCount++;
				foundFirstBrace = true;
			} else if (char === '}') {
				braceCount--;
				if (foundFirstBrace && braceCount === 0) {
					return i + 1; // Return 1-indexed line number
				}
			}
		}
	}
	
	// If we can't find the end, return start + 1 as fallback
	return startIndex + 2;
}

/**
 * Extract function definitions
 */
function extractFunctions(content: string): FunctionDefinition[] {
	const functions: FunctionDefinition[] = [];
	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Match async function declarations
		const asyncFuncMatch = line.match(
			/(export\s+)?async\s+function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/
		);
		if (asyncFuncMatch) {
			const endLine = findFunctionEndLine(lines, i);
			functions.push({
				name: asyncFuncMatch[2],
				params: asyncFuncMatch[3]?.trim() || '',
				returnType: asyncFuncMatch[4]?.trim() || 'Promise<void>',
				isAsync: true,
				isExported: !!asyncFuncMatch[1],
				line: lineNum,
				endLine
			});
			continue;
		}

		// Match regular function declarations
		const funcMatch = line.match(/(export\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/);
		if (funcMatch) {
			const endLine = findFunctionEndLine(lines, i);
			functions.push({
				name: funcMatch[2],
				params: funcMatch[3]?.trim() || '',
				returnType: funcMatch[4]?.trim() || 'void',
				isAsync: false,
				isExported: !!funcMatch[1],
				line: lineNum,
				endLine
			});
			continue;
		}

		// Match arrow functions assigned to const/let
		const arrowMatch = line.match(
			/(export\s+)?(const|let)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*(?::\s*([^=]+))?\s*=>/
		);
		if (arrowMatch) {
			const endLine = findFunctionEndLine(lines, i);
			functions.push({
				name: arrowMatch[3],
				params: extractArrowParams(line),
				returnType: arrowMatch[5]?.trim() || null,
				isAsync: !!arrowMatch[4],
				isExported: !!arrowMatch[1],
				line: lineNum,
				endLine
			});
		}
	}

	return functions;
}

/**
 * Extract parameters from arrow function
 */
function extractArrowParams(line: string): string {
	const match = line.match(/=\s*(?:async\s+)?\(([^)]*)\)/);
	return match ? match[1].trim() : '';
}

/**
 * Extract import statements
 */
function extractImports(content: string): ImportDefinition[] {
	const imports: ImportDefinition[] = [];
	const lines = content.split('\n');

	console.log('[file-analyzer.extractImports] Starting import extraction');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Match import statements
		const importMatch = line.match(
			/import\s+(?:(?:(\w+),?\s*)?(?:\{([^}]+)\})?\s+from\s+)?['"]([^'"]+)['"]/
		);
		if (importMatch) {
			const defaultImport = importMatch[1] || null;
			const namedImports = importMatch[2]
				? importMatch[2]
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: [];
			const path = importMatch[3];

			console.log(`[file-analyzer.extractImports] Found import: "${path}" (line ${lineNum})`);

			imports.push({
				path,
				imports: namedImports,
				defaultImport,
				category: categorizeImport(path),
				line: lineNum
			});
		}
	}

	console.log(`[file-analyzer.extractImports] Total imports found: ${imports.length}`);
	return imports;
}

/**
 * Categorize import by path
 */
function categorizeImport(
	path: string
): 'component' | 'utility' | 'type' | 'store' | 'external' | 'svelte' | 'unknown' {
	if (path.startsWith('svelte') || path === 'svelte') {
		return 'svelte';
	}
	if (path.includes('/components/') || path.endsWith('.svelte')) {
		return 'component';
	}
	if (path.includes('/stores/') || path.includes('store')) {
		return 'store';
	}
	if (path.includes('/types/') || path.includes('type')) {
		return 'type';
	}
	if (path.includes('/utils/') || path.includes('/lib/')) {
		return 'utility';
	}
	if (!path.startsWith('.') && !path.startsWith('$')) {
		return 'external';
	}
	return 'unknown';
}

/**
 * Infer type from initial value
 */
function inferType(value: string | undefined): string | null {
	if (!value) return null;

	const trimmed = value.trim();

	if (trimmed === 'null') return 'null';
	if (trimmed === 'undefined') return 'undefined';
	if (trimmed === 'true' || trimmed === 'false') return 'boolean';
	if (trimmed === '[]' || trimmed.startsWith('[')) return 'array';
	if (trimmed === '{}' || trimmed.startsWith('{')) return 'object';
	if (trimmed.startsWith("'") || trimmed.startsWith('"') || trimmed.startsWith('`'))
		return 'string';
	if (!isNaN(Number(trimmed))) return 'number';
	if (trimmed.startsWith('new Map')) return 'Map';
	if (trimmed.startsWith('new Set')) return 'Set';

	return null;
}
