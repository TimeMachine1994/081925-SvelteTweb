import * as server from '../entries/pages/dashboard/client/_layout.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/client/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true,
  "load": null
};
export const universal_id = "src/routes/dashboard/client/+layout.ts";
export { server };
export const server_id = "src/routes/dashboard/client/+layout.server.ts";
export const imports = ["_app/immutable/nodes/4.C2V3w_vV.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/DCU1Ojhw.js","_app/immutable/chunks/DsnmJJEf.js"];
export const stylesheets = [];
export const fonts = [];
