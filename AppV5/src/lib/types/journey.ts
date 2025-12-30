export interface NestedItemData {
	id: string;
	title: string;
	content?: string;
	type: 'folder' | 'file';
	path: string;
	extension?: string;
	children?: NestedItemData[];
	metadata?: JourneyMetadata;
}

export interface JourneyMetadata {
	level?: 1 | 2 | 3 | 4;
	journey?: string;
	partOf?: string;
	description?: string;
	title?: string;
	body?: string;
	tags?: string[];
	uses?: string[];
	// File analysis metadata
	stateCount?: number;
	functionCount?: number;
	importCount?: number;
	keyFunctions?: string[];
	keyState?: string[];
}

export interface ScanResult {
	tree: NestedItemData[];
	stats: {
		files: number;
		folders: number;
		markdownFiles: number;
	};
	scannedAt: string;
	rootPath: string;
}

export type JourneySectionType = 'beginning' | 'middle' | 'end';

export interface CodeReference {
	file: string;
	lines: string;
	language: string;
	code: string;
}

export type ModuleType = 'layout' | 'page' | 'route' | 'logic' | 'endpoint';

export interface DataFlowItem {
	name: string;
	type?: string;
	description: string;
	destination?: string;
	source?: string;
}

export interface DataFlow {
	receives?: DataFlowItem[];
	provides?: DataFlowItem[];
	emits?: DataFlowItem[];
	stores?: DataFlowItem[];
}

// Embedded file analysis types for POTJ persistence
export interface POTJStateVariable {
	name: string;
	type: string | null;
	initialValue: string | null;
	line: number;
	isState: boolean;
	isDerived: boolean;
}

export interface POTJFunction {
	name: string;
	params: string;
	returnType: string | null;
	isAsync: boolean;
	isExported: boolean;
	line: number;
	endLine: number;
}

export interface POTJImport {
	path: string;
	imports: string[];
	defaultImport: string | null;
	category: string;
	line: number;
}

export interface POTJAnalysis {
	state?: POTJStateVariable[];
	functions?: POTJFunction[];
	imports?: {
		projectFiles: POTJImport[];
		frameworkModules: POTJImport[];
	};
	metadata?: {
		analyzedAt: string;
		fileHash?: string;
		stateCount: number;
		functionCount: number;
		importCount: number;
	};
}

export interface POTJ {
	id: string;
	title: string;
	moduleType?: ModuleType;
	description?: string;
	section: JourneySectionType;
	fileRef?: string;
	metadata?: JourneyMetadata;
	tags?: string[];
	notes?: string[];
	keyBehavior?: string[];
	codeReference?: CodeReference;
	dependencies?: string[];
	routes?: string[];
	linkedRoutes?: string[];
	parentLayout?: string;
	isExpandable?: boolean;
	chatHistory?: ChatMessage[];
	dataFlow?: DataFlow;
	analysis?: POTJAnalysis;
}

export interface JourneySection {
	type: JourneySectionType;
	items: POTJ[];
}

export interface RootJourney {
	id: string;
	name: string;
	sections: {
		beginning: JourneySection;
		middle: JourneySection;
		end: JourneySection;
	};
}

export interface FileProfile {
	id: string;
	path: string;
	title: string;
	description?: string;
	metadata?: JourneyMetadata;
	codeSnippets?: CodeSnippet[];
	relatedPOTJs?: string[];
	tags?: string[];
	notes?: string[];
	chatHistory?: ChatMessage[];
}

export interface CodeSnippet {
	id: string;
	language: string;
	code: string;
	lineStart?: number;
	lineEnd?: number;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
}

export interface DashboardState {
	activeJourney: string | null;
	selectedPOTJ: POTJ | null;
	selectedFile: FileProfile | null;
	viewMode: 'potj' | 'file';
}

export type POTJReconciliationStatus = 'synced' | 'modified' | 'deleted' | 'unknown';
