<script lang="ts">
	// Showcase wrapper: reuse the real admin Email Logs data grid with mock logs.
	import Real from '../../../admin/system/email-logs/+page.svelte';
	import showcaseData from '../../_lib/showcase-data.json';

	const logs = showcaseData.emailLogs;
	const data: any = {
		logs,
		stats: {
			total: logs.length,
			sent: logs.filter((l) => l.status === 'delivered' || l.status === 'opened').length,
			failed: 0,
			mocked: 0
		},
		pagination: { total: logs.length, limit: 50, page: 1, hasMore: false }
	};
</script>

<Real {data} />
