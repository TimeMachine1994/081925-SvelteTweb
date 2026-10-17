/**
 * Gallery Layout Utilities
 *
 * Pure helpers for the Image Gallery's CSS-grid masonry. We use CSS Grid
 * (not `column-count`) specifically because grid places items in document
 * order, left-to-right, then wraps — matching the order admins set in the
 * editor. `column-count` fills column-by-column top-to-bottom, which made
 * the public page's reading order diverge from the admin's saved order.
 */

export const MASONRY_GAP = 12; // px — column gap and vertical gutter between tiles
export const MASONRY_ROW_UNIT = 8; // px — grid-auto-rows unit used for span math
export const DEFAULT_ASPECT_RATIO = 0.75; // 4:3 (height / width) fallback

/**
 * Number of masonry columns for a given container width, matching the
 * renderer's responsive breakpoints (mobile / tablet / desktop).
 */
export function masonryColumnCount(containerWidth: number): number {
	if (containerWidth < 640) return 1;
	if (containerWidth < 1024) return 2;
	return 3;
}

/**
 * Width of a single column given the container width, column count, and gap.
 */
export function masonryColumnWidth(
	containerWidth: number,
	columns: number,
	gap: number = MASONRY_GAP
): number {
	if (columns <= 0) return containerWidth;
	return (containerWidth - gap * (columns - 1)) / columns;
}

/**
 * Number of `grid-auto-rows` units a tile should span so that, at the given
 * column width, its rendered height (image height + bottom gutter) lines up
 * with the row grid. `aspectRatio` is height / width.
 */
export function masonrySpan(
	columnWidth: number,
	aspectRatio: number = DEFAULT_ASPECT_RATIO,
	gap: number = MASONRY_GAP,
	rowUnit: number = MASONRY_ROW_UNIT
): number {
	if (columnWidth <= 0 || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
		return 1;
	}
	const renderedHeight = columnWidth * aspectRatio + gap;
	return Math.max(1, Math.ceil(renderedHeight / rowUnit));
}
