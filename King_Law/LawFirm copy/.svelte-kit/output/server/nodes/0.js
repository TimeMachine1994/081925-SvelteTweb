import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true
};
export const universal_id = "src/routes/+layout.js";
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.Dm_ppE-t.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/CDyhWRaV.js","_app/immutable/chunks/DPlwpyv4.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/BWkr1JC7.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/DCU1Ojhw.js","_app/immutable/chunks/CHcLBrAE.js","_app/immutable/chunks/ChuonPa7.js","_app/immutable/chunks/DA9yQoT1.js","_app/immutable/chunks/Bd7JbOWx.js","_app/immutable/chunks/Bvsk-MJo.js","_app/immutable/chunks/DEntcEzZ.js"];
export const stylesheets = ["_app/immutable/assets/0.BRviRw-z.css"];
export const fonts = [];
