import * as server from '../entries/pages/dashboard/_layout.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true,
  "load": null
};
export const universal_id = "src/routes/dashboard/+layout.ts";
export { server };
export const server_id = "src/routes/dashboard/+layout.server.ts";
export const imports = ["_app/immutable/nodes/2.mxy2he2x.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/DCU1Ojhw.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/CDyhWRaV.js","_app/immutable/chunks/kdKvI6J3.js","_app/immutable/chunks/KcK37t61.js","_app/immutable/chunks/ChuonPa7.js","_app/immutable/chunks/DA9yQoT1.js","_app/immutable/chunks/Bd7JbOWx.js","_app/immutable/chunks/DPlwpyv4.js","_app/immutable/chunks/BWkr1JC7.js","_app/immutable/chunks/Bvsk-MJo.js","_app/immutable/chunks/CdHI69fF.js","_app/immutable/chunks/DEntcEzZ.js","_app/immutable/chunks/gwp2kNc8.js","_app/immutable/chunks/DZZ0T8PC.js","_app/immutable/chunks/BUoJme2u.js","_app/immutable/chunks/CHcLBrAE.js","_app/immutable/chunks/C6AnL1le.js","_app/immutable/chunks/CcdUjOc9.js","_app/immutable/chunks/DDYehTit.js","_app/immutable/chunks/dYJeuiA7.js","_app/immutable/chunks/akv37UGq.js"];
export const stylesheets = [];
export const fonts = [];
