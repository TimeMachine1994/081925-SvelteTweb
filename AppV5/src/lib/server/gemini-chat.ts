import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { POTJ, FileProfile, ChatMessage } from '$lib/types/journey';

interface ChatContext {
	potj?: POTJ | null;
	fileContent?: string | null;
	relatedFiles?: FileProfile[];
	chatHistory?: ChatMessage[];
}

interface ChatResponse {
	content: string;
	model: string;
	tokensUsed?: number;
}

/**
 * Build a context-aware prompt for the AI including POTJ/file metadata,
 * code content, and conversation history
 */
function buildChatPrompt(userMessage: string, context: ChatContext): string {
	const parts: string[] = [
		'You are an expert code assistant helping a developer understand their codebase.',
		'You have access to their project structure, journey documentation, and code.',
		'Provide helpful, specific answers based on the context below.',
		''
	];

	// Add POTJ context if available
	if (context.potj) {
		parts.push('# Current Journey Step (POTJ)');
		parts.push(`**Title:** ${context.potj.title}`);
		parts.push(`**Type:** ${context.potj.moduleType || 'N/A'}`);
		parts.push(`**Description:** ${context.potj.description}`);
		
		if (context.potj.keyBehavior?.length) {
			parts.push('');
			parts.push('**Key Behaviors:**');
			context.potj.keyBehavior.forEach(behavior => {
				parts.push(`- ${behavior}`);
			});
		}

		if (context.potj.dependencies?.length) {
			parts.push('');
			parts.push('**Dependencies:**');
			context.potj.dependencies.forEach(dep => {
				parts.push(`- ${dep}`);
			});
		}

		if (context.potj.tags?.length) {
			parts.push('');
			parts.push(`**Tags:** ${context.potj.tags.join(', ')}`);
		}

		if (context.potj.fileRef) {
			parts.push('');
			parts.push(`**Related File:** ${context.potj.fileRef}`);
		}

		parts.push('');
	}

	// Add file content if available (limit to 5000 chars to manage token budget)
	if (context.fileContent) {
		parts.push('# Current File Content');
		parts.push('```');
		const truncatedContent = context.fileContent.slice(0, 5000);
		parts.push(truncatedContent);
		if (context.fileContent.length > 5000) {
			parts.push('... (truncated)');
		}
		parts.push('```');
		parts.push('');
	}

	// Add related files
	if (context.relatedFiles && context.relatedFiles.length > 0) {
		parts.push('# Related Files in This Journey');
		context.relatedFiles.slice(0, 10).forEach(file => {
			parts.push(`- **${file.path}**`);
			if (file.description) {
				parts.push(`  ${file.description}`);
			}
		});
		parts.push('');
	}

	// Add recent chat history for context (last 10 messages)
	if (context.chatHistory && context.chatHistory.length > 0) {
		parts.push('# Previous Conversation');
		// Take last 10 messages for context
		const recentHistory = context.chatHistory.slice(-10);
		recentHistory.forEach(msg => {
			parts.push(`**${msg.role === 'user' ? 'User' : 'Assistant'}:** ${msg.content}`);
		});
		parts.push('');
	}

	// Add user's current question
	parts.push('# User Question');
	parts.push(userMessage);
	parts.push('');
	parts.push('---');
	parts.push('');
	parts.push('Please provide a helpful, specific answer based on the code and context above.');
	parts.push('- Reference specific files, functions, or code sections when relevant');
	parts.push('- Explain technical concepts clearly');
	parts.push('- Suggest improvements if appropriate');
	parts.push('- Keep responses concise but thorough');

	return parts.join('\n');
}

/**
 * Generate an AI chat response with full context awareness
 */
export async function generateChatResponse(
	userMessage: string,
	context: ChatContext
): Promise<ChatResponse> {
	try {
		console.log('[Gemini Chat] Generating response...');
		console.log('[Gemini Chat] User message:', userMessage);
		console.log('[Gemini Chat] Context includes:');
		console.log('[Gemini Chat] - POTJ:', !!context.potj);
		console.log('[Gemini Chat] - File content:', !!context.fileContent);
		console.log('[Gemini Chat] - Related files:', context.relatedFiles?.length || 0);
		console.log('[Gemini Chat] - Chat history:', context.chatHistory?.length || 0);

		// Build the context-aware prompt
		const prompt = buildChatPrompt(userMessage, context);
		
		console.log('[Gemini Chat] Prompt length:', prompt.length, 'characters');
		console.log('[Gemini Chat] Calling Gemini API...');

		// Use Gemini 2.5 Flash for fast, cost-effective responses
		const apiKey = env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY is not configured');
		}
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const result = await model.generateContent(prompt);
		const response = result.response;
		const text = response.text();

		console.log('[Gemini Chat] Response received');
		console.log('[Gemini Chat] Response length:', text.length, 'characters');

		// Extract token usage if available
		let tokensUsed: number | undefined;
		try {
			const usage = await result.response.usageMetadata;
			if (usage) {
				tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
				console.log('[Gemini Chat] Tokens used:', tokensUsed);
			}
		} catch (err) {
			console.log('[Gemini Chat] Could not get token usage');
		}

		return {
			content: text,
			model: 'gemini-2.0-flash',
			tokensUsed
		};
	} catch (error) {
		console.error('[Gemini Chat] Error generating response:', error);
		throw new Error(
			error instanceof Error 
				? `Failed to generate AI response: ${error.message}`
				: 'Failed to generate AI response'
		);
	}
}
