/**
 * Mock memorials
 *
 * Re-exported from the consolidated `showcase-data.json` (single source of
 * truth). Shapes mirror the real loaders:
 * - `heroMemorial` matches routes/[fullSlug]/+page.server.ts serialized output.
 * - `adminMemorials` matches routes/admin/+page.server.ts `recentMemorials`.
 */
import data from '../showcase-data.json';

/** Public memorial page data (data.memorial). */
export const heroMemorial = data.memorials.hero;

/** Owner's memorials list (profile page `data.memorials`). */
export const ownerMemorials = data.memorials.owner;

/** Admin dashboard `recentMemorials` shape. */
export const adminMemorials = data.memorials.adminList;

/** Incomplete subset (admin dashboard priority list). */
export const incompleteMemorials = adminMemorials.filter((m) => !m.isComplete && !m.isArchived);

/** Single memorial detail for the admin memorial-detail screen. */
export const adminMemorialDetail = heroMemorial;
