
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
		RouteId(): "/" | "/api" | "/api/projects" | "/api/projects/[id]" | "/api/projects/[id]/events" | "/api/projects/[id]/print-layout" | "/api/validate-sheets" | "/demo" | "/demo/lucia" | "/demo/lucia/login" | "/projects" | "/projects/[id]";
		RouteParams(): {
			"/api/projects/[id]": { id: string };
			"/api/projects/[id]/events": { id: string };
			"/api/projects/[id]/print-layout": { id: string };
			"/projects/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/projects": { id?: string };
			"/api/projects/[id]": { id: string };
			"/api/projects/[id]/events": { id: string };
			"/api/projects/[id]/print-layout": { id: string };
			"/api/validate-sheets": Record<string, never>;
			"/demo": Record<string, never>;
			"/demo/lucia": Record<string, never>;
			"/demo/lucia/login": Record<string, never>;
			"/projects": { id?: string };
			"/projects/[id]": { id: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/projects" | "/api/projects/" | `/api/projects/${string}` & {} | `/api/projects/${string}/` & {} | `/api/projects/${string}/events` & {} | `/api/projects/${string}/events/` & {} | `/api/projects/${string}/print-layout` & {} | `/api/projects/${string}/print-layout/` & {} | "/api/validate-sheets" | "/api/validate-sheets/" | "/demo" | "/demo/" | "/demo/lucia" | "/demo/lucia/" | "/demo/lucia/login" | "/demo/lucia/login/" | "/projects" | "/projects/" | `/projects/${string}` & {} | `/projects/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | string & {};
	}
}