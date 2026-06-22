/**
 * Mock users for the admin "Manage Users" screen.
 * Re-exported from the consolidated `showcase-data.json` (single source of truth).
 * Shape mirrors routes/admin/+page.server.ts `allUsers`.
 */
import data from '../showcase-data.json';

export const adminUsers = data.users;
