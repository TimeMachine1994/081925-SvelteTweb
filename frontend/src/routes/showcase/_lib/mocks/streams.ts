/**
 * Mock streams for the memorial page (data.streams).
 * Re-exported from the consolidated `showcase-data.json` (single source of truth).
 * Shape mirrors routes/[fullSlug]/+page.server.ts stream serialization.
 */
import data from '../showcase-data.json';

export const memorialStreams = data.streams.memorial;

export const noStreams: typeof memorialStreams = [];
