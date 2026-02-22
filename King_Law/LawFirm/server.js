import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Initialize WebSocket server
import('./build/server/websocket.js').then(({ wsManager }) => {
	wsManager.initialize(server);
	console.log('✅ WebSocket server initialized');
}).catch(err => {
	console.error('❌ Failed to initialize WebSocket:', err);
});

// SvelteKit handler
app.use(handler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
