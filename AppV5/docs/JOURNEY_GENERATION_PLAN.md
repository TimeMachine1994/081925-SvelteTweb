# AI-Powered Journey Generation Plan

> **Status:** ✅ Complete  
> **Created:** December 30, 2025  
> **Completed:** December 30, 2025  
> **Purpose:** Automatically generate journey markdown files from scanning a new codebase

---

## Problem Statement

Currently, journey files must be manually authored. The vision describes:
> "When you first launch the application or point it at a new codebase, the scanner analyzes your project structure. Using AI (powered by Gemini), it examines your files, identifies user flows, and automatically generates Journey markdown files."

This is a one-time heavy operation that creates the initial journey documentation for a project.

---

## Solution Overview

### Core Components

1. **Route Analyzer** - Identify all routes and their relationships
2. **Import Graph Builder** - Map dependencies between files
3. **Journey Classifier** - Use AI to identify persona journeys
4. **POTJ Generator** - Generate detailed POTJ entries for each route
5. **Journey Writer** - Output formatted `.journey.md` files
6. **Generation UI** - "Generate Journeys" button with progress

---

## Phase 1: Route Structure Analyzer

### New File: `src/lib/server/route-analyzer.ts`

```typescript
import { readdir, readFile, stat, access } from 'fs/promises';
import { join, relative, basename, dirname } from 'path';

export interface RouteInfo {
  path: string;              // e.g., "/admin/users"
  filePath: string;          // e.g., "routes/admin/users/+page.svelte"
  type: 'page' | 'layout' | 'server' | 'api';
  hasServerLogic: boolean;
  hasLayout: boolean;
  parentLayout?: string;
  imports: string[];
  content?: string;          // File content for AI analysis
}

export interface RouteTree {
  routes: RouteInfo[];
  layouts: RouteInfo[];
  apiEndpoints: RouteInfo[];
  rootPath: string;
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract import statements from file content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Only include local imports
    if (importPath.startsWith('$lib') || 
        importPath.startsWith('./') || 
        importPath.startsWith('../')) {
      imports.push(importPath);
    }
  }
  
  return imports;
}

/**
 * Scan API routes directory
 */
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
      await scanApiRoutes(
        fullPath, 
        apiEndpoints, 
        projectPath, 
        join(routePath, entry.name)
      );
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

/**
 * Recursively scan routes directory
 */
async function scanRoutesRecursive(
  dir: string,
  routePath: string,
  routes: RouteInfo[],
  layouts: RouteInfo[],
  apiEndpoints: RouteInfo[],
  projectPath: string
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(join(projectPath, 'src'), fullPath);
    
    if (entry.isDirectory()) {
      // Handle route groups like (auth) or (marketing)
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
      const newRoutePath = isGroup ? routePath : join(routePath, entry.name);
      
      // Check for API routes
      if (entry.name === 'api') {
        await scanApiRoutes(fullPath, apiEndpoints, projectPath, '/api');
      } else {
        await scanRoutesRecursive(
          fullPath, 
          newRoutePath, 
          routes, 
          layouts, 
          apiEndpoints, 
          projectPath
        );
      }
    } else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.ts')) {
      const fileContent = await readFile(fullPath, 'utf-8');
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

/**
 * Link routes to their parent layouts
 */
function linkParentLayouts(routes: RouteInfo[], layouts: RouteInfo[]): void {
  for (const route of routes) {
    // Find nearest parent layout
    let currentPath = dirname(route.path);
    while (currentPath && currentPath !== '.' && currentPath !== '/') {
      const parentLayout = layouts.find(l => l.path === currentPath);
      if (parentLayout) {
        route.parentLayout = parentLayout.filePath;
        break;
      }
      currentPath = dirname(currentPath);
    }
    // Root layout
    if (!route.parentLayout) {
      const rootLayout = layouts.find(l => l.path === '/' || l.path === '');
      if (rootLayout) {
        route.parentLayout = rootLayout.filePath;
      }
    }
  }
}

/**
 * Scan routes directory and build route tree
 */
export async function analyzeRoutes(projectPath: string): Promise<RouteTree> {
  const routesDir = join(projectPath, 'src', 'routes');
  const routes: RouteInfo[] = [];
  const layouts: RouteInfo[] = [];
  const apiEndpoints: RouteInfo[] = [];
  
  // Check if routes directory exists
  if (!(await fileExists(routesDir))) {
    throw new Error(`Routes directory not found: ${routesDir}`);
  }
  
  await scanRoutesRecursive(routesDir, '', routes, layouts, apiEndpoints, projectPath);
  
  // Link routes to their parent layouts
  linkParentLayouts(routes, layouts);
  
  console.log(`[RouteAnalyzer] Found ${routes.length} pages, ${layouts.length} layouts, ${apiEndpoints.length} API endpoints`);
  
  return {
    routes,
    layouts,
    apiEndpoints,
    rootPath: projectPath
  };
}
```

---

## Phase 2: AI Journey Classifier

### New File: `src/lib/server/gemini-journey.ts`

```typescript
import { env } from '$env/dynamic/private';
import type { RouteTree, RouteInfo } from './route-analyzer';
import type { POTJ, JourneySectionType } from '$lib/types/journey';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface JourneyDefinition {
  id: string;
  name: string;
  persona: string;
  goal: string;
  routes: string[]; // Route paths belonging to this journey
}

interface JourneyClassification {
  journeys: JourneyDefinition[];
}

/**
 * Use AI to identify journeys from route structure
 */
export async function classifyJourneys(routeTree: RouteTree): Promise<JourneyClassification> {
  const apiKey = env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const routeSummary = routeTree.routes.map(r => ({
    path: r.path,
    hasAuth: r.imports.some(i => i.includes('auth')),
    hasServer: r.hasServerLogic,
    parentLayout: r.parentLayout
  }));

  const prompt = `Analyze this web application's route structure and identify distinct user journeys.

## Routes Found:
${JSON.stringify(routeSummary, null, 2)}

## API Endpoints:
${routeTree.apiEndpoints.map(e => e.path).join('\n')}

Based on the route paths and patterns, identify 2-5 distinct user journeys (personas).

Common patterns to look for:
- **Guest journey**: Public pages, marketing, signup, login flows
- **Admin journey**: /admin/**, management pages, user administration
- **User/Member journey**: Authenticated user features, dashboard, settings
- **Creator journey**: Content creation, editing, publishing flows

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
    },
    {
      "id": "admin",
      "name": "Admin Journey",
      "persona": "Administrator managing the platform",
      "goal": "Manage users, content, and system settings",
      "routes": ["/admin", "/admin/users", "/admin/settings"]
    }
  ]
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini');
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.journeys && Array.isArray(parsed.journeys)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse journey classification:', err);
  }
  
  // Default fallback - single journey with all routes
  return {
    journeys: [{
      id: 'app',
      name: 'Application Journey',
      persona: 'General user of the application',
      goal: 'Use the application features',
      routes: routeTree.routes.map(r => r.path)
    }]
  };
}

/**
 * Classify a route into Beginning/Middle/End section
 */
export function classifySection(route: RouteInfo): JourneySectionType {
  const path = route.path.toLowerCase();
  
  // Beginning patterns - entry points
  if (path === '/' || 
      path === '' ||
      path.includes('/login') || 
      path.includes('/signin') ||
      path.includes('/signup') ||
      path.includes('/register') ||
      path.includes('/welcome') ||
      path.includes('/onboarding') ||
      path.includes('/landing')) {
    return 'beginning';
  }
  
  // End patterns - outcomes and completions
  if (path.includes('/success') ||
      path.includes('/complete') ||
      path.includes('/confirmation') ||
      path.includes('/thank') ||
      path.includes('/logout') ||
      path.includes('/signout') ||
      path.includes('/analytics') ||
      path.includes('/reports') ||
      path.includes('/summary')) {
    return 'end';
  }
  
  // Default to middle - core functionality
  return 'middle';
}

/**
 * Determine module type from route info
 */
export function determineModuleType(route: RouteInfo): 'layout' | 'page' | 'logic' | 'endpoint' {
  if (route.type === 'layout') return 'layout';
  if (route.type === 'api') return 'endpoint';
  if (route.hasServerLogic) return 'logic';
  return 'page';
}

/**
 * Generate detailed POTJ entry for a route using AI
 */
export async function generatePOTJEntry(
  route: RouteInfo,
  journeyId: string,
  section: JourneySectionType,
  index: number
): Promise<POTJ> {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return basic POTJ without AI enhancement
    return createBasicPOTJ(route, journeyId, section, index);
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
      console.error('Gemini API error for POTJ generation');
      return createBasicPOTJ(route, journeyId, section, index);
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
          codeReference: parsed.codeSnippet ? {
            file: route.filePath,
            lines: `${parsed.codeSnippet.startLine}-${parsed.codeSnippet.endLine}`,
            language: route.filePath.endsWith('.svelte') ? 'svelte' : 'typescript',
            code: parsed.codeSnippet.code
          } : undefined,
          dependencies: route.imports.filter(i => i.startsWith('$lib')),
          parentLayout: route.parentLayout,
          chatHistory: []
        };
      }
    }
  } catch (err) {
    console.error('Error generating POTJ:', err);
  }

  return createBasicPOTJ(route, journeyId, section, index);
}

/**
 * Create a basic POTJ without AI enhancement
 */
function createBasicPOTJ(
  route: RouteInfo,
  journeyId: string,
  section: JourneySectionType,
  index: number
): POTJ {
  const sectionLetter = section === 'beginning' ? 'b' : section === 'middle' ? 'm' : 'e';
  const potjId = `${journeyId}-${sectionLetter}-${index}`;
  
  return {
    id: potjId,
    title: generateDefaultTitle(route),
    moduleType: determineModuleType(route),
    description: `User interacts with ${route.path} route.`,
    section,
    fileRef: route.filePath,
    tags: extractTagsFromPath(route.path),
    keyBehavior: [],
    dependencies: route.imports.filter(i => i.startsWith('$lib')),
    parentLayout: route.parentLayout,
    chatHistory: []
  };
}

/**
 * Generate a default title from route path
 */
function generateDefaultTitle(route: RouteInfo): string {
  if (route.path === '/' || route.path === '') {
    return route.type === 'layout' ? 'Root Layout' : 'Home Page';
  }
  
  // Convert path to title: /admin/users -> Admin Users
  const parts = route.path.split('/').filter(Boolean);
  const title = parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
  
  const suffix = route.type === 'layout' ? ' Layout' : 
                 route.type === 'api' ? ' API' : 
                 ' Page';
  
  return title + suffix;
}

/**
 * Extract tags from route path
 */
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
```

---

## Phase 3: Journey Markdown Writer

### New File: `src/lib/server/journey-writer.ts`

```typescript
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { RootJourney, POTJ } from '$lib/types/journey';

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
function generateJourneyMarkdown(
  journey: RootJourney,
  metadata: JourneyMeta
): string {
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
 * Generate markdown for a single POTJ
 */
function generatePOTJMarkdown(potj: POTJ): string[] {
  const lines: string[] = [];
  
  lines.push(`### [POTJ:${potj.id}] ${potj.title}`);
  
  if (potj.moduleType) {
    lines.push(`**Type**: ${potj.moduleType}`);
  }
  if (potj.fileRef) {
    lines.push(`**File**: \`@/${potj.fileRef}\``);
  }
  if (potj.metadata?.level) {
    lines.push(`**Level**: L${potj.metadata.level}`);
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
  
  if (potj.codeReference && potj.codeReference.code) {
    lines.push(`**Code Reference** \`@/${potj.codeReference.file}:${potj.codeReference.lines}\`:`);
    lines.push(`\`\`\`${potj.codeReference.language}`);
    lines.push(potj.codeReference.code);
    lines.push('```');
    lines.push('');
  }
  
  if (potj.dependencies && potj.dependencies.length > 0) {
    lines.push('**Dependencies**:');
    for (const dep of potj.dependencies) {
      lines.push(`- Uses \`@/${dep.replace('$lib/', 'lib/')}\``);
    }
    lines.push('');
  }
  
  if (potj.parentLayout) {
    lines.push(`**Parent Layout**: \`@/${potj.parentLayout}\``);
    lines.push('');
  }
  
  if (potj.notes && potj.notes.length > 0) {
    lines.push('**Notes**:');
    for (const note of potj.notes) {
      lines.push(`> ${note}`);
    }
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  
  return lines;
}
```

---

## Phase 4: Generation API Endpoint

### New Endpoint: `POST /api/generate-journeys`

**File:** `src/routes/api/generate-journeys/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import { analyzeRoutes } from '$lib/server/route-analyzer';
import { classifyJourneys, classifySection, generatePOTJEntry } from '$lib/server/gemini-journey';
import { writeJourneyMarkdown } from '$lib/server/journey-writer';
import type { RootJourney, JourneySection } from '$lib/types/journey';
import type { RequestHandler } from './$types';
import { join } from 'path';

interface GenerationResult {
  id: string;
  name: string;
  potjCount: number;
  filePath: string;
}

export const POST: RequestHandler = async ({ request }) => {
  const { projectPath } = await request.json();
  
  if (!projectPath) {
    return json({ error: 'projectPath required' }, { status: 400 });
  }
  
  try {
    console.log(`[GenerateJourneys] Starting generation for ${projectPath}`);
    
    // Step 1: Analyze route structure
    console.log('[GenerateJourneys] Step 1: Analyzing routes...');
    const routeTree = await analyzeRoutes(projectPath);
    
    // Step 2: Classify into journeys using AI
    console.log('[GenerateJourneys] Step 2: Classifying journeys...');
    const classification = await classifyJourneys(routeTree);
    
    console.log(`[GenerateJourneys] Found ${classification.journeys.length} journeys`);
    
    // Step 3: Generate POTJs for each journey
    const generatedJourneys: GenerationResult[] = [];
    const journeysDir = join(projectPath, 'journeys');
    
    for (const journeyDef of classification.journeys) {
      console.log(`[GenerateJourneys] Step 3: Building ${journeyDef.name}...`);
      
      // Filter routes for this journey
      const journeyRoutes = routeTree.routes.filter(r => 
        journeyDef.routes.includes(r.path)
      );
      
      // Also include layouts that are parents of journey routes
      const journeyLayouts = routeTree.layouts.filter(l =>
        journeyRoutes.some(r => r.parentLayout === l.filePath)
      );
      
      // Build the journey
      const journey = await buildJourney(
        journeyDef,
        journeyRoutes,
        journeyLayouts
      );
      
      // Step 4: Write to file
      console.log(`[GenerateJourneys] Step 4: Writing ${journeyDef.id}.journey.md...`);
      const filePath = await writeJourneyMarkdown(journey, journeysDir, {
        persona: journeyDef.persona,
        goal: journeyDef.goal
      });
      
      const potjCount = 
        journey.sections.beginning.items.length +
        journey.sections.middle.items.length +
        journey.sections.end.items.length;
      
      generatedJourneys.push({
        id: journey.id,
        name: journey.name,
        potjCount,
        filePath
      });
    }
    
    console.log(`[GenerateJourneys] Complete! Generated ${generatedJourneys.length} journeys`);
    
    return json({
      success: true,
      journeys: generatedJourneys,
      stats: {
        totalRoutes: routeTree.routes.length,
        totalLayouts: routeTree.layouts.length,
        totalApiEndpoints: routeTree.apiEndpoints.length
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[GenerateJourneys] Error:', error);
    return json({ 
      success: false,
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

/**
 * Build a complete journey from routes
 */
async function buildJourney(
  journeyDef: { id: string; name: string; persona: string; goal: string },
  routes: any[],
  layouts: any[]
): Promise<RootJourney> {
  const sections: {
    beginning: JourneySection;
    middle: JourneySection;
    end: JourneySection;
  } = {
    beginning: { type: 'beginning', items: [] },
    middle: { type: 'middle', items: [] },
    end: { type: 'end', items: [] }
  };
  
  // Add layouts first (they're typically at the beginning)
  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    const potj = await generatePOTJEntry(
      layout,
      journeyDef.id,
      'beginning',
      sections.beginning.items.length + 1
    );
    sections.beginning.items.push(potj);
  }
  
  // Add routes to appropriate sections
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const section = classifySection(route);
    
    const potj = await generatePOTJEntry(
      route,
      journeyDef.id,
      section,
      sections[section].items.length + 1
    );
    
    sections[section].items.push(potj);
  }
  
  return {
    id: journeyDef.id,
    name: journeyDef.name,
    sections
  };
}
```

---

## Phase 5: Generation UI

### Add to Home Page: Generation Button and Progress

**Update:** `src/routes/+page.svelte` (or appropriate location)

```svelte
<script lang="ts">
  // Add to existing script
  
  interface GenerationResult {
    success: boolean;
    journeys?: { id: string; name: string; potjCount: number }[];
    error?: string;
    stats?: {
      totalRoutes: number;
      totalLayouts: number;
      totalApiEndpoints: number;
    };
  }
  
  let isGenerating = $state(false);
  let generationProgress = $state<string>('');
  let generationResult = $state<GenerationResult | null>(null);
  
  async function handleGenerateJourneys() {
    if (!selectedProject?.directoryPath) {
      alert('Please select a project first');
      return;
    }
    
    const confirmed = confirm(
      'This will generate journey files for the selected project. ' +
      'Existing journey files may be overwritten. Continue?'
    );
    
    if (!confirmed) return;
    
    isGenerating = true;
    generationProgress = 'Analyzing project structure...';
    generationResult = null;
    
    try {
      const response = await fetch('/api/generate-journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectPath: selectedProject.directoryPath 
        })
      });
      
      const result: GenerationResult = await response.json();
      generationResult = result;
      
      if (result.success) {
        generationProgress = 'Complete!';
        // Reload journeys to show the newly generated ones
        await loadJourneys();
      } else {
        generationProgress = 'Failed';
      }
    } catch (error) {
      generationResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed' 
      };
      generationProgress = 'Error';
    } finally {
      isGenerating = false;
    }
  }
</script>

<!-- Add to template -->
<div class="generation-section">
  <h3>Journey Generation</h3>
  
  <button 
    class="generate-btn"
    onclick={handleGenerateJourneys}
    disabled={isGenerating || !selectedProject}
  >
    {#if isGenerating}
      <span class="spinner">⏳</span>
      {generationProgress}
    {:else}
      ✨ Generate Journeys
    {/if}
  </button>
  
  <p class="help-text">
    Analyzes your project's routes and generates journey documentation using AI.
  </p>
  
  {#if generationResult}
    <div class="generation-result" class:success={generationResult.success} class:error={!generationResult.success}>
      {#if generationResult.success}
        <h4>✅ Journeys Generated!</h4>
        
        {#if generationResult.stats}
          <p class="stats">
            Analyzed: {generationResult.stats.totalRoutes} pages, 
            {generationResult.stats.totalLayouts} layouts, 
            {generationResult.stats.totalApiEndpoints} API endpoints
          </p>
        {/if}
        
        <ul class="journey-list">
          {#each generationResult.journeys || [] as journey}
            <li>
              <strong>{journey.name}</strong>
              <span class="potj-count">({journey.potjCount} POTJs)</span>
            </li>
          {/each}
        </ul>
      {:else}
        <h4>❌ Generation Failed</h4>
        <p class="error-message">{generationResult.error}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .generation-section {
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
  }
  
  .generation-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    color: #1e293b;
  }
  
  .generate-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .generate-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  .generate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .help-text {
    margin: 0.75rem 0 0 0;
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .generation-result {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  
  .generation-result.success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
  }
  
  .generation-result.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
  
  .generation-result h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  .stats {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .journey-list {
    margin: 0.75rem 0 0 0;
    padding-left: 1.25rem;
  }
  
  .journey-list li {
    margin: 0.25rem 0;
    font-size: 0.9375rem;
  }
  
  .potj-count {
    color: #64748b;
    font-size: 0.8125rem;
  }
  
  .error-message {
    margin: 0;
    color: #991b1b;
    font-size: 0.875rem;
  }
</style>
```

---

## Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Route analyzer | 2 hours |
| 2 | AI journey classifier | 1.5 hours |
| 3 | Journey markdown writer | 1.5 hours |
| 4 | Generation API endpoint | 1.5 hours |
| 5 | Generation UI | 1 hour |
| 6 | Testing with real projects | 1.5 hours |
| **Total** | | **9 hours** |

---

## Testing Checklist

- [ ] Route analyzer finds all routes correctly
- [ ] Route analyzer finds all layouts correctly
- [ ] API endpoints are discovered
- [ ] Layouts linked to pages properly
- [ ] AI identifies reasonable journey groupings
- [ ] Section classification (Beginning/Middle/End) makes sense
- [ ] POTJ generation produces valid entries
- [ ] Markdown output parses correctly
- [ ] Generated files appear in /journeys/ folder
- [ ] Dashboard loads generated journeys
- [ ] Generation works on AppV5 itself (dogfood test)
- [ ] Generation works on external SvelteKit projects
- [ ] Error handling for missing files/permissions
- [ ] Progress feedback in UI during generation

---

## API Cost Considerations

**Gemini API Usage per generation:**
- Journey classification: ~500-1000 tokens
- POTJ generation: ~400-600 tokens per route
- Estimated total for 20 routes: ~10,000-15,000 tokens

**Optimization strategies:**
- Batch similar routes where possible
- Cache file content reads
- Limit code snippet size to 4000 chars
- Use lower temperature for consistent output

---

## Limitations & Future Work

### Current Scope (MVP)
- SvelteKit projects only
- Routes-based journey detection
- Single-pass generation (regenerates all)

### Future Enhancements
1. **Framework Support**: Next.js, Remix, Nuxt.js
2. **Incremental Generation**: Add new routes to existing journeys
3. **Custom Templates**: User-defined journey structures
4. **Import Analysis**: Deeper relationship mapping via AST
5. **Preview Mode**: Show proposed journeys before writing
6. **Undo/History**: Rollback to previous journey versions
7. **Merge Mode**: Combine AI suggestions with manual edits
