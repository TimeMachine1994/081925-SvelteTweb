import { env } from '$env/dynamic/private';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
	candidates?: {
		content?: {
			parts?: { text?: string }[];
		};
	}[];
	error?: { message: string };
}

export async function generateDescription(
	fileName: string,
	fileContent: string,
	fileType: string
): Promise<string> {
	const apiKey = env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not configured');
	}

	const prompt = `You are analyzing a code file to generate a brief, helpful description for documentation purposes.

File: ${fileName}
Type: ${fileType}

Content:
\`\`\`
${fileContent.slice(0, 4000)}
\`\`\`

Generate a concise description (2-3 sentences max) that explains:
1. What this file does
2. Its main purpose in the application

Keep it brief and technical. Do not include the file name in the response. Just the description.`;

	const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: {
				temperature: 0.3,
				maxOutputTokens: 150
			}
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Gemini API error: ${error}`);
	}

	const data: GeminiResponse = await response.json();

	if (data.error) {
		throw new Error(data.error.message);
	}

	const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) {
		throw new Error('No response from Gemini');
	}

	return text.trim();
}

export async function suggestJourneyMetadata(
	fileName: string,
	fileContent: string,
	filePath: string
): Promise<{ level: number; journey: string; tags: string[] }> {
	const apiKey = env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not configured');
	}

	const prompt = `Analyze this code file and suggest metadata for a "Journey Tree" classification system.

File: ${fileName}
Path: ${filePath}

Content:
\`\`\`
${fileContent.slice(0, 3000)}
\`\`\`

The Journey Tree has 4 levels:
- Level 1: Journey Container (top-level experiences like "admin", "guest", "user")
- Level 2: Structural Layout (layout files, route groups)
- Level 3: Logic Connector (page logic, guards, middleware)
- Level 4: Atomic Module (utilities, components, APIs)

Respond ONLY with valid JSON in this exact format:
{"level": <1-4>, "journey": "<journey-name>", "tags": ["tag1", "tag2"]}

Choose the most appropriate level and journey based on the file's purpose and location.`;

	const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: {
				temperature: 0.2,
				maxOutputTokens: 100
			}
		})
	});

	if (!response.ok) {
		throw new Error('Gemini API error');
	}

	const data: GeminiResponse = await response.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

	if (!text) {
		return { level: 4, journey: 'app', tags: [] };
	}

	try {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
	} catch {
		// Fall back to defaults
	}

	return { level: 4, journey: 'app', tags: [] };
}
