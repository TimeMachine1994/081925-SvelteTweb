
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
		RouteId(): "/" | "/Fortress" | "/about" | "/api" | "/api/admin" | "/api/admin/settings" | "/api/admin/settings/staff-password" | "/api/admin/staff-codes" | "/api/admin/staff-codes/[id]" | "/api/admin/stats" | "/api/admin/test-cleanup" | "/api/auth" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/profile" | "/api/auth/register-staff" | "/api/auth/register" | "/api/auth/user" | "/api/auth/verify-staff-password" | "/api/cases" | "/api/cases/from-uncategorized" | "/api/cases/[id]" | "/api/cases/[id]/staff" | "/api/consultations" | "/api/documents" | "/api/documents/chunk" | "/api/documents/copy" | "/api/documents/reassign" | "/api/documents/upload" | "/api/documents/[id]" | "/api/files" | "/api/files/delete" | "/api/files/download" | "/api/files/list" | "/api/files/upload" | "/api/invoices" | "/api/invoices/[id]" | "/api/invoices/[id]/pay" | "/api/messages" | "/api/messages/copy" | "/api/messages/mark-read" | "/api/messages/poll" | "/api/messages/reassign" | "/api/messages/send" | "/api/messages/unread" | "/api/messages/[id]" | "/api/messages/[caseId]" | "/api/messages/[id]/read" | "/api/schedule" | "/api/schedule/availability" | "/api/schedule/book" | "/api/square" | "/api/square/create-payment-link" | "/api/square/remove-card" | "/api/square/save-card" | "/api/staff" | "/api/staff/cases" | "/api/users" | "/api/users/staff" | "/contact" | "/dashboard" | "/dashboard/admin" | "/dashboard/admin/settings" | "/dashboard/admin/staff-codes" | "/dashboard/client" | "/dashboard/client/case" | "/dashboard/client/case/[id]" | "/dashboard/client/documents" | "/dashboard/client/invoices" | "/dashboard/client/invoices/[id]" | "/dashboard/client/invoices/[id]/pay" | "/dashboard/lawyer" | "/dashboard/lawyer/case" | "/dashboard/lawyer/case/[id]" | "/dashboard/lawyer/client" | "/dashboard/lawyer/client/[id]" | "/dashboard/lawyer/documents" | "/dashboard/profile" | "/dashboard/staff" | "/dashboard/staff/cases" | "/dashboard/staff/cases/[id]" | "/demo" | "/demo/lucia" | "/demo/lucia/login" | "/login" | "/logout" | "/meet-ben-king" | "/our-team" | "/pay-bill" | "/register" | "/request-consultation" | "/samples" | "/samples/classic" | "/samples/elegant" | "/samples/modern" | "/schedule" | "/services" | "/services/appellate-strategy" | "/services/business-intellectual-property" | "/services/business-investment" | "/services/cannabis-law" | "/services/civil-rights" | "/services/criminal-defense" | "/services/executive-counsel" | "/services/family-estate-law" | "/services/personal-injury" | "/services/property-claims" | "/staff-sign-up" | "/staff-sign-up/register" | "/test" | "/test/square-payment";
		RouteParams(): {
			"/api/admin/staff-codes/[id]": { id: string };
			"/api/cases/[id]": { id: string };
			"/api/cases/[id]/staff": { id: string };
			"/api/documents/[id]": { id: string };
			"/api/invoices/[id]": { id: string };
			"/api/invoices/[id]/pay": { id: string };
			"/api/messages/[id]": { id: string };
			"/api/messages/[caseId]": { caseId: string };
			"/api/messages/[id]/read": { id: string };
			"/dashboard/client/case/[id]": { id: string };
			"/dashboard/client/invoices/[id]": { id: string };
			"/dashboard/client/invoices/[id]/pay": { id: string };
			"/dashboard/lawyer/case/[id]": { id: string };
			"/dashboard/lawyer/client/[id]": { id: string };
			"/dashboard/staff/cases/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string; caseId?: string };
			"/Fortress": Record<string, never>;
			"/about": Record<string, never>;
			"/api": { id?: string; caseId?: string };
			"/api/admin": { id?: string };
			"/api/admin/settings": Record<string, never>;
			"/api/admin/settings/staff-password": Record<string, never>;
			"/api/admin/staff-codes": { id?: string };
			"/api/admin/staff-codes/[id]": { id: string };
			"/api/admin/stats": Record<string, never>;
			"/api/admin/test-cleanup": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/auth/profile": Record<string, never>;
			"/api/auth/register-staff": Record<string, never>;
			"/api/auth/register": Record<string, never>;
			"/api/auth/user": Record<string, never>;
			"/api/auth/verify-staff-password": Record<string, never>;
			"/api/cases": { id?: string };
			"/api/cases/from-uncategorized": Record<string, never>;
			"/api/cases/[id]": { id: string };
			"/api/cases/[id]/staff": { id: string };
			"/api/consultations": Record<string, never>;
			"/api/documents": { id?: string };
			"/api/documents/chunk": Record<string, never>;
			"/api/documents/copy": Record<string, never>;
			"/api/documents/reassign": Record<string, never>;
			"/api/documents/upload": Record<string, never>;
			"/api/documents/[id]": { id: string };
			"/api/files": Record<string, never>;
			"/api/files/delete": Record<string, never>;
			"/api/files/download": Record<string, never>;
			"/api/files/list": Record<string, never>;
			"/api/files/upload": Record<string, never>;
			"/api/invoices": { id?: string };
			"/api/invoices/[id]": { id: string };
			"/api/invoices/[id]/pay": { id: string };
			"/api/messages": { id?: string; caseId?: string };
			"/api/messages/copy": Record<string, never>;
			"/api/messages/mark-read": Record<string, never>;
			"/api/messages/poll": Record<string, never>;
			"/api/messages/reassign": Record<string, never>;
			"/api/messages/send": Record<string, never>;
			"/api/messages/unread": Record<string, never>;
			"/api/messages/[id]": { id: string };
			"/api/messages/[caseId]": { caseId: string };
			"/api/messages/[id]/read": { id: string };
			"/api/schedule": Record<string, never>;
			"/api/schedule/availability": Record<string, never>;
			"/api/schedule/book": Record<string, never>;
			"/api/square": Record<string, never>;
			"/api/square/create-payment-link": Record<string, never>;
			"/api/square/remove-card": Record<string, never>;
			"/api/square/save-card": Record<string, never>;
			"/api/staff": Record<string, never>;
			"/api/staff/cases": Record<string, never>;
			"/api/users": Record<string, never>;
			"/api/users/staff": Record<string, never>;
			"/contact": Record<string, never>;
			"/dashboard": { id?: string };
			"/dashboard/admin": Record<string, never>;
			"/dashboard/admin/settings": Record<string, never>;
			"/dashboard/admin/staff-codes": Record<string, never>;
			"/dashboard/client": { id?: string };
			"/dashboard/client/case": { id?: string };
			"/dashboard/client/case/[id]": { id: string };
			"/dashboard/client/documents": Record<string, never>;
			"/dashboard/client/invoices": { id?: string };
			"/dashboard/client/invoices/[id]": { id: string };
			"/dashboard/client/invoices/[id]/pay": { id: string };
			"/dashboard/lawyer": { id?: string };
			"/dashboard/lawyer/case": { id?: string };
			"/dashboard/lawyer/case/[id]": { id: string };
			"/dashboard/lawyer/client": { id?: string };
			"/dashboard/lawyer/client/[id]": { id: string };
			"/dashboard/lawyer/documents": Record<string, never>;
			"/dashboard/profile": Record<string, never>;
			"/dashboard/staff": { id?: string };
			"/dashboard/staff/cases": { id?: string };
			"/dashboard/staff/cases/[id]": { id: string };
			"/demo": Record<string, never>;
			"/demo/lucia": Record<string, never>;
			"/demo/lucia/login": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/meet-ben-king": Record<string, never>;
			"/our-team": Record<string, never>;
			"/pay-bill": Record<string, never>;
			"/register": Record<string, never>;
			"/request-consultation": Record<string, never>;
			"/samples": Record<string, never>;
			"/samples/classic": Record<string, never>;
			"/samples/elegant": Record<string, never>;
			"/samples/modern": Record<string, never>;
			"/schedule": Record<string, never>;
			"/services": Record<string, never>;
			"/services/appellate-strategy": Record<string, never>;
			"/services/business-intellectual-property": Record<string, never>;
			"/services/business-investment": Record<string, never>;
			"/services/cannabis-law": Record<string, never>;
			"/services/civil-rights": Record<string, never>;
			"/services/criminal-defense": Record<string, never>;
			"/services/executive-counsel": Record<string, never>;
			"/services/family-estate-law": Record<string, never>;
			"/services/personal-injury": Record<string, never>;
			"/services/property-claims": Record<string, never>;
			"/staff-sign-up": Record<string, never>;
			"/staff-sign-up/register": Record<string, never>;
			"/test": Record<string, never>;
			"/test/square-payment": Record<string, never>
		};
		Pathname(): "/" | "/Fortress" | "/Fortress/" | "/about" | "/about/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/settings" | "/api/admin/settings/" | "/api/admin/settings/staff-password" | "/api/admin/settings/staff-password/" | "/api/admin/staff-codes" | "/api/admin/staff-codes/" | `/api/admin/staff-codes/${string}` & {} | `/api/admin/staff-codes/${string}/` & {} | "/api/admin/stats" | "/api/admin/stats/" | "/api/admin/test-cleanup" | "/api/admin/test-cleanup/" | "/api/auth" | "/api/auth/" | "/api/auth/login" | "/api/auth/login/" | "/api/auth/logout" | "/api/auth/logout/" | "/api/auth/profile" | "/api/auth/profile/" | "/api/auth/register-staff" | "/api/auth/register-staff/" | "/api/auth/register" | "/api/auth/register/" | "/api/auth/user" | "/api/auth/user/" | "/api/auth/verify-staff-password" | "/api/auth/verify-staff-password/" | "/api/cases" | "/api/cases/" | "/api/cases/from-uncategorized" | "/api/cases/from-uncategorized/" | `/api/cases/${string}` & {} | `/api/cases/${string}/` & {} | `/api/cases/${string}/staff` & {} | `/api/cases/${string}/staff/` & {} | "/api/consultations" | "/api/consultations/" | "/api/documents" | "/api/documents/" | "/api/documents/chunk" | "/api/documents/chunk/" | "/api/documents/copy" | "/api/documents/copy/" | "/api/documents/reassign" | "/api/documents/reassign/" | "/api/documents/upload" | "/api/documents/upload/" | `/api/documents/${string}` & {} | `/api/documents/${string}/` & {} | "/api/files" | "/api/files/" | "/api/files/delete" | "/api/files/delete/" | "/api/files/download" | "/api/files/download/" | "/api/files/list" | "/api/files/list/" | "/api/files/upload" | "/api/files/upload/" | "/api/invoices" | "/api/invoices/" | `/api/invoices/${string}` & {} | `/api/invoices/${string}/` & {} | `/api/invoices/${string}/pay` & {} | `/api/invoices/${string}/pay/` & {} | "/api/messages" | "/api/messages/" | "/api/messages/copy" | "/api/messages/copy/" | "/api/messages/mark-read" | "/api/messages/mark-read/" | "/api/messages/poll" | "/api/messages/poll/" | "/api/messages/reassign" | "/api/messages/reassign/" | "/api/messages/send" | "/api/messages/send/" | "/api/messages/unread" | "/api/messages/unread/" | `/api/messages/${string}` & {} | `/api/messages/${string}/` & {} | `/api/messages/${string}/read` & {} | `/api/messages/${string}/read/` & {} | "/api/schedule" | "/api/schedule/" | "/api/schedule/availability" | "/api/schedule/availability/" | "/api/schedule/book" | "/api/schedule/book/" | "/api/square" | "/api/square/" | "/api/square/create-payment-link" | "/api/square/create-payment-link/" | "/api/square/remove-card" | "/api/square/remove-card/" | "/api/square/save-card" | "/api/square/save-card/" | "/api/staff" | "/api/staff/" | "/api/staff/cases" | "/api/staff/cases/" | "/api/users" | "/api/users/" | "/api/users/staff" | "/api/users/staff/" | "/contact" | "/contact/" | "/dashboard" | "/dashboard/" | "/dashboard/admin" | "/dashboard/admin/" | "/dashboard/admin/settings" | "/dashboard/admin/settings/" | "/dashboard/admin/staff-codes" | "/dashboard/admin/staff-codes/" | "/dashboard/client" | "/dashboard/client/" | "/dashboard/client/case" | "/dashboard/client/case/" | `/dashboard/client/case/${string}` & {} | `/dashboard/client/case/${string}/` & {} | "/dashboard/client/documents" | "/dashboard/client/documents/" | "/dashboard/client/invoices" | "/dashboard/client/invoices/" | `/dashboard/client/invoices/${string}` & {} | `/dashboard/client/invoices/${string}/` & {} | `/dashboard/client/invoices/${string}/pay` & {} | `/dashboard/client/invoices/${string}/pay/` & {} | "/dashboard/lawyer" | "/dashboard/lawyer/" | "/dashboard/lawyer/case" | "/dashboard/lawyer/case/" | `/dashboard/lawyer/case/${string}` & {} | `/dashboard/lawyer/case/${string}/` & {} | "/dashboard/lawyer/client" | "/dashboard/lawyer/client/" | `/dashboard/lawyer/client/${string}` & {} | `/dashboard/lawyer/client/${string}/` & {} | "/dashboard/lawyer/documents" | "/dashboard/lawyer/documents/" | "/dashboard/profile" | "/dashboard/profile/" | "/dashboard/staff" | "/dashboard/staff/" | "/dashboard/staff/cases" | "/dashboard/staff/cases/" | `/dashboard/staff/cases/${string}` & {} | `/dashboard/staff/cases/${string}/` & {} | "/demo" | "/demo/" | "/demo/lucia" | "/demo/lucia/" | "/demo/lucia/login" | "/demo/lucia/login/" | "/login" | "/login/" | "/logout" | "/logout/" | "/meet-ben-king" | "/meet-ben-king/" | "/our-team" | "/our-team/" | "/pay-bill" | "/pay-bill/" | "/register" | "/register/" | "/request-consultation" | "/request-consultation/" | "/samples" | "/samples/" | "/samples/classic" | "/samples/classic/" | "/samples/elegant" | "/samples/elegant/" | "/samples/modern" | "/samples/modern/" | "/schedule" | "/schedule/" | "/services" | "/services/" | "/services/appellate-strategy" | "/services/appellate-strategy/" | "/services/business-intellectual-property" | "/services/business-intellectual-property/" | "/services/business-investment" | "/services/business-investment/" | "/services/cannabis-law" | "/services/cannabis-law/" | "/services/civil-rights" | "/services/civil-rights/" | "/services/criminal-defense" | "/services/criminal-defense/" | "/services/executive-counsel" | "/services/executive-counsel/" | "/services/family-estate-law" | "/services/family-estate-law/" | "/services/personal-injury" | "/services/personal-injury/" | "/services/property-claims" | "/services/property-claims/" | "/staff-sign-up" | "/staff-sign-up/" | "/staff-sign-up/register" | "/staff-sign-up/register/" | "/test" | "/test/" | "/test/square-payment" | "/test/square-payment/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/fonts/goudy_bookletter_1911-webfont.woff" | "/fonts/junction-bold.woff" | "/fonts/junction-light.woff" | "/fonts/junction-regular.woff" | "/fonts/LeagueScriptNumberOne-webfont.woff" | "/fonts/README.md" | "/robots.txt" | string & {};
	}
}