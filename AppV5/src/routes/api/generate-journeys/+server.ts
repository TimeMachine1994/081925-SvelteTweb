import { json } from '@sveltejs/kit';
import { analyzeRoutes } from '$lib/server/route-analyzer';
import { classifyJourneys, classifySection, generatePOTJEntry } from '$lib/server/gemini-journey';
import { writeJourneyMarkdown } from '$lib/server/journey-writer';
import { createJourneySnapshots } from '$lib/server/file-snapshot';
import type { RootJourney, JourneySection } from '$lib/types/journey';
import type { RequestHandler } from './$types';
import { join } from 'path';
import type { RouteInfo } from '$lib/server/route-analyzer';

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

		if (routeTree.routes.length === 0) {
			return json(
				{
					success: false,
					error: 'No routes found',
					message: 'No page routes found in the project. Make sure this is a SvelteKit project with routes in src/routes/'
				},
				{ status: 400 }
			);
		}

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
			const journeyRoutes = routeTree.routes.filter((r) => journeyDef.routes.includes(r.path));

			// Also include layouts that are parents of journey routes
			const journeyLayouts = routeTree.layouts.filter((l) =>
				journeyRoutes.some((r) => r.parentLayout === l.filePath)
			);

			// Build the journey
			const journey = await buildJourney(journeyDef, journeyRoutes, journeyLayouts, projectPath);

			// Step 4: Write to file
			console.log(`[GenerateJourneys] Step 4: Writing ${journeyDef.id}.journey.md...`);
			const filePath = await writeJourneyMarkdown(journey, journeysDir, {
				persona: journeyDef.persona,
				goal: journeyDef.goal
			});

			// Step 5: Create initial file snapshots
			await createJourneySnapshots(journey, projectPath);

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
		return json(
			{
				success: false,
				error: 'Generation failed',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

async function buildJourney(
	journeyDef: { id: string; name: string; persona: string; goal: string },
	routes: RouteInfo[],
	layouts: RouteInfo[],
	projectPath: string
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
			sections.beginning.items.length + 1,
			projectPath
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
			sections[section].items.length + 1,
			projectPath
		);

		sections[section].items.push(potj);
	}

	return {
		id: journeyDef.id,
		name: journeyDef.name,
		sections
	};
}
