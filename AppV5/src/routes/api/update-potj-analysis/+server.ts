import { json } from '@sveltejs/kit';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { analyzeFile } from '$lib/server/file-analyzer';
import { parseJourneyMarkdown } from '$lib/server/journey-parser';
import type { RequestHandler } from './$types';
import type { POTJAnalysis } from '$lib/types/journey';

/**
 * Check if import path is a framework module
 */
function isFrameworkModule(path: string): boolean {
	const frameworkPrefixes = ['$app/', '$env/', 'svelte/', 'svelte', '@sveltejs/'];
	return frameworkPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * POST /api/update-potj-analysis
 * Re-analyze a single POTJ's file and update the journey markdown
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { journeyId, potjId, projectPath } = await request.json();

		console.log('[update-potj-analysis] Request received');
		console.log('[update-potj-analysis] journeyId:', journeyId);
		console.log('[update-potj-analysis] potjId:', potjId);
		console.log('[update-potj-analysis] projectPath:', projectPath);

		if (!journeyId || !potjId || !projectPath) {
			return json({ error: 'journeyId, potjId, and projectPath are required' }, { status: 400 });
		}

		// Load the journey file
		const journeysDir = join(projectPath, 'journeys');
		const journeyPath = join(journeysDir, `${journeyId}.journey.md`);
		
		let journeyContent: string;
		try {
			journeyContent = await readFile(journeyPath, 'utf-8');
		} catch {
			return json({ error: `Journey file not found: ${journeyId}.journey.md` }, { status: 404 });
		}

		// Parse the journey to find the POTJ
		const journey = parseJourneyMarkdown(journeyContent);
		if (!journey) {
			return json({ error: 'Failed to parse journey file' }, { status: 500 });
		}

		// Find the POTJ
		const allPOTJs = [
			...journey.sections.beginning.items,
			...journey.sections.middle.items,
			...journey.sections.end.items
		];
		const potj = allPOTJs.find(p => p.id === potjId);
		
		if (!potj) {
			return json({ error: `POTJ not found: ${potjId}` }, { status: 404 });
		}

		if (!potj.fileRef) {
			return json({ error: 'POTJ has no file reference' }, { status: 400 });
		}

		// Analyze the file
		const filePath = potj.fileRef.startsWith('@/') 
			? potj.fileRef.slice(2) 
			: potj.fileRef.startsWith('/') 
				? potj.fileRef.slice(1) 
				: potj.fileRef;
		
		const fullPath = join(projectPath, 'src', filePath);
		console.log('[update-potj-analysis] Analyzing file:', fullPath);

		let fileAnalysis;
		try {
			fileAnalysis = await analyzeFile(fullPath);
		} catch (err) {
			console.error('[update-potj-analysis] Analysis failed:', err);
			return json({ error: `Failed to analyze file: ${filePath}` }, { status: 500 });
		}

		// Build the analysis object
		const projectImports = fileAnalysis.imports.filter(i => !isFrameworkModule(i.path));
		const frameworkImports = fileAnalysis.imports.filter(i => isFrameworkModule(i.path));

		const analysis: POTJAnalysis = {
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

		// Update the POTJ in the journey content
		// We need to rebuild the POTJ section with the new analysis
		const updatedPOTJ = { ...potj, analysis };
		
		// Generate the new POTJ markdown
		const newPOTJMarkdown = generatePOTJMarkdown(updatedPOTJ);
		
		// Replace the POTJ section in the journey content
		const potjRegex = new RegExp(
			`### \\[POTJ:${potjId}\\][\\s\\S]*?(?=### \\[POTJ:|## 🟢|## 🟡|## 🔴|## Journey Metadata|$)`,
			'g'
		);
		
		const updatedContent = journeyContent.replace(potjRegex, newPOTJMarkdown + '\n');
		
		// Write back to file
		await writeFile(journeyPath, updatedContent, 'utf-8');
		
		console.log('[update-potj-analysis] Updated POTJ:', potjId);

		return json({
			success: true,
			potjId,
			analysis,
			message: `Updated analysis for ${potjId}`
		});
	} catch (error) {
		console.error('[update-potj-analysis] Error:', error);
		return json(
			{
				error: 'Failed to update POTJ analysis',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * Generate markdown for a single POTJ (simplified version for updates)
 */
function generatePOTJMarkdown(potj: any): string {
	const lines: string[] = [];

	lines.push(`### [POTJ:${potj.id}] ${potj.title}`);

	if (potj.moduleType) {
		lines.push(`**Type**: ${potj.moduleType}`);
	}
	if (potj.fileRef) {
		const fileRef = potj.fileRef.startsWith('@/') ? potj.fileRef : `@/${potj.fileRef}`;
		lines.push(`**File**: \`${fileRef}\``);
	}
	if (potj.tags && potj.tags.length > 0) {
		lines.push(`**Tags**: ${potj.tags.map((t: string) => `#${t}`).join(' ')}`);
	}

	lines.push('');

	if (potj.description) {
		lines.push(potj.description);
		lines.push('');
	}

	if (potj.keyBehavior && potj.keyBehavior.length > 0) {
		lines.push('**Key Behavior**:');
		for (const behavior of potj.keyBehavior) {
			lines.push(`- ${behavior}`);
		}
		lines.push('');
	}

	if (potj.dependencies && potj.dependencies.length > 0) {
		lines.push('**Dependencies**:');
		for (const dep of potj.dependencies) {
			lines.push(`- Uses \`@/${dep}\``);
		}
		lines.push('');
	}

	// Add analysis sections
	if (potj.analysis) {
		if (potj.analysis.state && potj.analysis.state.length > 0) {
			lines.push('#### 📊 State Variables');
			lines.push('| Variable | Type | Initial Value | Line |');
			lines.push('|----------|------|---------------|------|');
			for (const s of potj.analysis.state) {
				const type = s.type || '-';
				const initial = s.initialValue || '-';
				lines.push(`| ${s.name} | ${type.replace(/\|/g, '\\|')} | ${initial.replace(/\|/g, '\\|')} | ${s.line} |`);
			}
			lines.push('');
		}

		if (potj.analysis.functions && potj.analysis.functions.length > 0) {
			lines.push('#### ⚡ Functions');
			lines.push('| Function | Parameters | Returns | Async | Lines |');
			lines.push('|----------|------------|---------|-------|-------|');
			for (const f of potj.analysis.functions) {
				const params = (f.params || '()').replace(/\|/g, '\\|');
				const returns = (f.returnType || 'void').replace(/\|/g, '\\|');
				const async = f.isAsync ? '✅' : '❌';
				lines.push(`| ${f.name} | ${params} | ${returns} | ${async} | ${f.line}-${f.endLine} |`);
			}
			lines.push('');
		}

		if (potj.analysis.imports) {
			const { projectFiles, frameworkModules } = potj.analysis.imports;
			if (projectFiles?.length || frameworkModules?.length) {
				lines.push('#### 📦 Imports');
				
				if (projectFiles?.length) {
					lines.push('**Project Files:**');
					lines.push('| Import | From | Type |');
					lines.push('|--------|------|------|');
					for (const i of projectFiles) {
						const importName = i.defaultImport || i.imports?.join(', ') || '-';
						lines.push(`| ${importName} | ${i.path} | ${i.category} |`);
					}
					lines.push('');
				}
				
				if (frameworkModules?.length) {
					lines.push('**Framework Modules:**');
					for (const i of frameworkModules) {
						const importName = i.defaultImport || i.imports?.join(', ');
						lines.push(`- \`${importName}\` from \`${i.path}\``);
					}
					lines.push('');
				}
			}
		}

		if (potj.analysis.metadata) {
			lines.push('#### 📈 Analysis Metadata');
			lines.push(`- **Analyzed At**: ${potj.analysis.metadata.analyzedAt}`);
			lines.push(`- **State Count**: ${potj.analysis.metadata.stateCount}`);
			lines.push(`- **Function Count**: ${potj.analysis.metadata.functionCount}`);
			lines.push(`- **Import Count**: ${potj.analysis.metadata.importCount}`);
			lines.push('');
		}
	}

	lines.push('---');
	lines.push('');

	return lines.join('\n');
}
