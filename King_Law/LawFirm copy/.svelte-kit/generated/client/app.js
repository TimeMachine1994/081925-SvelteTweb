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
	() => import('./nodes/18')
];

export const server_loads = [0];

export const dictionary = {
		"/": [2],
		"/about": [3],
		"/contact": [4],
		"/dashboard/client": [~5],
		"/dashboard/client/case/[id]": [~6],
		"/dashboard/lawyer": [~7],
		"/dashboard/lawyer/case/[id]": [~8],
		"/dashboard/lawyer/client/[id]": [~9],
		"/demo": [10],
		"/demo/lucia": [~11],
		"/demo/lucia/login": [~12],
		"/login": [~13],
		"/register": [~14],
		"/services/business-intellectual-property": [15],
		"/services/criminal-defense": [16],
		"/services/family-estate-law": [17],
		"/services/personal-injury": [18]
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