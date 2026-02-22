

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/admin/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true,
  "load": null
};
export const universal_id = "src/routes/dashboard/admin/+layout.ts";
export const imports = ["_app/immutable/nodes/3.BauYhR9Z.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/chunks/DCU1Ojhw.js","_app/immutable/chunks/DsnmJJEf.js"];
export const stylesheets = [];
export const fonts = [];
