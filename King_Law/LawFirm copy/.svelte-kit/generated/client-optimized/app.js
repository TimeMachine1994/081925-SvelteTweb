export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45')
];

export const server_loads = [0,2,4,5];

export const dictionary = {
		"/": [7],
		"/Fortress": [23],
		"/contact": [8],
		"/dashboard/admin": [9,[2,3]],
		"/dashboard/admin/settings": [10,[2,3]],
		"/dashboard/admin/staff-codes": [11,[2,3]],
		"/dashboard/client": [~12,[2,4]],
		"/dashboard/client/case/[id]": [~13,[2,4]],
		"/dashboard/client/documents": [~14,[2,4]],
		"/dashboard/client/invoices": [15,[2,4]],
		"/dashboard/client/invoices/[id]/pay": [16,[2,4]],
		"/dashboard/lawyer": [~17,[2,5]],
		"/dashboard/lawyer/case/[id]": [~18,[2,5]],
		"/dashboard/lawyer/documents": [~19,[2,5]],
		"/dashboard/profile": [20,[2]],
		"/dashboard/staff": [21,[2,6]],
		"/dashboard/staff/cases/[id]": [22,[2,6]],
		"/login": [24],
		"/meet-ben-king": [25],
		"/our-team": [26],
		"/pay-bill": [27],
		"/register": [28],
		"/request-consultation": [29],
		"/samples": [30],
		"/samples/classic": [31],
		"/samples/elegant": [32],
		"/samples/modern": [33],
		"/schedule": [34],
		"/services/appeals": [35],
		"/services/cannabis-law": [36],
		"/services/civil-rights": [37],
		"/services/criminal-defense": [38],
		"/services/employment-law": [39],
		"/services/personal-injury": [40],
		"/services/property-damage": [41],
		"/services/real-estate-business": [42],
		"/staff-sign-up": [43],
		"/staff-sign-up/register": [44],
		"/test/square-payment": [45]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';