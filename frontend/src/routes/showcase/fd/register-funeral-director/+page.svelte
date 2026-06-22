<script lang="ts">
	// Showcase wrapper: reuse the real Funeral Director registration page.
	import Real from '../../../register/funeral-director/+page.svelte';

	const data: any = {
		prepopulatedData: {
			directorName: 'Pat Donnelly',
			directorEmail: 'pat@evergreenfh.com',
			funeralHomeName: 'Evergreen Funeral Home'
		}
	};
</script>

<Real {data} />
