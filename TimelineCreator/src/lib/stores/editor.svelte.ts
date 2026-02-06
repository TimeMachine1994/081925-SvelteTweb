import type { CategoryConfig } from '$lib/config/categories';
import type { TimelineEvent } from '$lib/utils/csv-parser';

export type EditorTab = 'schema' | 'data' | 'editor' | 'preview';
export type ZoomLevel = 'macro' | 'normal' | 'micro';
export type SpacerMode = 'uniform' | 'chronological';

export interface EditorState {
	activeTab: EditorTab;
	zoomLevel: ZoomLevel;
	spacerMode: SpacerMode;
	brushMode: boolean;
	brushCategory: CategoryConfig | null;
	searchQuery: string;
	activeFilters: Set<string>;
	events: TimelineEvent[];
	categoryOverrides: Map<string, CategoryConfig>;
	undoStack: UndoEntry[];
	redoStack: UndoEntry[];
}

interface UndoEntry {
	type: 'category-change';
	eventId: string;
	oldCategory: string | undefined;
	newCategory: string;
}

function createEditorStore() {
	let activeTab = $state<EditorTab>('schema');
	let zoomLevel = $state<ZoomLevel>('normal');
	let spacerMode = $state<SpacerMode>('uniform');
	let brushMode = $state(false);
	let brushCategory = $state<CategoryConfig | null>(null);
	let searchQuery = $state('');
	let activeFilters = $state<Set<string>>(new Set());
	let events = $state<TimelineEvent[]>([]);
	let categoryOverrides = $state<Map<string, CategoryConfig>>(new Map());
	let undoStack = $state<UndoEntry[]>([]);
	let redoStack = $state<UndoEntry[]>([]);

	function setTab(tab: EditorTab) {
		activeTab = tab;
	}

	function setZoom(level: ZoomLevel) {
		zoomLevel = level;
	}

	function setSpacer(mode: SpacerMode) {
		spacerMode = mode;
	}

	function toggleBrush(category: CategoryConfig | null) {
		if (brushCategory === category && brushMode) {
			brushMode = false;
			brushCategory = null;
		} else {
			brushMode = true;
			brushCategory = category;
		}
	}

	function setSearch(query: string) {
		searchQuery = query;
	}

	function toggleFilter(categoryName: string) {
		const newFilters = new Set(activeFilters);
		if (newFilters.has(categoryName)) {
			newFilters.delete(categoryName);
		} else {
			newFilters.add(categoryName);
		}
		activeFilters = newFilters;
	}

	function setEvents(newEvents: TimelineEvent[]) {
		events = newEvents;
	}

	function stampCategory(eventId: string, category: CategoryConfig) {
		const event = events.find((e) => e.id === eventId);
		if (!event) return;

		const oldCategory = event.category;
		undoStack = [...undoStack, {
			type: 'category-change',
			eventId,
			oldCategory,
			newCategory: category.name
		}];
		redoStack = [];

		// Apply
		events = events.map((e) =>
			e.id === eventId ? { ...e, category: category.name } : e
		);
		categoryOverrides = new Map(categoryOverrides).set(eventId, category);
	}

	function undo() {
		if (undoStack.length === 0) return;
		const entry = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, entry];

		events = events.map((e) =>
			e.id === entry.eventId ? { ...e, category: entry.oldCategory } : e
		);
		const newOverrides = new Map(categoryOverrides);
		newOverrides.delete(entry.eventId);
		categoryOverrides = newOverrides;
	}

	function redo() {
		if (redoStack.length === 0) return;
		const entry = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, entry];

		events = events.map((e) =>
			e.id === entry.eventId ? { ...e, category: entry.newCategory } : e
		);
	}

	return {
		get activeTab() { return activeTab; },
		get zoomLevel() { return zoomLevel; },
		get spacerMode() { return spacerMode; },
		get brushMode() { return brushMode; },
		get brushCategory() { return brushCategory; },
		get searchQuery() { return searchQuery; },
		get activeFilters() { return activeFilters; },
		get events() { return events; },
		get categoryOverrides() { return categoryOverrides; },
		get undoStack() { return undoStack; },
		get redoStack() { return redoStack; },
		setTab,
		setZoom,
		setSpacer,
		toggleBrush,
		setSearch,
		toggleFilter,
		setEvents,
		stampCategory,
		undo,
		redo
	};
}

export const editorStore = createEditorStore();
