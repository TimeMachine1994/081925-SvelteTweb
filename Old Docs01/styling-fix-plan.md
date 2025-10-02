# Styling Consolidation Plan

The following files contain custom CSS that needs to be removed in favor of the global `tribute-theme.css`.

## Files with `<style>` blocks to be removed:

*   **`frontend/src/lib/components/Login.svelte`**: The entire `<style>` block should be removed.
*   **`frontend/src/routes/my-portal/tributes/new/+page.svelte`**: The `<style>` block needs to be removed.
*   **`frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.svelte`**: The large `<style>` block in this file must be removed.
*   **`frontend/src/routes/my-portal/tributes/[memorialId]/livestream/new/+page.svelte`**: The `<style>` block should be removed.
*   **`frontend/src/lib/components/portals/AdminPortal.svelte`**: The `<style>` block needs to be removed.

## Files with Tailwind CSS classes to be replaced:

The following files use Tailwind CSS classes for styling. These classes should be replaced with appropriate classes or styles from `tribute-theme.css`.

*   `frontend/src/routes/register/+page.svelte`
*   `frontend/src/routes/register/funeral-director/+page.svelte`
*   `frontend/src/routes/register/loved-one/+page.svelte`
*   `frontend/src/routes/my-portal/+page.svelte`
*   `frontend/src/lib/components/portals/AdminPortal.svelte`
*   `frontend/src/lib/components/portals/FamilyMemberPortal.svelte`
*   `frontend/src/lib/components/portals/FuneralDirectorPortal.svelte`
*   `frontend/src/lib/components/portals/OnsiteVideographerPortal.svelte`
*   `frontend/src/lib/components/portals/OwnerPortal.svelte`

## Next Steps

The next step is to go through each of these files and tag the specific CSS for removal.