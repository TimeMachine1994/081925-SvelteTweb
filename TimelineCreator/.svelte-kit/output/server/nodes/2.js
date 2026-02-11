import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.seTKOwrH.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DTgLX9Ee.js","_app/immutable/chunks/v4JbXSf4.js","_app/immutable/chunks/HtzLKq4Y.js","_app/immutable/chunks/DAFFdRpb.js","_app/immutable/chunks/DvokXvFK.js","_app/immutable/chunks/BpjAAsxp.js","_app/immutable/chunks/BTpgyCKD.js","_app/immutable/chunks/DBhI2FdN.js","_app/immutable/chunks/DSvGXDaz.js","_app/immutable/chunks/BFq2IrBU.js","_app/immutable/chunks/BWiauZHh.js"];
export const stylesheets = [];
export const fonts = [];
