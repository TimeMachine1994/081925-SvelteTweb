import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chatMessage } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateChatResponse } from '$lib/server/gemini-chat';
import type { RequestHandler } from './$types';

// GET /api/chat?contextType={type}&contextId={id}
// Load chat message history for a specific POTJ or file
export const GET: RequestHandler = async ({ url }) => {
	try {
		const contextType = url.searchParams.get('contextType');
		const contextId = url.searchParams.get('contextId');

		console.log('[Chat API GET] Loading chat history');
		console.log('[Chat API GET] contextType:', contextType);
		console.log('[Chat API GET] contextId:', contextId);

		if (!contextType || !contextId) {
			return json({ error: 'contextType and contextId are required' }, { status: 400 });
		}

		// Query messages for this context, ordered by timestamp ascending
		const messages = await db
			.select()
			.from(chatMessage)
			.where(
				and(
					eq(chatMessage.contextType, contextType),
					eq(chatMessage.contextId, contextId)
				)
			)
			.orderBy(chatMessage.timestamp);

		console.log(`[Chat API GET] Found ${messages.length} messages`);

		return json({ messages });
	} catch (error) {
		console.error('[Chat API GET] Error loading chat:', error);
		return json(
			{
				error: 'Failed to load chat history',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// POST /api/chat
// Send a new message and get AI response
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { contextType, contextId, message, context } = await request.json();

		console.log('[Chat API POST] New message received');
		console.log('[Chat API POST] contextType:', contextType);
		console.log('[Chat API POST] contextId:', contextId);
		console.log('[Chat API POST] message:', message);

		if (!contextType || !contextId || !message) {
			return json({ error: 'contextType, contextId, and message are required' }, { status: 400 });
		}

		// Generate unique IDs for messages
		const userMessageId = `msg-${Date.now()}-user`;
		const assistantMessageId = `msg-${Date.now()}-assistant`;
		const timestamp = new Date();

		// Save user message to database
		console.log('[Chat API POST] Saving user message...');
		await db.insert(chatMessage).values({
			id: userMessageId,
			contextType,
			contextId,
			role: 'user',
			content: message,
			timestamp,
			metadata: null
		});

		const userMessage = {
			id: userMessageId,
			contextType,
			contextId,
			role: 'user' as const,
			content: message,
			timestamp,
			metadata: null
		};

		console.log('[Chat API POST] User message saved');

		// Load recent chat history for context (last 10 messages)
		const recentMessages = await db
			.select()
			.from(chatMessage)
			.where(
				and(
					eq(chatMessage.contextType, contextType),
					eq(chatMessage.contextId, contextId)
				)
			)
			.orderBy(desc(chatMessage.timestamp))
			.limit(10);

		// Reverse to get chronological order
		const chatHistory = recentMessages.reverse();

		console.log(`[Chat API POST] Loaded ${chatHistory.length} recent messages for context`);

		// Generate AI response
		console.log('[Chat API POST] Generating AI response...');
		const aiResponse = await generateChatResponse(message, {
			...context,
			chatHistory
		});

		console.log('[Chat API POST] AI response generated');

		// Save assistant message to database
		console.log('[Chat API POST] Saving assistant message...');
		await db.insert(chatMessage).values({
			id: assistantMessageId,
			contextType,
			contextId,
			role: 'assistant',
			content: aiResponse.content,
			timestamp: new Date(),
			metadata: JSON.stringify({
				model: aiResponse.model,
				tokensUsed: aiResponse.tokensUsed
			})
		});

		const assistantMessage = {
			id: assistantMessageId,
			contextType,
			contextId,
			role: 'assistant' as const,
			content: aiResponse.content,
			timestamp: new Date(),
			metadata: JSON.stringify({
				model: aiResponse.model,
				tokensUsed: aiResponse.tokensUsed
			})
		};

		console.log('[Chat API POST] Assistant message saved');
		console.log('[Chat API POST] Chat exchange complete');

		return json({
			userMessage,
			assistantMessage
		});
	} catch (error) {
		console.error('[Chat API POST] Error processing chat:', error);
		return json(
			{
				error: 'Failed to process chat message',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
