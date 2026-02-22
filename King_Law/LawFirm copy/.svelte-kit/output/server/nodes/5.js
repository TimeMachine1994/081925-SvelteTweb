import * as server from '../entries/pages/dashboard/lawyer/_layout.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/lawyer/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true,
  "load": null
};
export const universal_id = "src/routes/dashboard/lawyer/+layout.ts";
export { server };
export const server_id = "src/routes/dashboard/lawyer/+layout.server.ts";
export const imports = ["_app/immutable/nodes/5.u0AayKBr.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/DCU1Ojhw.js","_app/immutable/chunks/DsnmJJEf.js"];
export const stylesheets = [];
export const fonts = [];
