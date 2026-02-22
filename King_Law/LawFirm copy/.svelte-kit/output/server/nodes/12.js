import * as server from '../entries/pages/dashboard/client/_page.server.ts.js';

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/client/_page.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true,
  "load": null
};
export const universal_id = "src/routes/dashboard/client/+page.ts";
export { server };
export const server_id = "src/routes/dashboard/client/+page.server.ts";
export const imports = ["_app/immutable/nodes/12.BXC0rutp.js","_app/immutable/chunks/CAloa-4C.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/BqaZT8FZ.js","_app/immutable/chunks/Poe3fVgD.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/CDyhWRaV.js","_app/immutable/chunks/kdKvI6J3.js","_app/immutable/chunks/ChuonPa7.js","_app/immutable/chunks/DA9yQoT1.js","_app/immutable/chunks/wAnkz-0P.js","_app/immutable/chunks/bgAIRmhJ.js","_app/immutable/chunks/KcK37t61.js","_app/immutable/chunks/Bd7JbOWx.js","_app/immutable/chunks/DPlwpyv4.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/q-i4CDpP.js","_app/immutable/chunks/B1ijh1db.js","_app/immutable/chunks/1DKvJEvK.js","_app/immutable/chunks/Bvsk-MJo.js","_app/immutable/chunks/CdHI69fF.js","_app/immutable/chunks/DEntcEzZ.js","_app/immutable/chunks/CIKB7KeI.js","_app/immutable/chunks/BD2vhZBS.js","_app/immutable/chunks/akv37UGq.js","_app/immutable/chunks/C2BGXy3H.js","_app/immutable/chunks/BUoJme2u.js"];
export const stylesheets = [];
export const fonts = [];
