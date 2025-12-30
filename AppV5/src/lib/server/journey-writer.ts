import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { RootJourney, POTJ, POTJStateVariable, POTJFunction, POTJImport } from '$lib/types/journey';

interface JourneyMeta {
	persona: string;
	goal: string;
}

/**
 * Write a journey to markdown file
 */
export async function writeJourneyMarkdown(
	journey: RootJourney,
	journeysDir: string,
	metadata: JourneyMeta
): Promise<string> {
	const content = generateJourneyMarkdown(journey, metadata);

	// Ensure journeys directory exists
	await mkdir(journeysDir, { recursive: true });

	const filePath = join(journeysDir, `${journey.id}.journey.md`);
	await writeFile(filePath, content, 'utf-8');

	console.log(`[JourneyWriter] Wrote ${filePath}`);
	return filePath;
}

/**
 * Update a specific POTJ in an existing journey markdown file
 */
export async function updateJourneyMarkdownFile(
	journeyId: string,
	potjId: string,
	updatedPOTJ: POTJ
): Promise<void> {
	const journeysDir = join(process.cwd(), 'journeys');
	const filePath = join(journeysDir, `${journeyId}.journey.md`);

	const content = await readFile(filePath, 'utf-8');

	// Find and replace the POTJ section
	const potjRegex = new RegExp(
		`### \\[POTJ:${potjId}\\][\\s\\S]*?(?=### \\[POTJ:|## 🟢|## 🟡|## 🔴|## Journey Metadata|$)`,
		'g'
	);

	const newPOTJContent = generatePOTJMarkdown(updatedPOTJ).join('\n');
	const updatedContent = content.replace(potjRegex, newPOTJContent + '\n');

	await writeFile(filePath, updatedContent, 'utf-8');
	console.log(`[JourneyWriter] Updated POTJ ${potjId} in ${filePath}`);
}

/**
 * Generate complete journey markdown content
 */
function generateJourneyMarkdown(journey: RootJourney, metadata: JourneyMeta): string {
	const lines: string[] = [];

	// Frontmatter
	lines.push('---');
	lines.push('type: journey');
	lines.push(`id: ${journey.id}`);
	lines.push(`name: ${journey.name}`);
	lines.push(`generated: ${new Date().toISOString()}`);
	lines.push('generator: journey-scanner-ai');
	lines.push('version: 1.0');
	lines.push('---');
	lines.push('');

	// Header
	lines.push(`# ${journey.name}`);
	lines.push('');
	lines.push(`**User Persona**: ${metadata.persona}`);
	lines.push('');
	lines.push(`**Journey Goal**: ${metadata.goal}`);
	lines.push('');
	lines.push('---');
	lines.push('');

	// Sections
	lines.push(...generateSectionMarkdown('🟢 Beginning', journey.sections.beginning.items));
	lines.push(...generateSectionMarkdown('🟡 Middle', journey.sections.middle.items));
	lines.push(...generateSectionMarkdown('🔴 End', journey.sections.end.items));

	// Metadata footer
	lines.push('## Journey Metadata');
	lines.push('');
	const totalPOTJs =
		journey.sections.beginning.items.length +
		journey.sections.middle.items.length +
		journey.sections.end.items.length;
	lines.push(`**Total POTJs**: ${totalPOTJs}`);
	lines.push(`**Generated**: ${new Date().toISOString()}`);
	lines.push('');

	return lines.join('\n');
}

/**
 * Generate markdown for a section
 */
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

/**
 * Escape special markdown characters in table cells
 */
function escapeMarkdown(text: string | null | undefined): string {
	if (!text) return '-';
	return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Check if import path is a framework module
 */
function isFrameworkModule(path: string): boolean {
	const frameworkPrefixes = ['$app/', '$env/', 'svelte/', 'svelte', '@sveltejs/'];
	return frameworkPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * Format state variables as markdown table
 */
function formatStateTable(state: POTJStateVariable[]): string[] {
	if (!state.length) return [];
	
	const lines: string[] = [];
	lines.push('#### 📊 State Variables');
	lines.push('| Variable | Type | Initial Value | Line |');
	lines.push('|----------|------|---------------|------|');
	
	for (const s of state) {
		lines.push(`| ${s.name} | ${escapeMarkdown(s.type)} | ${escapeMarkdown(s.initialValue)} | ${s.line} |`);
	}
	lines.push('');
	
	return lines;
}

/**
 * Format functions as markdown table
 */
function formatFunctionsTable(functions: POTJFunction[]): string[] {
	if (!functions.length) return [];
	
	const lines: string[] = [];
	lines.push('#### ⚡ Functions');
	lines.push('| Function | Parameters | Returns | Async | Lines |');
	lines.push('|----------|------------|---------|-------|-------|');
	
	for (const f of functions) {
		const asyncIcon = f.isAsync ? '✅' : '❌';
		lines.push(`| ${f.name} | ${escapeMarkdown(f.params || '()')} | ${escapeMarkdown(f.returnType || 'void')} | ${asyncIcon} | ${f.line}-${f.endLine} |`);
	}
	lines.push('');
	
	return lines;
}

/**
 * Format imports as markdown section
 */
function formatImportsSection(imports: { projectFiles: POTJImport[], frameworkModules: POTJImport[] }): string[] {
	const { projectFiles, frameworkModules } = imports;
	if (!projectFiles.length && !frameworkModules.length) return [];
	
	const lines: string[] = [];
	lines.push('#### 📦 Imports');
	
	if (projectFiles.length) {
		lines.push('**Project Files:**');
		lines.push('| Import | From | Type |');
		lines.push('|--------|------|------|');
		for (const i of projectFiles) {
			const importName = i.defaultImport || i.imports.join(', ') || '-';
			lines.push(`| ${escapeMarkdown(importName)} | ${i.path} | ${i.category} |`);
		}
		lines.push('');
	}
	
	if (frameworkModules.length) {
		lines.push('**Framework Modules:**');
		for (const i of frameworkModules) {
			const importName = i.defaultImport || i.imports.join(', ');
			lines.push(`- \`${importName}\` from \`${i.path}\``);
		}
		lines.push('');
	}
	
	return lines;
}

/**
 * Format analysis metadata
 */
function formatAnalysisMetadata(metadata: { analyzedAt: string; stateCount: number; functionCount: number; importCount: number }): string[] {
	const lines: string[] = [];
	lines.push('#### 📈 Analysis Metadata');
	lines.push(`- **Analyzed At**: ${metadata.analyzedAt}`);
	lines.push(`- **State Count**: ${metadata.stateCount}`);
	lines.push(`- **Function Count**: ${metadata.functionCount}`);
	lines.push(`- **Import Count**: ${metadata.importCount}`);
	lines.push('');
	return lines;
}

/**
 * Generate markdown for a single POTJ
 */
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
	if (potj.metadata?.level) {
		lines.push(`**Level**: L${potj.metadata.level}`);
	}
	if (potj.tags && potj.tags.length > 0) {
		lines.push(`**Tags**: ${potj.tags.map((t) => `#${t}`).join(' ')}`);
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

	if (potj.codeReference && potj.codeReference.code) {
		const fileRef = potj.codeReference.file.startsWith('@/')
			? potj.codeReference.file
			: `@/${potj.codeReference.file}`;
		lines.push(`**Code Reference** \`${fileRef}:${potj.codeReference.lines}\`:`);
		lines.push(`\`\`\`${potj.codeReference.language}`);
		lines.push(potj.codeReference.code);
		lines.push('```');
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
		const layoutRef = potj.parentLayout.startsWith('@/')
			? potj.parentLayout
			: `@/${potj.parentLayout}`;
		lines.push(`**Parent Layout**: \`${layoutRef}\``);
		lines.push('');
	}

	if (potj.notes && potj.notes.length > 0) {
		lines.push('**Notes**:');
		for (const note of potj.notes) {
			lines.push(`> ${note}`);
		}
		lines.push('');
	}

	// Add analysis sections if present
	if (potj.analysis) {
		if (potj.analysis.state && potj.analysis.state.length > 0) {
			lines.push(...formatStateTable(potj.analysis.state));
		}
		if (potj.analysis.functions && potj.analysis.functions.length > 0) {
			lines.push(...formatFunctionsTable(potj.analysis.functions));
		}
		if (potj.analysis.imports) {
			lines.push(...formatImportsSection(potj.analysis.imports));
		}
		if (potj.analysis.metadata) {
			lines.push(...formatAnalysisMetadata(potj.analysis.metadata));
		}
	}

	lines.push('---');
	lines.push('');

	return lines;
}
