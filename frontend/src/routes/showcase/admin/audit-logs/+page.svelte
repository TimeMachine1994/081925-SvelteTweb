<script lang="ts">
	// Reuse the real admin audit-logs data grid with mock log entries
	// sourced from the consolidated showcase-data.json.
	import RealAuditLogs from '../../../admin/system/audit-logs/+page.svelte';
	import { auditLogs } from '../../_lib/mocks/auditLogs';

	const data: any = { logs: auditLogs };
</script>

<RealAuditLogs {data} />
