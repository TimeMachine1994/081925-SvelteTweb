import * as server from '../entries/pages/projects/_id_/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/projects/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/projects/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.CPGNl-Ca.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DTgLX9Ee.js","_app/immutable/chunks/v4JbXSf4.js","_app/immutable/chunks/HtzLKq4Y.js","_app/immutable/chunks/DAFFdRpb.js","_app/immutable/chunks/DvokXvFK.js","_app/immutable/chunks/BpjAAsxp.js","_app/immutable/chunks/BTpgyCKD.js","_app/immutable/chunks/jYRcSpyO.js"];
export const stylesheets = ["_app/immutable/assets/6.DOsLHmfD.css"];
export const fonts = [];
