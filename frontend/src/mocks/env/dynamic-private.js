// Test stand-in for `$env/dynamic/private`: exposes process.env so server modules
// (db client, backend selector) can be imported under vitest.
export const env = process.env;
