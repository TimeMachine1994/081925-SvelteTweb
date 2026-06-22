<script lang="ts">
	// Reuse the real admin funeral-directors data grid with mock directors.
	import RealDirectors from '../../../admin/users/funeral-directors/+page.svelte';
	import { funeralDirectors } from '../../_lib/mocks/funeralDirectors';

	const data: any = { directors: funeralDirectors };
</script>

<RealDirectors {data} />
