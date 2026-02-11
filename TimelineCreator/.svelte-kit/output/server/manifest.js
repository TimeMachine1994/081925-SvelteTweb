export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.C4bL8ByH.js",app:"_app/immutable/entry/app.CUs53Ln1.js",imports:["_app/immutable/entry/start.C4bL8ByH.js","_app/immutable/chunks/DSvGXDaz.js","_app/immutable/chunks/BFq2IrBU.js","_app/immutable/chunks/DTgLX9Ee.js","_app/immutable/chunks/v4JbXSf4.js","_app/immutable/chunks/BWiauZHh.js","_app/immutable/entry/app.CUs53Ln1.js","_app/immutable/chunks/DTgLX9Ee.js","_app/immutable/chunks/v4JbXSf4.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BFq2IrBU.js","_app/immutable/chunks/HtzLKq4Y.js","_app/immutable/chunks/DAFFdRpb.js","_app/immutable/chunks/jYRcSpyO.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/projects",
				pattern: /^\/api\/projects\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/projects/_server.ts.js'))
			},
			{
				id: "/api/projects/[id]",
				pattern: /^\/api\/projects\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/projects/_id_/_server.ts.js'))
			},
			{
				id: "/api/projects/[id]/events",
				pattern: /^\/api\/projects\/([^/]+?)\/events\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/projects/_id_/events/_server.ts.js'))
			},
			{
				id: "/api/projects/[id]/print-layout",
				pattern: /^\/api\/projects\/([^/]+?)\/print-layout\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/projects/_id_/print-layout/_server.ts.js'))
			},
			{
				id: "/api/validate-sheets",
				pattern: /^\/api\/validate-sheets\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/validate-sheets/_server.ts.js'))
			},
			{
				id: "/demo",
				pattern: /^\/demo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/demo/lucia",
				pattern: /^\/demo\/lucia\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/demo/lucia/login",
				pattern: /^\/demo\/lucia\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/projects/[id]",
				pattern: /^\/projects\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
