import type { NestedItemData, JourneyMetadata } from '$lib/types/journey';

export interface JourneyNode {
	id: string;
	title: string;
	level: 1 | 2 | 3 | 4;
	journey: string;
	description?: string;
	tags?: string[];
	sourceFile?: NestedItemData;
	children: JourneyNode[];
}

export interface JourneyTree {
	journeys: Map<string, JourneyNode>;
	unclassified: NestedItemData[];
}

const LEVEL_NAMES: Record<number, string> = {
	1: 'Journey Container',
	2: 'Structural Layout',
	3: 'Logic Connector',
	4: 'Atomic Module'
};

export function reclassifyToJourneyTree(fileTree: NestedItemData[]): JourneyTree {
	const journeys = new Map<string, JourneyNode>();
	const unclassified: NestedItemData[] = [];
	const allNodes: { item: NestedItemData; metadata: JourneyMetadata }[] = [];

	collectNodesWithMetadata(fileTree, allNodes);

	const nodesByJourney = new Map<string, typeof allNodes>();
	
	for (const node of allNodes) {
		const journey = node.metadata.journey;
		if (journey) {
			if (!nodesByJourney.has(journey)) {
				nodesByJourney.set(journey, []);
			}
			nodesByJourney.get(journey)!.push(node);
		}
	}

	for (const [journeyName, nodes] of nodesByJourney) {
		const journeyRoot = buildJourneyHierarchy(journeyName, nodes);
		journeys.set(journeyName, journeyRoot);
	}

	collectUnclassified(fileTree, unclassified);

	return { journeys, unclassified };
}

function collectNodesWithMetadata(
	items: NestedItemData[],
	result: { item: NestedItemData; metadata: JourneyMetadata }[]
): void {
	for (const item of items) {
		if (item.metadata?.journey && item.metadata?.level) {
			result.push({ item, metadata: item.metadata });
		}
		if (item.children) {
			collectNodesWithMetadata(item.children, result);
		}
	}
}

function collectUnclassified(items: NestedItemData[], result: NestedItemData[]): void {
	for (const item of items) {
		if (!item.metadata?.journey) {
			result.push(item);
		}
		if (item.children) {
			collectUnclassified(item.children, result);
		}
	}
}

function buildJourneyHierarchy(
	journeyName: string,
	nodes: { item: NestedItemData; metadata: JourneyMetadata }[]
): JourneyNode {
	const byLevel = new Map<number, typeof nodes>();
	
	for (const node of nodes) {
		const level = node.metadata.level!;
		if (!byLevel.has(level)) {
			byLevel.set(level, []);
		}
		byLevel.get(level)!.push(node);
	}

	const root: JourneyNode = {
		id: `journey-${journeyName}`,
		title: capitalizeFirst(journeyName) + ' Journey',
		level: 1,
		journey: journeyName,
		description: `All components belonging to the ${journeyName} experience`,
		children: []
	};

	const l1Nodes = byLevel.get(1) || [];
	if (l1Nodes.length > 0) {
		root.description = l1Nodes[0].metadata.description || l1Nodes[0].item.content;
		root.sourceFile = l1Nodes[0].item;
		root.tags = l1Nodes[0].metadata.tags;
	}

	const levelGroups: JourneyNode[] = [];

	for (let level = 2; level <= 4; level++) {
		const levelNodes = byLevel.get(level) || [];
		if (levelNodes.length === 0) continue;

		const levelGroup: JourneyNode = {
			id: `${journeyName}-level-${level}`,
			title: LEVEL_NAMES[level] + 's',
			level: level as 1 | 2 | 3 | 4,
			journey: journeyName,
			description: `${levelNodes.length} ${LEVEL_NAMES[level].toLowerCase()}(s)`,
			children: levelNodes.map((n) => ({
				id: n.item.id,
				title: n.metadata.title || n.item.title,
				level: level as 1 | 2 | 3 | 4,
				journey: journeyName,
				description: n.metadata.description || n.item.content,
				tags: n.metadata.tags,
				sourceFile: n.item,
				children: []
			}))
		};

		levelGroups.push(levelGroup);
	}

	root.children = levelGroups;

	return root;
}

function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function journeyTreeToNestedItems(journeyTree: JourneyTree): NestedItemData[] {
	const items: NestedItemData[] = [];

	for (const [, journey] of journeyTree.journeys) {
		items.push(journeyNodeToNestedItem(journey));
	}

	if (journeyTree.unclassified.length > 0) {
		items.push({
			id: 'unclassified',
			title: 'Unclassified',
			type: 'folder',
			path: '',
			content: `${journeyTree.unclassified.length} files without journey metadata`,
			children: journeyTree.unclassified.slice(0, 50)
		});
	}

	return items;
}

function journeyNodeToNestedItem(node: JourneyNode): NestedItemData {
	return {
		id: node.id,
		title: node.title,
		type: 'folder',
		path: node.sourceFile?.path || '',
		content: node.description,
		metadata: {
			level: node.level,
			journey: node.journey,
			tags: node.tags
		},
		children: node.children.length > 0 
			? node.children.map(journeyNodeToNestedItem)
			: undefined
	};
}
