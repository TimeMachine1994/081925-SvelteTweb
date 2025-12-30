import { json } from '@sveltejs/kit';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { analyzeFile } from '$lib/server/file-analyzer';
import { parseJourneyMarkdown } from '$lib/server/journey-parser';
import type { RequestHandler } from './$types';
import type { POTJ, POTJAnalysis } from '$lib/types/journey';

/**
 * Check if import path is a framework module
 */
function isFrameworkModule(path: string): boolean {
	const frameworkPrefixes = ['$app/', '$env/', 'svelte/', 'svelte', '@sveltejs/'];
	return frameworkPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * POST /api/reanalyze-journey
 * Re-analyze all POTJs in a journey and update the markdown file
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { journeyId, projectPath } = await request.json();

		console.log('[reanalyze-journey] Request received');
		console.log('[reanalyze-journey] journeyId:', journeyId);
		console.log('[reanalyze-journey] projectPath:', projectPath);

		if (!journeyId || !projectPath) {
			return json({ error: 'journeyId and projectPath are required' }, { status: 400 });
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

		// Parse the journey
		const journey = parseJourneyMarkdown(journeyContent);
		if (!journey) {
			return json({ error: 'Failed to parse journey file' }, { status: 500 });
		}

		// Collect all POTJs
		const allPOTJs = [
			...journey.sections.beginning.items,
			...journey.sections.middle.items,
			...journey.sections.end.items
		];

		let analyzed = 0;
		let skipped = 0;
		let failed = 0;
		const errors: string[] = [];

		// Analyze each POTJ with a file reference
		for (const potj of allPOTJs) {
			if (!potj.fileRef) {
				skipped++;
				continue;
			}

			try {
				const filePath = potj.fileRef.startsWith('@/') 
					? potj.fileRef.slice(2) 
					: potj.fileRef.startsWith('/') 
						? potj.fileRef.slice(1) 
						: potj.fileRef;
				
				const fullPath = join(projectPath, 'src', filePath);
				console.log(`[reanalyze-journey] Analyzing ${potj.id}: ${filePath}`);

				const fileAnalysis = await analyzeFile(fullPath);

				// Build the analysis object
				const projectImports = fileAnalysis.imports.filter(i => !isFrameworkModule(i.path));
				const frameworkImports = fileAnalysis.imports.filter(i => isFrameworkModule(i.path));

				potj.analysis = {
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

				analyzed++;
			} catch (err) {
				failed++;
				const errorMsg = `${potj.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
				errors.push(errorMsg);
				console.warn(`[reanalyze-journey] Failed to analyze ${potj.id}:`, err);
			}
		}

		// Regenerate the entire journey markdown
		const updatedContent = regenerateJourneyMarkdown(journeyContent, journey);
		
		// Write back to file
		await writeFile(journeyPath, updatedContent, 'utf-8');
		
		console.log(`[reanalyze-journey] Complete: ${analyzed} analyzed, ${skipped} skipped, ${failed} failed`);

		return json({
			success: true,
			journeyId,
			stats: {
				total: allPOTJs.length,
				analyzed,
				skipped,
				failed
			},
			errors: errors.length > 0 ? errors : undefined,
			message: `Re-analyzed ${analyzed} POTJs in ${journeyId}`
		});
	} catch (error) {
		console.error('[reanalyze-journey] Error:', error);
		return json(
			{
				error: 'Failed to re-analyze journey',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * Regenerate the journey markdown with updated POTJs
 */
function regenerateJourneyMarkdown(originalContent: string, journey: any): string {
	// Extract frontmatter and header from original
	const frontmatterMatch = originalContent.match(/^---[\s\S]*?---/);
	const frontmatter = frontmatterMatch ? frontmatterMatch[0] : '';
	
	// Extract header (everything between frontmatter and first section)
	const headerMatch = originalContent.match(/---\n\n([\s\S]*?)(?=## 🟢)/);
	const header = headerMatch ? headerMatch[1] : `# ${journey.name}\n\n`;

	const lines: string[] = [];
	
	// Add frontmatter
	lines.push(frontmatter);
	lines.push('');
	
	// Add header
	lines.push(header.trim());
	lines.push('');
	lines.push('---');
	lines.push('');

	// Add sections
	lines.push(...generateSectionMarkdown('🟢 Beginning', journey.sections.beginning.items));
	lines.push(...generateSectionMarkdown('🟡 Middle', journey.sections.middle.items));
	lines.push(...generateSectionMarkdown('🔴 End', journey.sections.end.items));

	// Add metadata footer
	lines.push('## Journey Metadata');
	lines.push('');
	const totalPOTJs =
		journey.sections.beginning.items.length +
		journey.sections.middle.items.length +
		journey.sections.end.items.length;
	lines.push(`**Total POTJs**: ${totalPOTJs}`);
	lines.push(`**Last Re-analyzed**: ${new Date().toISOString()}`);
	lines.push('');

	return lines.join('\n');
}

function generateSectionMarkdown(title: string, potjs: POTJ[]): string[] {
	const lines: string[] = [];

	lines.push(`## ${title}`);
	lines.push('');

	if (potjs.length === 0) {
		lines.push('*No entries in this section*');
		lines.push('');
	}

	for (const potj of potjs) {
		lines.push(...generatePOTJMarkdown(potj));
	}

	lines.push('---');
	lines.push('');

	return lines;
}

function generatePOTJMarkdown(potj: POTJ): string[] {
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
		lines.push(`**Tags**: ${potj.tags.map(t => `#${t}`).join(' ')}`);
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
			const depPath = dep.startsWith('$lib') ? dep.replace('$lib/', 'lib/') : dep;
			lines.push(`- Uses \`@/${depPath}\``);
		}
		lines.push('');
	}

	if (potj.parentLayout) {
		const layoutRef = potj.parentLayout.startsWith('@/') ? potj.parentLayout : `@/${potj.parentLayout}`;
		lines.push(`**Parent Layout**: \`${layoutRef}\``);
		lines.push('');
	}

	// Add analysis sections
	if (potj.analysis) {
		if (potj.analysis.state && potj.analysis.state.length > 0) {
			lines.push('#### 📊 State Variables');
			lines.push('| Variable | Type | Initial Value | Line |');
			lines.push('|----------|------|---------------|------|');
			for (const s of potj.analysis.state) {
				const type = (s.type || '-').replace(/\|/g, '\\|').replace(/\n/g, ' ');
				const initial = (s.initialValue || '-').replace(/\|/g, '\\|').replace(/\n/g, ' ');
				lines.push(`| ${s.name} | ${type} | ${initial} | ${s.line} |`);
			}
			lines.push('');
		}

		if (potj.analysis.functions && potj.analysis.functions.length > 0) {
			lines.push('#### ⚡ Functions');
			lines.push('| Function | Parameters | Returns | Async | Lines |');
			lines.push('|----------|------------|---------|-------|-------|');
			for (const f of potj.analysis.functions) {
				const params = (f.params || '()').replace(/\|/g, '\\|').replace(/\n/g, ' ');
				const returns = (f.returnType || 'void').replace(/\|/g, '\\|').replace(/\n/g, ' ');
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
						const importName = (i.defaultImport || i.imports?.join(', ') || '-').replace(/\|/g, '\\|');
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

	return lines;
}
