
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/auth" | "/api/auth/logout" | "/api/auth/magic-link" | "/api/files" | "/api/files/[id]" | "/api/files/[id]/download" | "/api/stripe" | "/api/stripe/webhook" | "/api/upload" | "/auth" | "/auth/verify" | "/dashboard" | "/dashboard/checkout" | "/dashboard/orders" | "/demo" | "/demo/lucia" | "/demo/lucia/login" | "/login";
		RouteParams(): {
			"/api/files/[id]": { id: string };
			"/api/files/[id]/download": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/auth": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/auth/magic-link": Record<string, never>;
			"/api/files": { id?: string };
			"/api/files/[id]": { id: string };
			"/api/files/[id]/download": { id: string };
			"/api/stripe": Record<string, never>;
			"/api/stripe/webhook": Record<string, never>;
			"/api/upload": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/verify": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/dashboard/checkout": Record<string, never>;
			"/dashboard/orders": Record<string, never>;
			"/demo": Record<string, never>;
			"/demo/lucia": Record<string, never>;
			"/demo/lucia/login": Record<string, never>;
			"/login": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/auth" | "/api/auth/" | "/api/auth/logout" | "/api/auth/logout/" | "/api/auth/magic-link" | "/api/auth/magic-link/" | "/api/files" | "/api/files/" | `/api/files/${string}` & {} | `/api/files/${string}/` & {} | `/api/files/${string}/download` & {} | `/api/files/${string}/download/` & {} | "/api/stripe" | "/api/stripe/" | "/api/stripe/webhook" | "/api/stripe/webhook/" | "/api/upload" | "/api/upload/" | "/auth" | "/auth/" | "/auth/verify" | "/auth/verify/" | "/dashboard" | "/dashboard/" | "/dashboard/checkout" | "/dashboard/checkout/" | "/dashboard/orders" | "/dashboard/orders/" | "/demo" | "/demo/" | "/demo/lucia" | "/demo/lucia/" | "/demo/lucia/login" | "/demo/lucia/login/" | "/login" | "/login/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | string & {};
	}
}