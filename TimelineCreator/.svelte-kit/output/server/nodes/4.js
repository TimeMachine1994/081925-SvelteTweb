import * as server from '../entries/pages/demo/lucia/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/demo/lucia/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/demo/lucia/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.D3kITfy_.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DTgLX9Ee.js","_app/immutable/chunks/v4JbXSf4.js","_app/immutable/chunks/DBhI2FdN.js","_app/immutable/chunks/DSvGXDaz.js","_app/immutable/chunks/BFq2IrBU.js","_app/immutable/chunks/BWiauZHh.js"];
export const stylesheets = [];
export const fonts = [];
