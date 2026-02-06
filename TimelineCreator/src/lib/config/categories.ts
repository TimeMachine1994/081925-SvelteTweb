export interface CategoryConfig {
	name: string;
	color: string;
	textColor: string;
	strokeColor: string;
	strokeWidth: number;
	keywords: string[];
}

export interface YearStyle {
	bgColor: string;
	textColor: string;
	fontSize: string;
}

export const DEFAULT_YEAR_STYLE: YearStyle = {
	bgColor: '#1F2937',
	textColor: '#FFFFFF',
	fontSize: 'text-lg'
};

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
	{
		name: 'Medical Treatment',
		color: '#FFFF00',
		textColor: '#000000',
		strokeColor: '#000000',
		strokeWidth: 1,
		keywords: ['surgery', 'clinic', 'imaging', 'injection', 'visit', 'consultation', 'therapy', 'examination', 'chiropractic', 'physical therapy', 'PT', 'MRI', 'x-ray', 'xray']
	},
	{
		name: 'Incident/Accident',
		color: '#CC0000',
		textColor: '#FFFFFF',
		strokeColor: '#7F1D1D',
		strokeWidth: 2,
		keywords: ['MVA', 'fall', 'accident', 'injury', 'collision', 'crash', 'hit', 'struck', 'motor vehicle']
	},
	{
		name: 'Legal Milestone',
		color: '#FF9900',
		textColor: '#000000',
		strokeColor: '#000000',
		strokeWidth: 1,
		keywords: ['filing', 'deposition', 'subject accident', 'complaint', 'settlement', 'trial', 'hearing', 'motion']
	},
	{
		name: 'Gap in Treatment',
		color: '#006600',
		textColor: '#FFFFFF',
		strokeColor: '#000000',
		strokeWidth: 1,
		keywords: ['no treatment', 'gap', 'none', 'no visits', 'no records']
	}
];

export function detectCategory(text: string, categories: CategoryConfig[]): CategoryConfig | null {
	const lowerText = text.toLowerCase();
	for (const cat of categories) {
		for (const keyword of cat.keywords) {
			if (lowerText.includes(keyword.toLowerCase())) {
				return cat;
			}
		}
	}
	return null;
}
