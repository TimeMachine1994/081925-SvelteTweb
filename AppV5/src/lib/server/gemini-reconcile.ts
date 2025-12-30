import { env } from '$env/dynamic/private';
import type { POTJ } from '$lib/types/journey';

const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate updated POTJ metadata based on current file content
 */
export async function generatePOTJUpdate(existingPOTJ: POTJ, currentFileContent: string): Promise<POTJ> {
	const apiKey = env.GEMINI_API_KEY;

	if (!apiKey) {
		console.warn('[GeminiReconcile] No API key, returning original POTJ');
		return existingPOTJ;
	}

	const prompt = `You are updating journey documentation for a code file that has changed.

## Existing POTJ Entry:
- Title: ${existingPOTJ.title}
- Description: ${existingPOTJ.description || 'None'}
- Key Behaviors: ${existingPOTJ.keyBehavior?.join(', ') || 'None'}
- Tags: ${existingPOTJ.tags?.join(', ') || 'None'}

## Current File Content:
\`\`\`
${currentFileContent.slice(0, 6000)}
\`\`\`

Analyze the current code and update the POTJ entry. Keep the same general structure but update:
1. Description if the purpose has changed
2. Key behaviors if functionality changed
3. Tags if new concepts were introduced

Respond with JSON only:
{
  "title": "Updated title if needed, or keep original",
  "description": "2-3 sentence description of current functionality",
  "keyBehavior": ["Behavior 1", "Behavior 2", "Behavior 3"],
  "tags": ["tag1", "tag2"],
  "codeReference": {
    "startLine": 10,
    "endLine": 25,
    "code": "key code snippet (5-15 lines)"
  }
}`;

	try {
		const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.3,
					maxOutputTokens: 800
				}
			})
		});

		if (!response.ok) {
			console.error('[GeminiReconcile] API error:', response.status);
			return existingPOTJ;
		}

		const data = await response.json();
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!text) {
			return existingPOTJ;
		}

		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const updates = JSON.parse(jsonMatch[0]);

			return {
				...existingPOTJ,
				title: updates.title || existingPOTJ.title,
				description: updates.description || existingPOTJ.description,
				keyBehavior: updates.keyBehavior || existingPOTJ.keyBehavior,
				tags: updates.tags || existingPOTJ.tags,
				codeReference: updates.codeReference
					? {
							file: existingPOTJ.codeReference?.file || existingPOTJ.fileRef || '',
							lines: `${updates.codeReference.startLine}-${updates.codeReference.endLine}`,
							language: existingPOTJ.codeReference?.language || 'typescript',
							code: updates.codeReference.code
						}
					: existingPOTJ.codeReference
			};
		}
	} catch (err) {
		console.error('[GeminiReconcile] Failed to parse AI response:', err);
	}

	return existingPOTJ;
}
