import * as server from '../entries/pages/contact/_page.server.ts.js';

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/contact/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/contact/+page.server.ts";
export const imports = ["_app/immutable/nodes/8.FEmCHHJh.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/CDyhWRaV.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/B1Qpclnq.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/BnzaMYlX.js"];
export const stylesheets = [];
export const fonts = [];
