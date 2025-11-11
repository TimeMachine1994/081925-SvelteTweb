<!-- Simplified Admin Portal - Funeral Director Approval & Memorial Management -->
<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/minimal-modern';

	// Props from parent component
	let {
		memorials,
		allUsers,
		pendingFuneralDirectors = [],
		approvedFuneralDirectors = []
	}: {
		memorials: Memorial[];
		allUsers: { uid: string; email: string; displayName: string; role?: string }[];
		pendingFuneralDirectors?: any[];
		approvedFuneralDirectors?: any[];
	} = $props();

	// Active tab state
	let activeTab = $state<
		'overview' | 'funeral-directors' | 'memorials' | 'memorial-owners' | 'create-memorial' | 'audit-logs' | 'schedule-requests'
	>('overview');

	// Memorial creation form state
	let newMemorialForm = $state({
		lovedOneName: '',
		creatorEmail: '',
		creatorName: '',
		isPublic: true,
		content: '',
		serviceDate: '',
		serviceTime: '',
		location: ''
	});

	// Loading states
	let isApproving = $state(false);
	let isCreatingMemorial = $state(false);
	let isTogglingStatus = $state(false);

	// Memorial selection state
	let selectedMemorials = $state<Set<string>>(new Set());
	let selectAll = $state(false);

	// Audit logs state
	let auditLogs = $state<any[]>([]);
	let auditLoading = $state(false);
	let auditFilters = $state({
		action: '',
		userEmail: '',
		resourceType: '',
		dateFrom: '',
		dateTo: '',
		limit: 50
	});

	// Funeral director editing state
	let editingDirector = $state<any>(null);
	let directorEditForm = $state({
		companyName: '',
		contactPerson: '',
		email: '',
		phone: '',
		licenseNumber: '',
		businessType: ''
	});
	let isUpdatingDirector = $state(false);
	let isDeletingDirector = $state(false);

	// Payment status management
	let paymentModal = $state<any>(null);
	let paymentForm = $state({
		method: 'cash',
		notes: ''
	});
	let isTogglingPayment = $state(false);

	// Schedule edit requests state
	let editRequests = $state<any[]>([]);
	let editRequestsLoading = $state(false);
	let selectedEditRequest = $state<any>(null);
	let editRequestStatusFilter = $state<string>('');
	let isUpdatingRequest = $state(false);

	/**
	 * Approve a funeral director - updates their status and permissions
	 * @param directorId - The funeral director's user ID
	 */
	async function approveFuneralDirector(directorId: string) {
		console.log('🏥 [ADMIN] Starting funeral director approval process for:', directorId);
		isApproving = true;

		try {
			const response = await fetch('/api/admin/approve-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			const result = await response.json();
			console.log('🏥 [ADMIN] Approval response:', result);

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director approved successfully');
				await invalidateAll(); // Refresh data
				alert('Funeral director approved successfully!');
			} else {
				console.error('❌ [ADMIN] Failed to approve funeral director:', result.error);
				alert(`Failed to approve: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error approving funeral director:', error);
			alert('Network error occurred while approving');
		} finally {
			isApproving = false;
		}
	}

	/**
	 * Toggle memorial completion status for selected memorials
	 */
	async function toggleMemorialStatus(isComplete: boolean) {
		if (selectedMemorials.size === 0) {
			alert('Please select memorials to update');
			return;
		}

		const memorialIds = Array.from(selectedMemorials);
		const statusText = isComplete ? 'completed' : 'scheduled';
		
		if (!confirm(`Mark ${memorialIds.length} memorial(s) as ${statusText}?`)) {
			return;
		}

		isTogglingStatus = true;

		try {
			const response = await fetch('/api/admin/toggle-memorial-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialIds, isComplete })
			});

			const result = await response.json();

			if (response.ok) {
				console.log(`✅ [ADMIN] Successfully marked ${result.updatedCount} memorials as ${statusText}`);
				await invalidateAll(); // Refresh data
				selectedMemorials.clear();
				selectAll = false;
				alert(`Successfully marked ${result.updatedCount} memorial(s) as ${statusText}!`);
			} else {
				console.error(`❌ [ADMIN] Failed to toggle memorial status:`, result.error);
				alert(`Failed to update memorials: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error toggling memorial status:', error);
			alert('Network error occurred while updating memorials');
		} finally {
			isTogglingStatus = false;
		}
	}

	/**
	 * Handle select all checkbox
	 */
	function handleSelectAll() {
		if (selectAll) {
			// Select all visible memorials
			const visibleMemorials = activeTab === 'overview' 
				? memorials.filter(m => !m.isComplete) 
				: memorials;
			selectedMemorials = new Set(visibleMemorials.map(m => m.id).filter(id => id !== undefined) as string[]);
		} else {
			selectedMemorials.clear();
		}
	}

	/**
	 * Handle individual memorial selection
	 */
	function handleMemorialSelect(memorialId: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const checked = target.checked;
		
		if (checked) {
			selectedMemorials.add(memorialId);
		} else {
			selectedMemorials.delete(memorialId);
			selectAll = false;
		}
		selectedMemorials = selectedMemorials; // Trigger reactivity
	}

	// Computed values
	const scheduledMemorials = $derived(memorials.filter(m => !m.isComplete));
	const completedMemorials = $derived(memorials.filter(m => m.isComplete));

	/**
	 * Reject a funeral director application
	 * @param directorId - The funeral director's user ID
	 */
	async function rejectFuneralDirector(directorId: string) {
		if (!confirm('Are you sure you want to reject this funeral director application?')) {
			return;
		}

		console.log('🚫 [ADMIN] Rejecting funeral director:', directorId);

		try {
			const response = await fetch('/api/admin/reject-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director rejected');
				await invalidateAll();
				alert('Funeral director application rejected');
			} else {
				const result = await response.json();
				alert(`Failed to reject: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error rejecting funeral director:', error);
			alert('Network error occurred');
		}
	}

	/**
	 * Create a new memorial as admin
	 */
	async function createMemorial(event: Event) {
		event.preventDefault();
		console.log('📝 [ADMIN] Creating new memorial:', newMemorialForm);

		// Validate required fields
		if (!newMemorialForm.lovedOneName || !newMemorialForm.creatorEmail) {
			alert('Please fill in the loved one name and creator email');
			return;
		}

		isCreatingMemorial = true;

		try {
			const response = await fetch('/api/admin/create-memorial', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMemorialForm)
			});

			const result = await response.json();
			console.log('📝 [ADMIN] Memorial creation response:', result);

			if (response.ok) {
				console.log('✅ [ADMIN] Memorial created successfully:', result.memorialId);
				// Reset form
				newMemorialForm = {
					lovedOneName: '',
					creatorEmail: '',
					creatorName: '',
					isPublic: true,
					content: '',
					serviceDate: '',
					serviceTime: '',
					location: ''
				};
				await invalidateAll();
				alert(`Memorial created successfully! ID: ${result.memorialId}`);
				activeTab = 'memorials'; // Switch to memorials tab
			} else {
				console.error('❌ [ADMIN] Failed to create memorial:', result.error);
				alert(`Failed to create memorial: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error creating memorial:', error);
			alert('Network error occurred while creating memorial');
		} finally {
			isCreatingMemorial = false;
		}
	}

	/**
	 * Load audit logs with current filters
	 */
	async function loadAuditLogs() {
		console.log('🔍 [ADMIN] Loading audit logs...');
		auditLoading = true;

		try {
			const params = new URLSearchParams();
			if (auditFilters.action) params.set('action', auditFilters.action);
			if (auditFilters.userEmail) params.set('userEmail', auditFilters.userEmail);
			if (auditFilters.resourceType) params.set('resourceType', auditFilters.resourceType);
			if (auditFilters.dateFrom) params.set('dateFrom', auditFilters.dateFrom);
			if (auditFilters.dateTo) params.set('dateTo', auditFilters.dateTo);
			params.set('limit', auditFilters.limit.toString());

			const response = await fetch(`/api/admin/audit-logs?${params}`);
			const result = await response.json();

			if (response.ok) {
				auditLogs = result.logs || [];
				console.log('✅ [ADMIN] Loaded audit logs:', auditLogs.length);
			} else {
				console.error('❌ [ADMIN] Failed to load audit logs:', result.error);
				alert(`Failed to load audit logs: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error loading audit logs:', error);
			alert('Network error occurred while loading audit logs');
		} finally {
			auditLoading = false;
		}
	}

	/**
	 * Format timestamp for display
	 */
	function formatTimestamp(timestamp: any): string {
		if (!timestamp) return 'Unknown';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toLocaleString();
	}

	/**
	 * Get action emoji for display
	 */
	function getActionEmoji(action: string): string {
		const emojiMap: Record<string, string> = {
			memorial_created: '🆕',
			memorial_updated: '✏️',
			memorial_deleted: '🗑️',
			memorial_viewed: '👁️',
			user_login: '🔐',
			user_logout: '🚪',
			user_created: '👤',
			role_changed: '🔄',
			schedule_updated: '📅',
			schedule_locked: '🔒',
			payment_completed: '💳',
			payment_failed: '❌',
			funeral_director_approved: '✅',
			funeral_director_rejected: '❌',
			admin_memorial_created: '👑',
			system_config_changed: '⚙️',
			api_access_denied: '🚫'
		};
		return emojiMap[action] || '📝';
	}

	/**
	 * Delete a memorial
	 */
	async function deleteMemorial(memorialId: string, memorialName: string) {
		if (!confirm(`Are you sure you want to delete the memorial for "${memorialName}"? This action cannot be undone.`)) {
			return;
		}

		console.log('🗑️ [ADMIN] Deleting memorial:', memorialId);

		try {
			const response = await fetch(`/api/admin/delete-memorial`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] Memorial deleted successfully');
				await invalidateAll();
				alert('Memorial deleted successfully');
			} else {
				console.error('❌ [ADMIN] Failed to delete memorial:', result.error);
				alert(`Failed to delete memorial: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error deleting memorial:', error);
			alert('Network error occurred while deleting memorial');
		}
	}

	/**
	 * Delete all selected memorials
	 */
	let isDeletingMemorials = $state(false);
	async function deleteSelectedMemorials() {
		if (selectedMemorials.size === 0) {
			alert('Please select memorials to delete');
			return;
		}

		const count = selectedMemorials.size;
		if (!confirm(`⚠️ Are you sure you want to DELETE ${count} memorial${count > 1 ? 's' : ''}?\n\nThis action CANNOT be undone!`)) {
			return;
		}

		isDeletingMemorials = true;
		console.log('🗑️ [ADMIN] Bulk deleting memorials:', Array.from(selectedMemorials));

		let successCount = 0;
		let errorCount = 0;

		try {
			for (const memorialId of selectedMemorials) {
				try {
					const response = await fetch(`/api/admin/delete-memorial`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ memorialId })
					});

					if (response.ok) {
						successCount++;
					} else {
						errorCount++;
						console.error('Failed to delete memorial:', memorialId);
					}
				} catch (err) {
					errorCount++;
					console.error('Error deleting memorial:', memorialId, err);
				}
			}

			console.log(`✅ [ADMIN] Bulk delete complete: ${successCount} succeeded, ${errorCount} failed`);
			
			if (errorCount > 0) {
				alert(`Deleted ${successCount} memorial${successCount !== 1 ? 's' : ''}.\n${errorCount} failed.`);
			} else {
				alert(`Successfully deleted ${successCount} memorial${successCount !== 1 ? 's' : ''}!`);
			}

			// Clear selection and refresh
			selectedMemorials.clear();
			selectAll = false;
			await invalidateAll();
		} catch (error) {
			console.error('❌ [ADMIN] Error in bulk delete:', error);
			alert('An error occurred during bulk deletion');
		} finally {
			isDeletingMemorials = false;
		}
	}

	/**
	 * Delete a user
	 */
	async function deleteUser(userId: string, userEmail: string) {
		if (!confirm(`Are you sure you want to delete the user "${userEmail}"? This action cannot be undone.`)) {
			return;
		}

		console.log('🗑️ [ADMIN] Deleting user:', userId);

		try {
			const response = await fetch(`/api/admin/delete-user`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] User deleted successfully');
				await invalidateAll();
				alert('User deleted successfully');
			} else {
				console.error('❌ [ADMIN] Failed to delete user:', result.error);
				alert(`Failed to delete user: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error deleting user:', error);
			alert('Network error occurred while deleting user');
		}
	}

	/**
	 * Start editing a funeral director
	 */
	function startEditingDirector(director: any) {
		console.log('✏️ [ADMIN] Starting to edit director:', director.id);
		editingDirector = director;
		directorEditForm = {
			companyName: director.companyName || '',
			contactPerson: director.contactPerson || '',
			email: director.email || '',
			phone: director.phone || '',
			licenseNumber: director.licenseNumber || '',
			businessType: director.businessType || ''
		};
	}

	/**
	 * Cancel editing funeral director
	 */
	function cancelEditingDirector() {
		editingDirector = null;
		directorEditForm = {
			companyName: '',
			contactPerson: '',
			email: '',
			phone: '',
			licenseNumber: '',
			businessType: ''
		};
	}

	/**
	 * Update funeral director information
	 */
	async function updateFuneralDirector() {
		if (!editingDirector) return;

		console.log('✏️ [ADMIN] Updating funeral director:', editingDirector.id);
		isUpdatingDirector = true;

		try {
			const response = await fetch('/api/admin/update-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					directorId: editingDirector.id,
					updates: directorEditForm
				})
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director updated successfully');
				await invalidateAll();
				alert('Funeral director updated successfully!');
				cancelEditingDirector();
			} else {
				console.error('❌ [ADMIN] Failed to update funeral director:', result.error);
				alert(`Failed to update: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error updating funeral director:', error);
			alert('Network error occurred while updating');
		} finally {
			isUpdatingDirector = false;
		}
	}

	/**
	 * Delete a funeral director
	 */
	async function deleteFuneralDirector(directorId: string, companyName: string) {
		if (!confirm(`⚠️ Are you sure you want to delete "${companyName}"?\n\nThis will:\n- Remove the funeral director profile\n- Downgrade their account to regular owner\n\nThis action cannot be undone!`)) {
			return;
		}

		console.log('🗑️ [ADMIN] Deleting funeral director:', directorId);
		isDeletingDirector = true;

		try {
			const response = await fetch('/api/admin/delete-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director deleted successfully');
				await invalidateAll();
				alert('Funeral director deleted successfully');
			} else {
				console.error('❌ [ADMIN] Failed to delete funeral director:', result.error);
				alert(`Failed to delete: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error deleting funeral director:', error);
			alert('Network error occurred while deleting');
		} finally {
			isDeletingDirector = false;
		}
	}

	/**
	 * Open payment modal for marking memorial as paid
	 */
	function openPaymentModal(memorial: any) {
		console.log('💳 [ADMIN] Opening payment modal for:', memorial.id);
		paymentModal = memorial;
		paymentForm = {
			method: 'cash',
			notes: ''
		};
	}

	/**
	 * Close payment modal
	 */
	function closePaymentModal() {
		paymentModal = null;
		paymentForm = {
			method: 'cash',
			notes: ''
		};
	}

	/**
	 * Toggle payment status for a memorial
	 */
	async function togglePaymentStatus(memorialId: string, isPaid: boolean) {
		console.log('💳 [ADMIN] Toggling payment status for:', memorialId, 'to:', isPaid);
		isTogglingPayment = true;

		try {
			const response = await fetch('/api/admin/toggle-payment-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					memorialId,
					isPaid,
					paymentMethod: paymentForm.method,
					paymentNotes: paymentForm.notes
				})
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] Payment status updated successfully');
				await invalidateAll();
				alert(`Memorial marked as ${isPaid ? 'PAID' : 'UNPAID'}!`);
				closePaymentModal();
			} else {
				console.error('❌ [ADMIN] Failed to update payment status:', result.error);
				alert(`Failed to update payment: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error toggling payment status:', error);
			alert('Network error occurred while updating payment');
		} finally {
			isTogglingPayment = false;
		}
	}

	/**
	 * Quick toggle payment without modal (for unpaid -> paid with default values)
	 */
	async function quickMarkPaid(memorial: any) {
		if (!confirm(`Mark "${memorial.lovedOneName}" as PAID?`)) {
			return;
		}

		isTogglingPayment = true;
		try {
			const response = await fetch('/api/admin/toggle-payment-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					memorialId: memorial.id,
					isPaid: true,
					paymentMethod: 'manual',
					paymentNotes: 'Marked as paid via admin portal'
				})
			});

			const result = await response.json();

			if (response.ok) {
				await invalidateAll();
				alert('Memorial marked as PAID!');
			} else {
				alert(`Failed: ${result.error}`);
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Network error occurred');
		} finally {
			isTogglingPayment = false;
		}
	}

	/**
	 * Quick toggle to unpaid
	 */
	async function quickMarkUnpaid(memorial: any) {
		if (!confirm(`Mark "${memorial.lovedOneName}" as UNPAID?`)) {
			return;
		}

		isTogglingPayment = true;
		try {
			const response = await fetch('/api/admin/toggle-payment-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					memorialId: memorial.id,
					isPaid: false
				})
			});

			const result = await response.json();

			if (response.ok) {
				await invalidateAll();
				alert('Memorial marked as UNPAID!');
			} else {
				alert(`Failed: ${result.error}`);
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Network error occurred');
		} finally {
			isTogglingPayment = false;
		}
	}

	/**
	 * Load schedule edit requests
	 */
	async function loadEditRequests() {
		editRequestsLoading = true;

		try {
			const params = new URLSearchParams();
			if (editRequestStatusFilter) {
				params.append('status', editRequestStatusFilter);
			}

			const response = await fetch(`/api/admin/schedule-edit-requests?${params.toString()}`);
			const result = await response.json();

			if (response.ok) {
				editRequests = result.requests || [];
				console.log(`✅ [ADMIN] Loaded ${editRequests.length} edit requests`);
			} else {
				console.error('❌ [ADMIN] Failed to load edit requests:', result.error);
				alert(`Failed to load edit requests: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error loading edit requests:', error);
			alert('Network error occurred while loading edit requests');
		} finally {
			editRequestsLoading = false;
		}
	}

	/**
	 * Update edit request status
	 */
	async function updateEditRequestStatus(requestId: string, status: string, adminNotes: string) {
		isUpdatingRequest = true;

		try {
			const response = await fetch(`/api/admin/schedule-edit-requests/${requestId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, adminNotes })
			});

			const result = await response.json();

			if (response.ok) {
				console.log(`✅ [ADMIN] Edit request ${requestId} updated to ${status}`);
				selectedEditRequest = null;
				await loadEditRequests();
				alert(`Request ${status} successfully!`);
			} else {
				console.error('❌ [ADMIN] Failed to update edit request:', result.error);
				alert(`Failed to update request: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error updating edit request:', error);
			alert('Network error occurred while updating request');
		} finally {
			isUpdatingRequest = false;
		}
	}

	/**
	 * Get status badge color
	 */
	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'denied':
				return 'bg-red-100 text-red-800';
			case 'completed':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	/**
	 * Format date for display
	 */
	function formatRequestDate(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Load edit requests when tab is activated
	$effect(() => {
		if (activeTab === 'schedule-requests' && editRequests.length === 0) {
			loadEditRequests();
		}
	});
</script>

<!-- Simplified Admin Dashboard with Tabs -->
<div class="rounded-xl md:rounded-2xl border border-white/20 bg-white/10 p-4 md:p-6 shadow-2xl backdrop-blur-md">
	<!-- Tab Navigation - Responsive: Dropdown on mobile, buttons on desktop -->
	<div class="mb-6 border-b border-white/20 pb-4">
		<!-- Mobile Dropdown -->
		<div class="md:hidden">
			<select
				bind:value={activeTab}
				onchange={() => {
					if (activeTab === 'audit-logs') loadAuditLogs();
					if (activeTab === 'schedule-requests') loadEditRequests();
				}}
				class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white text-base font-medium focus:border-amber-400 focus:outline-none"
			>
				<option value="overview">📊 Overview</option>
				<option value="funeral-directors">🏥 Funeral Directors</option>
				<option value="memorials">💝 Memorials</option>
				<option value="memorial-owners">👥 Memorial Owners</option>
				<option value="schedule-requests">📝 Schedule Requests</option>
				<option value="create-memorial">➕ Create Memorial</option>
				<option value="audit-logs">🔍 Audit Logs</option>
			</select>
		</div>
		
		<!-- Desktop Tabs -->
		<div class="hidden md:flex flex-wrap gap-2">
			<button
				onclick={() => (activeTab = 'overview')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'overview' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				📊 Overview
			</button>
			<button
				onclick={() => (activeTab = 'funeral-directors')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'funeral-directors' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				🏥 Funeral Directors
			</button>
			<button
				onclick={() => (activeTab = 'memorials')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'memorials' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				💝 Memorials
			</button>
			<button
				onclick={() => (activeTab = 'memorial-owners')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'memorial-owners' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				👥 Memorial Owners
			</button>
			<button
				onclick={() => {
					activeTab = 'schedule-requests';
					loadEditRequests();
				}}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'schedule-requests' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				📝 Schedule Requests
				{#if editRequests.filter(r => r.status === 'pending').length > 0}
					<span class="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
						{editRequests.filter(r => r.status === 'pending').length}
					</span>
				{/if}
			</button>
			<button
				onclick={() => (activeTab = 'create-memorial')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'create-memorial' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				➕ Create Memorial
			</button>
			<button
				onclick={() => {
					activeTab = 'audit-logs';
					loadAuditLogs();
				}}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] {activeTab === 'audit-logs' 
					? 'bg-white text-gray-900 shadow-lg' 
					: 'bg-white/10 text-white hover:bg-white/20'}"
			>
				🔍 Audit Logs
			</button>
		</div>
	</div>

	<!-- Overview Tab -->
	{#if activeTab === 'overview'}
		<div class="space-y-4 md:space-y-6">
			<h2 class="text-xl md:text-2xl font-bold text-white">System Overview</h2>

			<div class="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
				<div class="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="text-xs md:text-sm text-white/70 mb-1">Scheduled</div>
					<div class="text-xl md:text-2xl font-bold text-amber-400">{scheduledMemorials.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="text-xs md:text-sm text-white/70 mb-1">Completed</div>
					<div class="text-xl md:text-2xl font-bold text-green-400">{completedMemorials.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="text-xs md:text-sm text-white/70 mb-1">Pending</div>
					<div class="text-xl md:text-2xl font-bold text-amber-400">{pendingFuneralDirectors.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="text-xs md:text-sm text-white/70 mb-1">Total Users</div>
					<div class="text-xl md:text-2xl font-bold text-white">{allUsers.length}</div>
				</div>
			</div>

			<!-- Scheduled Memorials Section -->
			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-white">📅 Scheduled Memorials ({scheduledMemorials.length})</h3>
					{#if scheduledMemorials.length > 0}
						<div class="flex items-center gap-3">
							<label class="flex items-center gap-2 text-sm text-white/70">
								<input
									type="checkbox"
									bind:checked={selectAll}
									onchange={handleSelectAll}
									class="rounded border-white/20 bg-white/10 text-blue-500"
								/>
								Select All
							</label>
							{#if selectedMemorials.size > 0}
								<div class="flex flex-col sm:flex-row gap-2">
									<Button
										onclick={() => toggleMemorialStatus(true)}
										disabled={isTogglingStatus || isDeletingMemorials}
										variant="primary"
										rounded="lg"
										class="min-h-[44px]"
									>
										{isTogglingStatus ? 'Updating...' : `✅ Mark Complete (${selectedMemorials.size})`}
									</Button>
									<Button
										onclick={deleteSelectedMemorials}
										disabled={isTogglingStatus || isDeletingMemorials}
										variant="secondary"
										rounded="lg"
										class="min-h-[44px] bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30"
									>
										{isDeletingMemorials ? 'Deleting...' : `🗑️ Delete All (${selectedMemorials.size})`}
									</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				{#if scheduledMemorials.length > 0}
					<!-- Desktop Table -->
					<div class="hidden md:block overflow-hidden rounded-lg border border-white/10">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-white/10">
									<tr>
										<th class="px-3 py-2 text-left font-semibold text-white w-12">Select</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Loved One</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Scheduled Time</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Location</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Payment</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Creator</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each scheduledMemorials as memorial}
										<tr class="border-b border-white/10 hover:bg-white/5">
											<td class="px-3 py-2">
												<input
													type="checkbox"
													checked={selectedMemorials.has(memorial.id || '')}
													onchange={(e) => handleMemorialSelect(memorial.id || '', e)}
													class="rounded border-white/20 bg-white/10 text-blue-500 w-4 h-4"
												/>
											</td>
											<td class="px-3 py-2 text-white font-medium">{memorial.lovedOneName}</td>
											<td class="px-3 py-2 text-sm text-white/70">
												{#if memorial.scheduledStartTime}
													{new Date(memorial.scheduledStartTime).toLocaleString('en-US', {
														month: 'short',
														day: 'numeric',
														year: 'numeric',
														hour: 'numeric',
														minute: '2-digit'
													})}
												{:else}
													<span class="text-white/50">Not scheduled</span>
												{/if}
											</td>
											<td class="px-3 py-2 text-sm text-white/70">
												{memorial.location}
											</td>
											<td class="px-3 py-2">
												<div class="flex items-center gap-2">
													{#if memorial.isPaid}
														<button
															onclick={() => quickMarkUnpaid(memorial)}
															disabled={isTogglingPayment}
															class="rounded bg-green-500 px-2 py-1 text-xs text-white w-fit hover:bg-green-600 transition-colors"
															title="Click to mark as unpaid"
														>
															✅ Paid
														</button>
													{:else}
														<button
															onclick={() => openPaymentModal(memorial)}
															disabled={isTogglingPayment}
															class="rounded bg-amber-500 px-2 py-1 text-xs text-white w-fit hover:bg-amber-600 transition-colors"
															title="Click to mark as paid"
														>
															⏳ Unpaid
														</button>
													{/if}
												</div>
											</td>
											<td class="px-3 py-2 text-sm text-white/70">{memorial.creatorEmail}</td>
											<td class="px-3 py-2">
												<div class="flex gap-2 flex-wrap">
													<a
														href="/{memorial.fullSlug}"
														class="text-sm text-blue-400 hover:text-blue-300">View</a
													>
													<a
														href="/memorials/{memorial.id}/streams"
														class="text-sm text-green-400 hover:text-green-300">Streams</a
													>
													<a
														href="/schedule/{memorial.id}"
														class="text-sm text-purple-400 hover:text-purple-300">Schedule</a
													>
													<button
														onclick={() => toggleMemorialStatus(true)}
														class="text-sm text-amber-400 hover:text-amber-300"
													>
														Complete
													</button>
													<button
														onclick={() => deleteMemorial(memorial.id || '', memorial.lovedOneName)}
														class="text-sm text-red-400 hover:text-red-300"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Mobile Cards -->
					<div class="md:hidden space-y-3">
						{#each scheduledMemorials as memorial}
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<div class="flex items-start gap-3 mb-3">
									<input
										type="checkbox"
										checked={selectedMemorials.has(memorial.id || '')}
										onchange={(e) => handleMemorialSelect(memorial.id || '', e)}
										class="mt-1 rounded border-white/20 bg-white/10 text-blue-500 w-5 h-5 min-w-[20px]"
									/>
									<div class="flex-1 min-w-0">
										<h3 class="text-white font-medium text-base mb-1 break-words">{memorial.lovedOneName}</h3>
										
										{#if memorial.scheduledStartTime}
											<p class="text-sm text-white/70 mb-1">
												📅 {new Date(memorial.scheduledStartTime).toLocaleString('en-US', {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
													hour: 'numeric',
													minute: '2-digit'
												})}
											</p>
										{/if}
										
										<p class="text-sm text-white/70 mb-1">
											📍 {memorial.location}
										</p>
										
										<div class="mb-2">
											{#if memorial.isPaid}
												<button
													onclick={() => quickMarkUnpaid(memorial)}
													disabled={isTogglingPayment}
													class="inline-block rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600 transition-colors"
													title="Click to mark as unpaid"
												>
													✅ Paid
												</button>
											{:else}
												<button
													onclick={() => openPaymentModal(memorial)}
													disabled={isTogglingPayment}
													class="inline-block rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600 transition-colors"
													title="Click to mark as paid"
												>
													⏳ Unpaid
												</button>
											{/if}
										</div>
										
										<p class="text-sm text-white/70 mb-1 break-all">{memorial.creatorEmail}</p>
									</div>
								</div>
								<div class="flex flex-wrap gap-2">
									<a
										href="/{memorial.fullSlug}"
										class="flex-1 min-w-[calc(50%-0.25rem)] text-center px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-medium min-h-[44px] flex items-center justify-center"
									>
										View
									</a>
									<a
										href="/memorials/{memorial.id}/streams"
										class="flex-1 min-w-[calc(50%-0.25rem)] text-center px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium min-h-[44px] flex items-center justify-center"
									>
										Streams
									</a>
									<a
										href="/schedule/{memorial.id}"
										class="w-full px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm font-medium min-h-[44px] flex items-center justify-center"
									>
										📅 Edit Schedule
									</a>
									<button
										onclick={() => toggleMemorialStatus(true)}
										class="w-full px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-medium min-h-[44px]"
									>
										✅ Mark Complete
									</button>
									<button
										onclick={() => deleteMemorial(memorial.id || '', memorial.lovedOneName)}
										class="w-full px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium min-h-[44px]"
									>
										🗑️ Delete Memorial
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-white/70">
						<p>No scheduled memorials found</p>
						<p class="text-sm mt-2">All memorials have been completed</p>
					</div>
				{/if}
			</div>

			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<h3 class="mb-3 text-base md:text-lg font-semibold text-white">Quick Actions</h3>
				<div class="flex flex-col sm:flex-row gap-3">
					<Button
						onclick={() => (activeTab = 'funeral-directors')}
						variant="role"
						role="admin"
						size="md"
						rounded="lg"
						class="w-full sm:w-auto min-h-[44px]"
					>
						Review Pending Directors ({pendingFuneralDirectors.length})
					</Button>
					<Button
						onclick={() => (activeTab = 'create-memorial')}
						variant="secondary"
						size="md"
						rounded="lg"
						class="w-full sm:w-auto min-h-[44px]"
					>
						Create New Memorial
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Funeral Directors Tab -->
	{#if activeTab === 'funeral-directors'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Funeral Director Management</h2>

			<!-- Pending Approvals -->
			{#if pendingFuneralDirectors.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-4 text-lg font-semibold text-amber-400">
						⏳ Pending Approvals ({pendingFuneralDirectors.length})
					</h3>
					<div class="space-y-3">
						{#each pendingFuneralDirectors as director}
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-semibold text-white">{director.companyName}</h4>
										<p class="text-sm text-white/70">Contact: {director.contactPerson}</p>
										<p class="text-sm text-white/70">Email: {director.email}</p>
										<p class="text-sm text-white/70">License: {director.licenseNumber}</p>
										<p class="text-sm text-white/70">Business Type: {director.businessType}</p>
									</div>
									<div class="flex gap-2">
										<Button
											onclick={() => approveFuneralDirector(director.id)}
											disabled={isApproving}
											loading={isApproving}
											variant="primary"
											size="sm"
											rounded="lg"
										>
											{isApproving ? 'Approving...' : '✅ Approve'}
										</Button>
										<Button
											onclick={() => rejectFuneralDirector(director.id)}
											variant="danger"
											size="sm"
											rounded="lg"
										>
											❌ Reject
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
					<p class="text-white/70">No pending funeral director applications</p>
				</div>
			{/if}

			<!-- Approved Directors -->
			{#if approvedFuneralDirectors.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-4 text-lg font-semibold text-green-400">
						✅ Approved Directors ({approvedFuneralDirectors.length})
					</h3>
					<div class="space-y-3">
						{#each approvedFuneralDirectors as director}
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<h4 class="font-semibold text-white mb-1">{director.companyName}</h4>
										<p class="text-sm text-white/70">Contact: {director.contactPerson}</p>
										<p class="text-sm text-white/70">Email: {director.email}</p>
										<p class="text-sm text-white/70">Phone: {director.phone || 'N/A'}</p>
										<p class="text-sm text-white/70">License: {director.licenseNumber || 'N/A'}</p>
										<p class="text-sm text-white/70">Type: {director.businessType || 'N/A'}</p>
									</div>
									<div class="flex flex-col sm:flex-row gap-2">
										<Button
											onclick={() => startEditingDirector(director)}
											variant="secondary"
											size="sm"
											rounded="lg"
											class="min-h-[44px]"
										>
											✏️ Edit
										</Button>
										<Button
											onclick={() => deleteFuneralDirector(director.id, director.companyName)}
											disabled={isDeletingDirector}
											variant="danger"
											size="sm"
											rounded="lg"
											class="min-h-[44px]"
										>
											{isDeletingDirector ? 'Deleting...' : '🗑️ Delete'}
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Edit Director Modal -->
			{#if editingDirector}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div class="w-full max-w-2xl rounded-xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
						<h3 class="mb-4 text-xl font-bold text-white">Edit Funeral Director</h3>
						
						<form onsubmit={(e) => { e.preventDefault(); updateFuneralDirector(); }} class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">Company Name</label>
								<input
									type="text"
									bind:value={directorEditForm.companyName}
									required
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">Contact Person</label>
								<input
									type="text"
									bind:value={directorEditForm.contactPerson}
									required
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">Email</label>
								<input
									type="email"
									bind:value={directorEditForm.email}
									required
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">Phone</label>
								<input
									type="tel"
									bind:value={directorEditForm.phone}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">License Number</label>
								<input
									type="text"
									bind:value={directorEditForm.licenseNumber}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white/90 mb-1">Business Type</label>
								<select
									bind:value={directorEditForm.businessType}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-amber-400 focus:outline-none"
								>
									<option value="">Select Type</option>
									<option value="funeral_home">Funeral Home</option>
									<option value="cremation_service">Cremation Service</option>
									<option value="memorial_service">Memorial Service Provider</option>
									<option value="other">Other</option>
								</select>
							</div>

							<div class="flex gap-3 pt-4">
								<Button
									type="submit"
									disabled={isUpdatingDirector}
									loading={isUpdatingDirector}
									variant="primary"
									size="md"
									rounded="lg"
									class="flex-1 min-h-[44px]"
								>
									{isUpdatingDirector ? 'Updating...' : '✅ Save Changes'}
								</Button>
								<Button
									type="button"
									onclick={cancelEditingDirector}
									disabled={isUpdatingDirector}
									variant="secondary"
									size="md"
									rounded="lg"
									class="flex-1 min-h-[44px]"
								>
									❌ Cancel
								</Button>
							</div>
						</form>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Memorials Tab -->
	{#if activeTab === 'memorials'}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">Memorial Management</h2>
				{#if memorials.length > 0}
					<div class="flex items-center gap-3">
						<label class="flex items-center gap-2 text-sm text-white/70">
							<input
								type="checkbox"
								bind:checked={selectAll}
								onchange={handleSelectAll}
								class="rounded border-white/20 bg-white/10 text-blue-500"
							/>
							Select All
						</label>
						{#if selectedMemorials.size > 0}
							<div class="flex gap-2">
								<Button
									onclick={() => toggleMemorialStatus(true)}
									disabled={isTogglingStatus}
									variant="primary"
									rounded="lg"
								>
									{isTogglingStatus ? 'Updating...' : `✅ Mark Complete (${selectedMemorials.size})`}
								</Button>
								<Button
									onclick={() => toggleMemorialStatus(false)}
									disabled={isTogglingStatus}
									variant="secondary"
									rounded="lg"
								>
									{isTogglingStatus ? 'Updating...' : `📅 Mark Scheduled (${selectedMemorials.size})`}
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-white w-12">Select</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Loved One</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Creator</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Status</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if memorials && memorials.length > 0}
								{#each memorials as memorial}
									<tr class="border-b border-white/10 hover:bg-white/5">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												checked={selectedMemorials.has(memorial.id || '')}
												onchange={(e) => handleMemorialSelect(memorial.id || '', e)}
												class="rounded border-white/20 bg-white/10 text-blue-500"
											/>
										</td>
										<td class="px-4 py-3 text-white">{memorial.lovedOneName}</td>
										<td class="px-4 py-3 text-sm text-white/70">{memorial.creatorEmail}</td>
										<td class="px-4 py-3">
											<div class="flex flex-col gap-1">
												{#if memorial.isComplete}
													<span class="rounded bg-green-500 px-2 py-1 text-xs text-white w-fit">✅ Completed</span>
												{:else}
													<span class="rounded bg-amber-500 px-2 py-1 text-xs text-white w-fit">📅 Scheduled</span>
												{/if}
												{#if memorial.isPublic}
													<span class="rounded bg-blue-500 px-2 py-1 text-xs text-white w-fit">Public</span>
												{:else}
													<span class="rounded bg-gray-500 px-2 py-1 text-xs text-white w-fit">Private</span>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<a
													href="/{memorial.fullSlug}"
													class="text-sm text-blue-400 hover:text-blue-300">View</a
												>
												<a
													href="/memorials/{memorial.id}/streams"
													class="text-sm text-green-400 hover:text-green-300">Streams</a
												>
												<a
													href="/schedule?memorialId={memorial.id}"
													class="text-sm text-purple-400 hover:text-purple-300">Schedule</a
												>
												<button
													onclick={() => toggleMemorialStatus(!memorial.isComplete)}
													class="text-sm {memorial.isComplete ? 'text-amber-400 hover:text-amber-300' : 'text-green-400 hover:text-green-300'}"
												>
													{memorial.isComplete ? 'Mark Scheduled' : 'Mark Complete'}
												</button>
												<button
													onclick={() => deleteMemorial(memorial.id || '', memorial.lovedOneName)}
													class="text-sm text-red-400 hover:text-red-300"
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="4" class="px-4 py-8 text-center text-white/70">No memorials found</td
									>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Memorial Owners Tab -->
	{#if activeTab === 'memorial-owners'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Memorial Owners</h2>
			<p class="text-white/70 mb-6">Manage families and individuals who own memorial pages</p>

			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-white">Owner Name</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Email</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Memorials</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Joined</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if allUsers && allUsers.length > 0}
								{#each allUsers.filter(user => user.role === 'owner' || !user.role) as owner}
									{@const ownerMemorials = memorials.filter(m => m.creatorEmail === owner.email)}
									<tr class="border-b border-white/10 hover:bg-white/5">
										<td class="px-4 py-3 text-white">
											{owner.displayName || 'Unknown'}
										</td>
										<td class="px-4 py-3 text-sm text-white/70">
											{owner.email}
										</td>
										<td class="px-4 py-3">
											<div class="flex flex-col gap-1">
												<span class="text-white font-medium">{ownerMemorials.length} memorial{ownerMemorials.length !== 1 ? 's' : ''}</span>
												{#if ownerMemorials.length > 0}
													<div class="text-xs text-white/60">
														{ownerMemorials.slice(0, 2).map(m => m.lovedOneName).join(', ')}
														{#if ownerMemorials.length > 2}
															<span class="text-white/40">+{ownerMemorials.length - 2} more</span>
														{/if}
													</div>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-sm text-white/70">
											{owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : 'Unknown'}
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<button
													class="text-sm text-blue-400 hover:text-blue-300"
													onclick={() => {
														// Navigate to user's first memorial if they have one
														if (ownerMemorials.length > 0) {
															window.open(`/${ownerMemorials[0].fullSlug}`, '_blank');
														}
													}}
													disabled={ownerMemorials.length === 0}
												>
													View Memorial{ownerMemorials.length > 1 ? 's' : ''}
												</button>
												<button
													class="text-sm text-green-400 hover:text-green-300"
													onclick={() => {
														// Copy email to clipboard
														navigator.clipboard.writeText(owner.email);
														alert('Email copied to clipboard!');
													}}
												>
													Contact
												</button>
												<button
													onclick={() => deleteUser(owner.uid, owner.email)}
													class="text-sm text-red-400 hover:text-red-300"
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="5" class="px-4 py-8 text-center text-white/70">No memorial owners found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Memorial Owners Summary Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Total Owners</h3>
					<p class="text-3xl font-bold text-blue-400">
						{allUsers.filter(user => user.role === 'owner' || !user.role).length}
					</p>
					<p class="text-sm text-white/60 mt-1">Families & individuals</p>
				</div>
				
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Active Owners</h3>
					<p class="text-3xl font-bold text-green-400">
						{allUsers.filter(user => (user.role === 'owner' || !user.role) && 
							memorials.some(m => m.creatorEmail === user.email)).length}
					</p>
					<p class="text-sm text-white/60 mt-1">With memorials</p>
				</div>
				
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Avg. Memorials</h3>
					<p class="text-3xl font-bold text-purple-400">
						{allUsers.filter(user => user.role === 'owner' || !user.role).length > 0 
							? (memorials.length / allUsers.filter(user => user.role === 'owner' || !user.role).length).toFixed(1)
							: '0.0'}
					</p>
					<p class="text-sm text-white/60 mt-1">Per owner</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Create Memorial Tab -->
	{#if activeTab === 'create-memorial'}
		<div class="space-y-4 md:space-y-6">
			<h2 class="text-xl md:text-2xl font-bold text-white">Create New Memorial</h2>

			<div class="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6">
				<form onsubmit={createMemorial} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Loved One's Name *</label>
							<input
								type="text"
								bind:value={newMemorialForm.lovedOneName}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none min-h-[44px]"
								placeholder="Enter the loved one's name"
								required
							/>
						</div>
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Creator Email *</label>
							<input
								type="email"
								bind:value={newMemorialForm.creatorEmail}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none min-h-[44px]"
								placeholder="Family contact email"
								required
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Creator Name</label>
							<input
								type="text"
								bind:value={newMemorialForm.creatorName}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none min-h-[44px]"
								placeholder="Family contact name"
							/>
						</div>
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Location</label>
							<input
								type="text"
								bind:value={newMemorialForm.location}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none min-h-[44px]"
								placeholder="Service location"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Service Date</label>
							<input
								type="date"
								bind:value={newMemorialForm.serviceDate}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
							/>
						</div>
						<div>
							<label class="mb-2 block text-sm md:text-base font-semibold text-white">Service Time</label>
							<input
								type="time"
								bind:value={newMemorialForm.serviceTime}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
							/>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-sm md:text-base font-semibold text-white">Memorial Description</label>
						<textarea
							bind:value={newMemorialForm.content}
							class="h-24 w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
							placeholder="Brief description or obituary text"
						></textarea>
					</div>

					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							bind:checked={newMemorialForm.isPublic}
							id="isPublic"
							class="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-400 focus:ring-amber-400"
						/>
						<label for="isPublic" class="text-white">Make memorial publicly visible</label>
					</div>

					<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
						<Button
							type="submit"
							disabled={isCreatingMemorial}
							loading={isCreatingMemorial}
							variant="role"
							role="admin"
							size="lg"
							rounded="lg"
							class="w-full sm:w-auto min-h-[48px]"
						>
							{isCreatingMemorial ? 'Creating...' : '✨ Create Memorial'}
						</Button>
						<Button
							variant="secondary"
							size="lg"
							onclick={() => (activeTab = 'overview')}
							rounded="lg"
							class="w-full sm:w-auto min-h-[48px]"
						>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Schedule Edit Requests Tab -->
	{#if activeTab === 'schedule-requests'}
		<div class="space-y-4 md:space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-xl md:text-2xl font-bold text-white">📝 Schedule Edit Requests</h2>
				<button
					onclick={() => loadEditRequests()}
					disabled={editRequestsLoading}
					class="rounded-lg bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50"
				>
					{editRequestsLoading ? 'Loading...' : '🔄 Refresh'}
				</button>
			</div>

			<!-- Filters -->
			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<div class="flex items-center gap-4">
					<label class="text-sm text-white/70">Status Filter:</label>
					<select
						bind:value={editRequestStatusFilter}
						onchange={() => loadEditRequests()}
						class="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
					>
						<option value="">All Statuses</option>
						<option value="pending">Pending</option>
						<option value="approved">Approved</option>
						<option value="denied">Denied</option>
						<option value="completed">Completed</option>
					</select>
				</div>
			</div>

			<!-- Requests List -->
			{#if editRequestsLoading}
				<div class="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
					<p class="text-white/70">Loading requests...</p>
				</div>
			{:else if editRequests.length === 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
					<p class="text-white/70">No edit requests found</p>
				</div>
			{:else}
				<div class="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
					<!-- Desktop Table -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full">
							<thead class="bg-white/5">
								<tr>
									<th class="px-4 py-3 text-left text-xs font-medium text-white/70">Memorial</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-white/70">Requested By</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-white/70">Date</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-white/70">Status</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-white/70">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each editRequests as request}
									<tr class="border-t border-white/10 hover:bg-white/5">
										<td class="px-4 py-3 text-sm text-white">
											<div class="font-medium">{request.memorialName}</div>
										</td>
										<td class="px-4 py-3 text-sm text-white/70">{request.requestedByEmail}</td>
										<td class="px-4 py-3 text-sm text-white/70">{formatRequestDate(request.createdAt)}</td>
										<td class="px-4 py-3">
											<span class="inline-flex rounded-full px-2 py-1 text-xs font-medium {getStatusBadgeClass(request.status)}">
												{request.status}
											</span>
										</td>
										<td class="px-4 py-3">
											<button
												onclick={() => (selectedEditRequest = request)}
												class="text-sm text-amber-400 hover:text-amber-300"
											>
												Review
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile Cards -->
					<div class="md:hidden space-y-3 p-3">
						{#each editRequests as request}
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<div class="mb-2 flex items-start justify-between">
									<div class="flex-1">
										<h3 class="font-medium text-white">{request.memorialName}</h3>
										<p class="text-sm text-white/70">{request.requestedByEmail}</p>
									</div>
									<span class="inline-flex rounded-full px-2 py-1 text-xs font-medium {getStatusBadgeClass(request.status)}">
										{request.status}
									</span>
								</div>
								<p class="mb-2 text-xs text-white/50">{formatRequestDate(request.createdAt)}</p>
								<button
									onclick={() => (selectedEditRequest = request)}
									class="w-full rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/30"
								>
									Review Request
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Request Detail Modal -->
	{#if selectedEditRequest}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={() => (selectedEditRequest = null)}>
			<div class="relative w-full max-w-3xl rounded-lg bg-gray-900 p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
				<button
					onclick={() => (selectedEditRequest = null)}
					class="absolute right-4 top-4 text-white/50 hover:text-white"
				>
					✕
				</button>

				<h2 class="mb-6 text-2xl font-bold text-white">Schedule Edit Request</h2>

				<div class="space-y-6">
					<!-- Memorial Info -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-white/70">Memorial</h3>
						<p class="text-white">{selectedEditRequest.memorialName}</p>
						<a
							href="/{selectedEditRequest.memorialId}"
							class="text-sm text-amber-400 hover:text-amber-300"
							target="_blank"
						>
							View Memorial →
						</a>
					</div>

					<!-- Request Info -->
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<h3 class="mb-2 text-sm font-medium text-white/70">Requested By</h3>
							<p class="text-white">{selectedEditRequest.requestedByEmail}</p>
						</div>
						<div>
							<h3 class="mb-2 text-sm font-medium text-white/70">Request Date</h3>
							<p class="text-white">{formatRequestDate(selectedEditRequest.createdAt)}</p>
						</div>
					</div>

					<!-- Current Booking -->
					{#if selectedEditRequest.currentConfig}
						<div>
							<h3 class="mb-2 text-sm font-medium text-white/70">Current Booking</h3>
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<p class="mb-2 text-white">
									<strong>Tier:</strong>
									{selectedEditRequest.currentConfig.tier}
								</p>
								<p class="text-white">
									<strong>Total:</strong>
									${selectedEditRequest.currentConfig.total}
								</p>
							</div>
						</div>
					{/if}

					<!-- Requested Changes -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-white/70">Requested Changes</h3>
						<div class="rounded-lg border border-white/10 bg-white/5 p-4">
							<p class="whitespace-pre-wrap text-white">{selectedEditRequest.requestDetails}</p>
						</div>
					</div>

					<!-- Admin Actions -->
					{#if selectedEditRequest.status === 'pending'}
						<div>
							<h3 class="mb-2 text-sm font-medium text-white/70">Admin Actions</h3>
							<textarea
								bind:value={selectedEditRequest.tempAdminNotes}
								placeholder="Add notes about this request..."
								class="mb-4 w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50"
								rows="3"
							></textarea>
							<div class="flex gap-3">
								<button
									onclick={() => updateEditRequestStatus(selectedEditRequest.id, 'approved', selectedEditRequest.tempAdminNotes || '')}
									disabled={isUpdatingRequest}
									class="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
								>
									✓ Approve
								</button>
								<button
									onclick={() => updateEditRequestStatus(selectedEditRequest.id, 'denied', selectedEditRequest.tempAdminNotes || '')}
									disabled={isUpdatingRequest}
									class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
								>
									✗ Deny
								</button>
								<button
									onclick={() => updateEditRequestStatus(selectedEditRequest.id, 'completed', selectedEditRequest.tempAdminNotes || '')}
									disabled={isUpdatingRequest}
									class="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
								>
									✓ Completed
								</button>
							</div>
						</div>
					{:else}
						<div>
							<h3 class="mb-2 text-sm font-medium text-white/70">Status</h3>
							<span class="inline-flex rounded-full px-3 py-1 text-sm font-medium {getStatusBadgeClass(selectedEditRequest.status)}">
								{selectedEditRequest.status}
							</span>
							{#if selectedEditRequest.reviewedBy}
								<p class="mt-2 text-sm text-white/70">
									Reviewed by {selectedEditRequest.reviewedByEmail} on {formatRequestDate(selectedEditRequest.reviewedAt)}
								</p>
							{/if}
							{#if selectedEditRequest.adminNotes}
								<div class="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
									<p class="text-sm text-white">{selectedEditRequest.adminNotes}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Audit Logs Tab -->
	{#if activeTab === 'audit-logs'}
		<div class="space-y-4 md:space-y-6">
			<h2 class="text-xl md:text-2xl font-bold text-white">🔍 Audit Logs</h2>

			<!-- Filters -->
			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<h3 class="mb-4 text-base md:text-lg font-semibold text-white">Filters</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">Action</label>
						<select
							bind:value={auditFilters.action}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
						>
							<option value="">All Actions</option>
							<option value="memorial_created">Memorial Created</option>
							<option value="memorial_updated">Memorial Updated</option>
							<option value="memorial_deleted">Memorial Deleted</option>
							<option value="memorial_viewed">Memorial Viewed</option>
							<option value="user_login">User Login</option>
							<option value="user_logout">User Logout</option>
							<option value="funeral_director_approved">Director Approved</option>
							<option value="api_access_denied">Access Denied</option>
						</select>
					</div>
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">User Email</label>
						<input
							type="email"
							bind:value={auditFilters.userEmail}
							placeholder="Filter by user"
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white placeholder-white/50 focus:border-amber-400 focus:outline-none min-h-[44px]"
						/>
					</div>
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">Resource Type</label>
						<select
							bind:value={auditFilters.resourceType}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
						>
							<option value="">All Types</option>
							<option value="memorial">Memorial</option>
							<option value="user">User</option>
							<option value="schedule">Schedule</option>
							<option value="payment">Payment</option>
						</select>
					</div>
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">Date From</label>
						<input
							type="date"
							bind:value={auditFilters.dateFrom}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
						/>
					</div>
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">Date To</label>
						<input
							type="date"
							bind:value={auditFilters.dateTo}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
						/>
					</div>
					<div>
						<label class="mb-1 block text-xs sm:text-sm text-white/70">Limit</label>
						<select
							bind:value={auditFilters.limit}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-base text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
						>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value={250}>250</option>
						</select>
					</div>
				</div>
				<div class="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-2">
					<Button
						onclick={loadAuditLogs}
						disabled={auditLoading}
						loading={auditLoading}
						variant="role"
						role="admin"
						size="md"
						rounded="lg"
						class="w-full sm:w-auto min-h-[44px]"
					>
						{auditLoading ? 'Loading...' : '🔍 Search'}
					</Button>
					<Button
						onclick={() => {
							auditFilters.action = '';
							auditFilters.userEmail = '';
							auditFilters.startDate = '';
							auditFilters.endDate = '';
							auditLogs = [];
						}}
						variant="secondary"
						size="md"
						rounded="lg"
						class="w-full sm:w-auto min-h-[44px]"
					>
						🔄 Clear Filters
					</Button>
				</div>
			</div>

			<!-- Audit Logs Table -->
			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				{#if auditLoading}
					<div class="p-8 text-center">
						<div class="text-white/70">Loading audit logs...</div>
					</div>
				{:else if auditLogs.length === 0}
					<div class="p-8 text-center">
						<div class="text-white/70">No audit logs found matching your criteria.</div>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-white/10">
								<tr>
									<th class="px-4 py-3 text-left font-semibold text-white">Timestamp</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Action</th>
									<th class="px-4 py-3 text-left font-semibold text-white">User</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Resource</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Details</th>
									<th class="px-4 py-3 text-left font-semibold text-white">IP Address</th>
								</tr>
							</thead>
							<tbody>
								{#each auditLogs as log, index}
									<tr class="border-t border-white/10 {index % 2 === 0 ? 'bg-white/5' : ''}">
										<td class="px-4 py-3 text-sm text-white/90">
											{formatTimestamp(log.timestamp)}
										</td>
										<td class="px-4 py-3 text-white/90">
											<span class="inline-flex items-center gap-2">
												{getActionEmoji(log.action)}
												<span class="text-sm">{log.action}</span>
											</span>
										</td>
										<td class="px-4 py-3 text-sm text-white/90">
											<div>
												<div class="font-medium">{log.userEmail || 'Unknown'}</div>
												{#if log.userRole}
													<div class="text-xs text-white/60">{log.userRole}</div>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-sm text-white/90">
											{#if log.resourceType && log.resourceId}
												<div>
													<div class="font-medium">{log.resourceType}</div>
													<div class="font-mono text-xs text-white/60">{log.resourceId}</div>
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="max-w-xs px-4 py-3 text-sm text-white/90">
											{#if log.details}
												<div class="truncate" title={JSON.stringify(log.details, null, 2)}>
													{typeof log.details === 'string'
														? log.details
														: JSON.stringify(log.details)}
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="px-4 py-3 font-mono text-sm text-white/90">
											{log.ipAddress || '-'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Summary Stats -->
			{#if auditLogs.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">Summary</h3>
					<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div>
							<div class="text-white/70">Total Events</div>
							<div class="text-lg font-semibold text-white">{auditLogs.length}</div>
						</div>
						<div>
							<div class="text-white/70">Unique Users</div>
							<div class="text-lg font-semibold text-white">
								{new Set(auditLogs.map((log) => log.userEmail).filter(Boolean)).size}
							</div>
						</div>
						<div>
							<div class="text-white/70">Access Denied</div>
							<div class="text-lg font-semibold text-white">
								{auditLogs.filter((log) => log.action === 'api_access_denied').length}
							</div>
						</div>
						<div>
							<div class="text-white/70">Date Range</div>
							<div class="text-sm font-semibold text-white">
								{#if auditLogs.length > 0}
									{formatTimestamp(auditLogs[auditLogs.length - 1].timestamp).split(',')[0]} -
									{formatTimestamp(auditLogs[0].timestamp).split(',')[0]}
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Payment Modal -->
	{#if paymentModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div class="w-full max-w-md rounded-xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
				<h3 class="mb-4 text-xl font-bold text-white">Mark Memorial as Paid</h3>
				
				<div class="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
					<p class="text-sm text-white/70 mb-1">Memorial:</p>
					<p class="font-semibold text-white">{paymentModal.lovedOneName}</p>
					<p class="text-sm text-white/70 mt-1">Creator: {paymentModal.creatorEmail}</p>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); togglePaymentStatus(paymentModal.id, true); }} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-white/90 mb-2">Payment Method</label>
						<select
							bind:value={paymentForm.method}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-amber-400 focus:outline-none"
						>
							<option value="cash">Cash</option>
							<option value="check">Check</option>
							<option value="bank_transfer">Bank Transfer</option>
							<option value="venmo">Venmo</option>
							<option value="paypal">PayPal</option>
							<option value="zelle">Zelle</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-white/90 mb-2">Notes (Optional)</label>
						<textarea
							bind:value={paymentForm.notes}
							placeholder="Add any payment details or notes..."
							rows="3"
							class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
						></textarea>
					</div>

					<div class="flex gap-3 pt-2">
						<Button
							type="submit"
							disabled={isTogglingPayment}
							loading={isTogglingPayment}
							variant="primary"
							size="md"
							rounded="lg"
							class="flex-1 min-h-[44px]"
						>
							{isTogglingPayment ? 'Processing...' : '✅ Mark as Paid'}
						</Button>
						<Button
							type="button"
							onclick={closePaymentModal}
							disabled={isTogglingPayment}
							variant="secondary"
							size="md"
							rounded="lg"
							class="flex-1 min-h-[44px]"
						>
							❌ Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
