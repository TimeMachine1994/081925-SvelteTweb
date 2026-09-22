/**
 * CrazyEgg Survey Suppression
 *
 * CrazyEgg (account 0130 / script 3684, loaded in the root layout) is kept
 * on the site for heatmaps and recordings, but its remotely-configured
 * "Surveys" add-on pops up an on-page feedback prompt ("How can we improve
 * this page?") that gets in the way of visitors. We don't currently have
 * dashboard access to disable the survey at the source, so this is a
 * best-effort client-side stopgap that detects and hides it wherever/
 * whenever CrazyEgg injects it.
 *
 * See AGENTS.md for the authoritative fix once CrazyEgg dashboard access
 * is recovered (Add-ons -> Surveys -> disable).
 *
 * @module suppressCrazyEggSurvey
 */

import { browser } from '$app/environment';

const SURVEY_TEXT_PATTERN = /how can we improve|improve this page|improve our (site|page)/i;
const HIDDEN_ATTR = 'data-ce-survey-hidden';

function isOverlayPositioned(el: Element): boolean {
	const style = window.getComputedStyle(el);
	return (
		(style.position === 'fixed' || style.position === 'sticky') && Number(style.zIndex || '0') > 0
	);
}

function hideElement(el: Element): void {
	if (el.hasAttribute(HIDDEN_ATTR)) return;
	el.setAttribute(HIDDEN_ATTR, 'true');
	(el as HTMLElement).style.setProperty('display', 'none', 'important');
}

/**
 * Walk up from a node to find the nearest ancestor that looks like an
 * overlay container (fixed/sticky + positive z-index), so we hide the
 * whole widget rather than just an inner element.
 */
function findOverlayAncestor(el: Element): Element {
	let current: Element | null = el;
	let candidate = el;
	while (current && current !== document.body) {
		if (isOverlayPositioned(current)) {
			candidate = current;
		}
		current = current.parentElement;
	}
	return candidate;
}

function checkNode(node: Node): void {
	if (!(node instanceof Element)) return;

	// Origin-based: iframes served from crazyegg.com are almost always the
	// survey/CTA widget (heatmap tracking itself doesn't use an iframe).
	const iframes = node.matches('iframe') ? [node] : Array.from(node.querySelectorAll('iframe'));
	for (const iframe of iframes) {
		const src = iframe.getAttribute('src') || '';
		if (src.includes('crazyegg.com')) {
			hideElement(findOverlayAncestor(iframe));
		}
	}

	// Text-based fallback: an overlay-positioned element whose visible text
	// matches the survey prompt wording.
	const text = node.textContent || '';
	if (SURVEY_TEXT_PATTERN.test(text) && isOverlayPositioned(node)) {
		hideElement(node);
	}
}

/**
 * Start watching the DOM for CrazyEgg's survey widget and hide it as soon
 * as it appears. Safe to call multiple times; only sets up one observer.
 */
export function initCrazyEggSurveyBlocker(): void {
	if (!browser) return;

	// Check anything already on the page (e.g. a survey iframe injected
	// before this ran). Scoped to iframes only here to keep the initial
	// pass cheap; the MutationObserver below handles new insertions,
	// including the text-based fallback, as CrazyEgg surveys typically
	// appear on a delay well after initial page load.
	document.querySelectorAll('iframe').forEach(checkNode);

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			mutation.addedNodes.forEach(checkNode);
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
}
