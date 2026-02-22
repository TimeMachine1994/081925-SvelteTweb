export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".htaccess","fonts/goudy_bookletter_1911-webfont.woff","fonts/junction-bold.woff","fonts/junction-light.woff","fonts/junction-regular.woff","fonts/LeagueScriptNumberOne-webfont.woff","fonts/README.md","robots.txt","_redirects"]),
	mimeTypes: {".woff":"font/woff",".md":"text/markdown",".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.B1BiG8I1.js",app:"_app/immutable/entry/app.DQA7ewos.js",imports:["_app/immutable/entry/start.B1BiG8I1.js","_app/immutable/chunks/C9J4-TpB.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/BnzaMYlX.js","_app/immutable/entry/app.DQA7ewos.js","_app/immutable/chunks/B-pO4mCF.js","_app/immutable/chunks/DvfFCxCt.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BBP4EwLY.js","_app/immutable/chunks/BgOnAeI3.js","_app/immutable/chunks/CDyhWRaV.js","_app/immutable/chunks/KcK37t61.js","_app/immutable/chunks/dYJeuiA7.js","_app/immutable/chunks/Bd7JbOWx.js","_app/immutable/chunks/DPlwpyv4.js","_app/immutable/chunks/BnzaMYlX.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js')),
			__memo(() => import('../output/server/nodes/11.js')),
			__memo(() => import('../output/server/nodes/12.js')),
			__memo(() => import('../output/server/nodes/13.js')),
			__memo(() => import('../output/server/nodes/14.js')),
			__memo(() => import('../output/server/nodes/15.js')),
			__memo(() => import('../output/server/nodes/16.js')),
			__memo(() => import('../output/server/nodes/17.js')),
			__memo(() => import('../output/server/nodes/18.js')),
			__memo(() => import('../output/server/nodes/19.js')),
			__memo(() => import('../output/server/nodes/20.js')),
			__memo(() => import('../output/server/nodes/21.js')),
			__memo(() => import('../output/server/nodes/22.js')),
			__memo(() => import('../output/server/nodes/23.js')),
			__memo(() => import('../output/server/nodes/24.js')),
			__memo(() => import('../output/server/nodes/25.js')),
			__memo(() => import('../output/server/nodes/26.js')),
			__memo(() => import('../output/server/nodes/27.js')),
			__memo(() => import('../output/server/nodes/28.js')),
			__memo(() => import('../output/server/nodes/29.js')),
			__memo(() => import('../output/server/nodes/30.js')),
			__memo(() => import('../output/server/nodes/31.js')),
			__memo(() => import('../output/server/nodes/32.js')),
			__memo(() => import('../output/server/nodes/33.js')),
			__memo(() => import('../output/server/nodes/34.js')),
			__memo(() => import('../output/server/nodes/35.js')),
			__memo(() => import('../output/server/nodes/36.js')),
			__memo(() => import('../output/server/nodes/37.js')),
			__memo(() => import('../output/server/nodes/38.js')),
			__memo(() => import('../output/server/nodes/39.js')),
			__memo(() => import('../output/server/nodes/40.js')),
			__memo(() => import('../output/server/nodes/41.js')),
			__memo(() => import('../output/server/nodes/42.js')),
			__memo(() => import('../output/server/nodes/43.js')),
			__memo(() => import('../output/server/nodes/44.js')),
			__memo(() => import('../output/server/nodes/45.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/Fortress",
				pattern: /^\/Fortress\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/api/admin/settings/staff-password",
				pattern: /^\/api\/admin\/settings\/staff-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/admin/settings/staff-password/_server.ts.js'))
			},
			{
				id: "/api/admin/staff-codes",
				pattern: /^\/api\/admin\/staff-codes\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/admin/staff-codes/_server.ts.js'))
			},
			{
				id: "/api/admin/staff-codes/[id]",
				pattern: /^\/api\/admin\/staff-codes\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/admin/staff-codes/_id_/_server.ts.js'))
			},
			{
				id: "/api/admin/stats",
				pattern: /^\/api\/admin\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/admin/stats/_server.ts.js'))
			},
			{
				id: "/api/admin/test-cleanup",
				pattern: /^\/api\/admin\/test-cleanup\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/admin/test-cleanup/_server.ts.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/login/_server.ts.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/auth/register-staff",
				pattern: /^\/api\/auth\/register-staff\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/register-staff/_server.ts.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/register/_server.ts.js'))
			},
			{
				id: "/api/auth/user",
				pattern: /^\/api\/auth\/user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/user/_server.ts.js'))
			},
			{
				id: "/api/auth/verify-staff-password",
				pattern: /^\/api\/auth\/verify-staff-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/verify-staff-password/_server.ts.js'))
			},
			{
				id: "/api/cases",
				pattern: /^\/api\/cases\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/cases/_server.ts.js'))
			},
			{
				id: "/api/cases/[id]",
				pattern: /^\/api\/cases\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/cases/_id_/_server.ts.js'))
			},
			{
				id: "/api/cases/[id]/staff",
				pattern: /^\/api\/cases\/([^/]+?)\/staff\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/cases/_id_/staff/_server.ts.js'))
			},
			{
				id: "/api/consultations",
				pattern: /^\/api\/consultations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/consultations/_server.ts.js'))
			},
			{
				id: "/api/documents",
				pattern: /^\/api\/documents\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/documents/_server.ts.js'))
			},
			{
				id: "/api/documents/upload",
				pattern: /^\/api\/documents\/upload\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/documents/upload/_server.ts.js'))
			},
			{
				id: "/api/documents/[id]",
				pattern: /^\/api\/documents\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/documents/_id_/_server.ts.js'))
			},
			{
				id: "/api/files/delete",
				pattern: /^\/api\/files\/delete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/files/delete/_server.ts.js'))
			},
			{
				id: "/api/files/download",
				pattern: /^\/api\/files\/download\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/files/download/_server.ts.js'))
			},
			{
				id: "/api/files/list",
				pattern: /^\/api\/files\/list\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/files/list/_server.ts.js'))
			},
			{
				id: "/api/files/upload",
				pattern: /^\/api\/files\/upload\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/files/upload/_server.ts.js'))
			},
			{
				id: "/api/invoices",
				pattern: /^\/api\/invoices\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/invoices/_server.ts.js'))
			},
			{
				id: "/api/invoices/[id]",
				pattern: /^\/api\/invoices\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/invoices/_id_/_server.ts.js'))
			},
			{
				id: "/api/invoices/[id]/pay",
				pattern: /^\/api\/invoices\/([^/]+?)\/pay\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/invoices/_id_/pay/_server.ts.js'))
			},
			{
				id: "/api/messages",
				pattern: /^\/api\/messages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/messages/_server.ts.js'))
			},
			{
				id: "/api/messages/mark-read",
				pattern: /^\/api\/messages\/mark-read\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/messages/mark-read/_server.ts.js'))
			},
			{
				id: "/api/messages/poll",
				pattern: /^\/api\/messages\/poll\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/messages/poll/_server.ts.js'))
			},
			{
				id: "/api/messages/send",
				pattern: /^\/api\/messages\/send\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/messages/send/_server.ts.js'))
			},
			{
				id: "/api/messages/unread",
				pattern: /^\/api\/messages\/unread\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/messages/unread/_server.ts.js'))
			},
			{
				id: "/api/schedule/availability",
				pattern: /^\/api\/schedule\/availability\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/schedule/availability/_server.ts.js'))
			},
			{
				id: "/api/schedule/book",
				pattern: /^\/api\/schedule\/book\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/schedule/book/_server.ts.js'))
			},
			{
				id: "/api/square/create-payment-link",
				pattern: /^\/api\/square\/create-payment-link\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/square/create-payment-link/_server.ts.js'))
			},
			{
				id: "/api/staff/cases",
				pattern: /^\/api\/staff\/cases\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/staff/cases/_server.ts.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/users/_server.ts.js'))
			},
			{
				id: "/api/users/staff",
				pattern: /^\/api\/users\/staff\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/users/staff/_server.ts.js'))
			},
			{
				id: "/contact",
				pattern: /^\/contact\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/dashboard/admin",
				pattern: /^\/dashboard\/admin\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/dashboard/admin/settings",
				pattern: /^\/dashboard\/admin\/settings\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/dashboard/admin/staff-codes",
				pattern: /^\/dashboard\/admin\/staff-codes\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/dashboard/client",
				pattern: /^\/dashboard\/client\/?$/,
				params: [],
				page: { layouts: [0,2,4,], errors: [1,,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/dashboard/client/case/[id]",
				pattern: /^\/dashboard\/client\/case\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/dashboard/client/documents",
				pattern: /^\/dashboard\/client\/documents\/?$/,
				params: [],
				page: { layouts: [0,2,4,], errors: [1,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/dashboard/client/invoices",
				pattern: /^\/dashboard\/client\/invoices\/?$/,
				params: [],
				page: { layouts: [0,2,4,], errors: [1,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/dashboard/client/invoices/[id]/pay",
				pattern: /^\/dashboard\/client\/invoices\/([^/]+?)\/pay\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,4,], errors: [1,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/dashboard/lawyer",
				pattern: /^\/dashboard\/lawyer\/?$/,
				params: [],
				page: { layouts: [0,2,5,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/dashboard/lawyer/case/[id]",
				pattern: /^\/dashboard\/lawyer\/case\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,5,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/dashboard/lawyer/documents",
				pattern: /^\/dashboard\/lawyer\/documents\/?$/,
				params: [],
				page: { layouts: [0,2,5,], errors: [1,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/dashboard/profile",
				pattern: /^\/dashboard\/profile\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/dashboard/staff",
				pattern: /^\/dashboard\/staff\/?$/,
				params: [],
				page: { layouts: [0,2,6,], errors: [1,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/dashboard/staff/cases/[id]",
				pattern: /^\/dashboard\/staff\/cases\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,6,], errors: [1,,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/logout/_server.ts.js'))
			},
			{
				id: "/meet-ben-king",
				pattern: /^\/meet-ben-king\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/our-team",
				pattern: /^\/our-team\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/pay-bill",
				pattern: /^\/pay-bill\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/request-consultation",
				pattern: /^\/request-consultation\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/samples",
				pattern: /^\/samples\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/samples/classic",
				pattern: /^\/samples\/classic\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/samples/elegant",
				pattern: /^\/samples\/elegant\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/samples/modern",
				pattern: /^\/samples\/modern\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/schedule",
				pattern: /^\/schedule\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/services/appeals",
				pattern: /^\/services\/appeals\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/services/cannabis-law",
				pattern: /^\/services\/cannabis-law\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/services/civil-rights",
				pattern: /^\/services\/civil-rights\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/services/criminal-defense",
				pattern: /^\/services\/criminal-defense\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/services/employment-law",
				pattern: /^\/services\/employment-law\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/services/personal-injury",
				pattern: /^\/services\/personal-injury\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/services/property-damage",
				pattern: /^\/services\/property-damage\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/services/real-estate-business",
				pattern: /^\/services\/real-estate-business\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/staff-sign-up",
				pattern: /^\/staff-sign-up\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/staff-sign-up/register",
				pattern: /^\/staff-sign-up\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/test/square-payment",
				pattern: /^\/test\/square-payment\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 45 },
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
