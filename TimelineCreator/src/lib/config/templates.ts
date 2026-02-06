import { DEFAULT_CATEGORIES, type CategoryConfig } from './categories';

export interface SchemaTemplate {
	id: string;
	name: string;
	description: string;
	columnHints: Record<string, string[]>; // field -> possible column name matches
	categories: CategoryConfig[];
}

export const TEMPLATES: SchemaTemplate[] = [
	{
		id: 'legal-medical',
		name: 'Legal / Medical',
		description: 'Pre-configured for personal injury, medical malpractice, and workers comp timelines.',
		columnHints: {
			date: ['date', 'visit date', 'event date', 'dos', 'date of service'],
			title: ['title', 'event', 'provider', 'facility', 'description'],
			description: ['description', 'notes', 'summary', 'clinical notes', 'details'],
			category: ['category', 'type', 'event type', 'classification'],
			facility: ['facility', 'provider', 'clinic', 'hospital', 'doctor'],
			exhibitId: ['exhibit', 'exhibit_id', 'exhibit id', 'ref', 'reference'],
			mediaUrl: ['media', 'media_url', 'url', 'link', 'attachment'],
			time: ['time', 'visit time', 'appointment time']
		},
		categories: DEFAULT_CATEGORIES
	},
	{
		id: 'generic',
		name: 'Generic Timeline',
		description: 'A blank template with no pre-configured categories.',
		columnHints: {
			date: ['date'],
			title: ['title', 'name', 'event'],
			description: ['description', 'notes', 'details'],
			category: ['category', 'type'],
			time: ['time']
		},
		categories: []
	}
];

export function autoDetectColumns(
	headers: string[],
	template: SchemaTemplate
): Record<string, string> {
	const mapping: Record<string, string> = {};
	const headersLower = headers.map((h) => h.toLowerCase().trim());

	for (const [field, hints] of Object.entries(template.columnHints)) {
		for (const hint of hints) {
			const idx = headersLower.indexOf(hint.toLowerCase());
			if (idx !== -1) {
				mapping[field] = headers[idx];
				break;
			}
		}
	}

	return mapping;
}
