<script lang="ts">
    import { onMount } from 'svelte';
    import type { Memorial } from '$lib/types/memorial';
    import type { Invitation } from '$lib/types/invitation';
    import { formatDate, formatCurrency } from '$lib/utils/formatters';
    import Calculator from '$lib/components/calculator/Calculator.svelte';
    import { Trash2, Users, Upload, Calendar, MapPin, ExternalLink, Edit3, ChevronDown, ChevronUp } from 'lucide-svelte';

    export let memorials: Memorial[] = [];
    export let invitations: Invitation[] = [];

    let showCalculator = false;
    let selectedMemorial: Memorial | null = null;
    let expandedCards: Set<string> = new Set();
    let deletingMemorialId: string | null = null;

    // Latest memorial is first, others are collapsible
    $: latestMemorial = memorials[0];
    $: olderMemorials = memorials.slice(1);

    function openCalculator(memorial: Memorial) {
        selectedMemorial = memorial;
        showCalculator = true;
    }

    function closeCalculator() {
        showCalculator = false;
        selectedMemorial = null;
    }

    function toggleCard(memorialId: string) {
        if (expandedCards.has(memorialId)) {
            expandedCards.delete(memorialId);
        } else {
            expandedCards.add(memorialId);
        }
        expandedCards = expandedCards; // Trigger reactivity
    }

    function getMemorialStatus(memorial: Memorial): string {
        const config = memorial.livestreamConfig;
        if (!config) return 'Setup Required';
        
        if (config.paymentStatus === 'paid') return 'Complete';
        if (config.paymentStatus === 'processing') return 'In Progress';
        return 'Setup Required';
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'Complete': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getPackageTotal(memorial: Memorial): number {
        const config = memorial.livestreamConfig;
        if (!config?.bookingItems) return 0;
        
        return config.bookingItems.reduce((total: number, item: any) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    function canDeleteMemorial(memorial: Memorial): boolean {
        const config = memorial.livestreamConfig;
        return !config || config.paymentStatus === 'unpaid' || !config.paymentStatus;
    }

    async function deleteMemorial(memorial: Memorial) {
        if (!canDeleteMemorial(memorial)) {
            alert('Cannot delete memorial with paid or processing payment status');
            return;
        }

        if (!confirm(`Are you sure you want to delete the memorial for ${memorial.lovedOneName}? This action cannot be undone.`)) {
            return;
        }

        deletingMemorialId = memorial.id;

        try {
            const response = await fetch(`/api/memorials/${memorial.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete memorial');
            }

            // Refresh the page to update the memorial list
            window.location.reload();
        } catch (error) {
            console.error('Error deleting memorial:', error);
            alert(`Failed to delete memorial: ${(error as Error).message}`);
        } finally {
            deletingMemorialId = null;
        }
    }

    function handleInviteResponse(invitationId: string, response: 'accept' | 'decline') {
        // Implementation for handling invitation responses
        console.log(`${response} invitation ${invitationId}`);
    }

    onMount(() => {
        console.log('OwnerPortal mounted with memorials:', memorials);
    });
</script>

<div class="owner-portal">
    <header class="portal-header">
        <h1>Your Memorial Dashboard</h1>
        <p class="subtitle">Manage your memorials, livestreams, and family invitations</p>
    </header>

    {#if memorials && memorials.length > 0}
        <!-- Latest Memorial - Full Display -->
        {#if latestMemorial}
            <div class="latest-memorial-panel">
                <div class="memorial-header">
                    <div class="memorial-title">
                        <h2 class="loved-one-name">{latestMemorial.lovedOneName}</h2>
                        <span class="latest-badge">Latest</span>
                        <div class="status-badge {getStatusColor(getMemorialStatus(latestMemorial))}">
                            {getMemorialStatus(latestMemorial)}
                        </div>
                    </div>
                    <div class="memorial-actions">
                        {#if canDeleteMemorial(latestMemorial)}
                            <button 
                                class="delete-btn"
                                on:click={() => deleteMemorial(latestMemorial)}
                                disabled={deletingMemorialId === latestMemorial.id}
                                title="Delete memorial"
                            >
                                {#if deletingMemorialId === latestMemorial.id}
                                    <div class="spinner"></div>
                                {:else}
                                    <Trash2 size="16" />
                                {/if}
                            </button>
                        {/if}
                        {#if latestMemorial.imageUrl}
                            <img src={latestMemorial.imageUrl} alt={latestMemorial.lovedOneName} class="memorial-photo" />
                        {/if}
                    </div>
                </div>

                <!-- 1. Livestream Link First -->
                <div class="livestream-section">
                    <h3>Memorial Livestream</h3>
                    <a href="/tributes/{latestMemorial.slug}" class="livestream-link">
                        <ExternalLink size="20" />
                        <div class="link-content">
                            <span class="link-title">View Memorial Page</span>
                            <span class="link-url">tributestream.com/tributes/{latestMemorial.slug}</span>
                        </div>
                    </a>
                </div>

                <!-- 2. Package Breakdown -->
                {#if latestMemorial.livestreamConfig}
                    <div class="package-section">
                        <h3>Package Details</h3>
                        <div class="package-breakdown">
                            <div class="package-tier">
                                <span class="tier-name">{latestMemorial.livestreamConfig.formData?.selectedTier || 'N/A'} Package</span>
                                <span class="tier-price">{formatCurrency(latestMemorial.livestreamConfig.total || 0)}</span>
                            </div>
                            {#if latestMemorial.memorialDate}
                                <div class="package-detail">
                                    <span class="detail-label">Service Date:</span>
                                    <span class="detail-value">{formatDate(latestMemorial.memorialDate)}</span>
                                </div>
                            {/if}
                            {#if latestMemorial.memorialLocationName}
                                <div class="package-detail">
                                    <span class="detail-label">Location:</span>
                                    <span class="detail-value">{latestMemorial.memorialLocationName}</span>
                                </div>
                            {/if}
                            <div class="package-detail">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">{latestMemorial.livestreamConfig.paymentStatus === 'paid' ? 'Paid & Confirmed' : 'Payment Pending'}</span>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- 3. Edit Details Option -->
                <div class="edit-section">
                    <h3>Manage Memorial</h3>
                    <div class="edit-actions">
                        {#if latestMemorial.livestreamConfig}
                            <a href="/app/calculator?memorialId={latestMemorial.id}&lovedOneName={encodeURIComponent(latestMemorial.lovedOneName)}" class="edit-btn primary">
                                <Edit3 size="16" />
                                Edit Details & Package
                            </a>
                            <a href="/my-portal/tributes/{latestMemorial.id}/edit" class="edit-btn secondary">
                                <Upload size="16" />
                                Manage Photos
                            </a>
                        {:else}
                            <a href="/app/calculator?memorialId={latestMemorial.id}&lovedOneName={encodeURIComponent(latestMemorial.lovedOneName)}" class="edit-btn primary">
                                <Calendar size="16" />
                                Complete Memorial Setup
                            </a>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Older Memorials - Collapsible Cards -->
        {#if olderMemorials.length > 0}
            <div class="older-memorials">
                <h3 class="older-memorials-title">Previous Memorials</h3>
                {#each olderMemorials as memorial}
                    <div class="memorial-card">
                        <button 
                            class="memorial-card-header"
                            on:click={() => toggleCard(memorial.id)}
                        >
                            <div class="card-title-section">
                                <h4 class="loved-one-name">{memorial.lovedOneName}</h4>
                                <div class="status-badge {getStatusColor(getMemorialStatus(memorial))}">
                                    {getMemorialStatus(memorial)}
                                </div>
                            </div>
                            <div class="card-actions">
                                {#if canDeleteMemorial(memorial)}
                                    <button 
                                        class="delete-btn"
                                        on:click|stopPropagation={() => deleteMemorial(memorial)}
                                        disabled={deletingMemorialId === memorial.id}
                                        title="Delete memorial"
                                    >
                                        {#if deletingMemorialId === memorial.id}
                                            <div class="spinner"></div>
                                        {:else}
                                            <Trash2 size="14" />
                                        {/if}
                                    </button>
                                {/if}
                                {#if expandedCards.has(memorial.id)}
                                    <ChevronUp size="20" />
                                {:else}
                                    <ChevronDown size="20" />
                                {/if}
                            </div>
                        </button>

                        {#if expandedCards.has(memorial.id)}
                            <div class="memorial-card-content">
                                <!-- Livestream Link -->
                                <div class="card-section">
                                    <a href="/tributes/{memorial.slug}" class="livestream-link compact">
                                        <ExternalLink size="16" />
                                        <span>View Memorial Page</span>
                                    </a>
                                </div>

                                <!-- Package Info -->
                                {#if memorial.livestreamConfig}
                                    <div class="card-section">
                                        <div class="package-info">
                                            <span class="tier-name">{memorial.livestreamConfig.formData?.selectedTier || 'N/A'}</span>
                                            <span class="tier-price">{formatCurrency(memorial.livestreamConfig.total || 0)}</span>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Actions -->
                                <div class="card-section">
                                    <div class="card-actions-row">
                                        {#if memorial.livestreamConfig}
                                            <a href="/app/calculator?memorialId={memorial.id}&lovedOneName={encodeURIComponent(memorial.lovedOneName)}" class="card-btn">
                                                <Edit3 size="14" />
                                                Edit
                                            </a>
                                            <a href="/my-portal/tributes/{memorial.id}/edit" class="card-btn">
                                                <Upload size="14" />
                                                Photos
                                            </a>
                                        {:else}
                                            <a href="/app/calculator?memorialId={memorial.id}&lovedOneName={encodeURIComponent(memorial.lovedOneName)}" class="card-btn primary">
                                                <Calendar size="14" />
                                                Setup
                                            </a>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

    {:else}
        <div class="empty-state">
            <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4"></path>
                    <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l4 4V12z"></path>
                </svg>
            </div>
<h2>No Memorials Yet</h2>
            <p>Start by creating a memorial with livestream service to honor your loved one.</p>
        </div>
    {/if}

    <div class="portal-actions">
        <a href="/my-portal/tributes/new" class="btn btn-primary btn-large">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="16"></line>
                <line x1="8" x2="16" y1="12" y2="12"></line>
            </svg>
            Create New Memorial
        </a>
    </div>
</div>

<style>
    .owner-portal {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: var(--base-font-family);
    }

    .portal-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .portal-header h1 {
        font-size: 2.5rem;
        font-weight: var(--heading-font-weight);
        color: var(--heading-font-color);
        margin-bottom: 0.5rem;
    }

    .subtitle {
        font-size: 1.125rem;
        color: var(--color-surface-600);
        margin: 0;
    }

    /* Latest Memorial Panel */
    .latest-memorial-panel {
        max-width: 800px;
        margin: 0 auto 3rem;
        background: var(--color-surface-50);
        border: 1px solid var(--color-surface-200);
        border-radius: var(--radius-container);
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .memorial-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid var(--color-surface-200);
    }

    .memorial-title {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .loved-one-name {
        font-size: 2rem;
        font-weight: var(--heading-font-weight);
        color: var(--heading-font-color);
        margin: 0;
    }

    .latest-badge {
        display: inline-block;
        background: var(--color-primary-500);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        width: fit-content;
    }

    .memorial-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .memorial-photo {
        width: 80px;
        height: 80px;
        border-radius: var(--radius-base);
        object-fit: cover;
        border: 2px solid var(--color-surface-200);
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .delete-btn {
        background: transparent;
        border: 1px solid var(--color-error-300);
        color: var(--color-error-600);
        border-radius: var(--radius-base);
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-btn:hover:not(:disabled) {
        background: var(--color-error-50);
        border-color: var(--color-error-400);
    }

    .delete-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--color-surface-300);
        border-top: 2px solid var(--color-primary-500);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Older Memorials Section */
    .older-memorials {
        max-width: 800px;
        margin: 0 auto 3rem;
    }

    .older-memorials-title {
        font-size: 1.5rem;
        font-weight: var(--heading-font-weight);
        color: var(--heading-font-color);
        margin-bottom: 1rem;
        text-align: center;
    }

    .memorial-card {
        background: var(--color-surface-50);
        border: 1px solid var(--color-surface-200);
        border-radius: var(--radius-container);
        margin-bottom: 1rem;
        overflow: hidden;
        transition: all 0.2s ease;
    }

    .memorial-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .memorial-card-header {
        width: 100%;
        background: transparent;
        border: none;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.2s ease;
    }

    .memorial-card-header:hover {
        background: var(--color-surface-100);
    }

    .card-title-section {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .card-title-section .loved-one-name {
        font-size: 1.25rem;
        margin: 0;
    }

    .card-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .memorial-card-content {
        padding: 0 1.5rem 1.5rem;
        border-top: 1px solid var(--color-surface-200);
        background: var(--color-surface-25);
    }

    .card-section {
        padding: 1rem 0;
        border-bottom: 1px solid var(--color-surface-100);
    }

    .card-section:last-child {
        border-bottom: none;
    }

    .livestream-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-primary-600);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    }

    .livestream-link:hover {
        color: var(--color-primary-700);
    }

    .livestream-link.compact {
        font-size: 0.875rem;
    }

    .package-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
    }

    .tier-name {
        font-weight: 500;
        color: var(--color-surface-700);
    }

    .tier-price {
        font-weight: 600;
        color: var(--color-primary-600);
    }

    .card-actions-row {
        display: flex;
        gap: 0.75rem;
    }

    .card-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-surface-300);
        border-radius: var(--radius-base);
        background: var(--color-surface-50);
        color: var(--color-surface-700);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .card-btn:hover {
        background: var(--color-surface-100);
        border-color: var(--color-surface-400);
    }

    .card-btn.primary {
        background: var(--color-primary-500);
        color: white;
        border-color: var(--color-primary-500);
    }

    .card-btn.primary:hover {
        background: var(--color-primary-600);
        border-color: var(--color-primary-600);
    }

    .livestream-section,
    .package-section,
    .edit-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--color-surface-200);
    }

    .livestream-section:last-of-type,
    .package-section:last-of-type,
    .edit-section:last-of-type {
        border-bottom: none;
    }

    .livestream-section h3,
    .package-section h3,
    .edit-section h3 {
        font-size: 1.25rem;
        font-weight: var(--heading-font-weight);
        color: var(--heading-font-color);
        margin: 0 0 1rem 0;
    }

    .livestream-link {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--color-primary-50);
        border: 2px solid var(--color-primary-200);
        border-radius: var(--radius-base);
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .livestream-link:hover {
        background: var(--color-primary-100);
        border-color: var(--color-primary-300);
        transform: translateY(-1px);
    }

    .link-content {
        flex: 1;
    }

    .link-title {
        display: block;
        font-weight: 600;
        color: var(--color-primary-700);
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
    }

    .link-url {
        display: block;
        color: var(--color-primary-600);
        font-size: 0.875rem;
        font-family: monospace;
    }

    .external-icon {
        width: 1.25rem;
        height: 1.25rem;
        color: var(--color-primary-500);
    }

    .package-breakdown {
        background: var(--color-surface-100);
        border-radius: var(--radius-base);
        padding: 1.5rem;
    }

    .package-tier {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-surface-300);
    }

    .tier-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-surface-900);
    }

    .tier-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-primary-600);
    }

    .package-detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .detail-label {
        font-weight: 500;
        color: var(--color-surface-600);
    }

    .detail-value {
        font-weight: 600;
        color: var(--color-surface-900);
    }

    .edit-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .edit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-radius: var(--radius-base);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        border: 1px solid transparent;
    }

    .edit-btn.primary {
        background: var(--color-primary-500);
        color: var(--color-primary-contrast-500);
    }

    .edit-btn.primary:hover {
        background: var(--color-primary-600);
    }

    .edit-btn.secondary {
        background: transparent;
        color: var(--color-surface-700);
        border-color: var(--color-surface-300);
    }

    .edit-btn.secondary:hover {
        background: var(--color-surface-100);
        border-color: var(--color-surface-400);
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-base);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        cursor: pointer;
    }

    .btn-primary {
        background: var(--color-primary-500);
        color: var(--color-primary-contrast-500);
    }

    .btn-primary:hover {
        background: var(--color-primary-600);
    }

    .btn-outline {
        background: transparent;
        color: var(--color-surface-700);
        border-color: var(--color-surface-300);
    }

    .btn-outline:hover {
        background: var(--color-surface-100);
        border-color: var(--color-surface-400);
    }

    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
    }

    .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
    }

    .icon {
        width: 1rem;
        height: 1rem;
        stroke-width: 2;
    }

    .invitation-section {
        border-top: 1px solid var(--color-surface-200);
        padding-top: 1.5rem;
    }

    .invitation-section h3 {
        font-size: 1.125rem;
        font-weight: var(--heading-font-weight);
        color: var(--heading-font-color);
        margin: 0 0 1rem 0;
    }

    .invite-form {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .invite-input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-surface-300);
        border-radius: var(--radius-base);
        font-size: 0.875rem;
    }

    .invite-input:focus {
        outline: none;
        border-color: var(--color-primary-500);
        box-shadow: 0 0 0 3px var(--color-primary-100);
    }

    .invitations-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .invitation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: var(--color-surface-100);
        border-radius: var(--radius-base);
    }

    .email {
        font-size: 0.875rem;
        color: var(--color-surface-700);
    }

    .status {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .status-pending {
        color: var(--color-warning-600);
    }

    .status-accepted {
        color: var(--color-success-600);
    }

    .status-declined {
        color: var(--color-error-600);
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--color-surface-600);
    }

    .empty-icon {
        width: 4rem;
        height: 4rem;
        margin: 0 auto 1.5rem;
        color: var(--color-surface-400);
    }

    .empty-icon svg {
        width: 100%;
        height: 100%;
        stroke-width: 1.5;
    }

    .empty-state h2 {
        font-size: 1.5rem;
        color: var(--color-surface-700);
        margin-bottom: 0.5rem;
    }

    .empty-state p {
        font-size: 1rem;
        max-width: 400px;
        margin: 0 auto;
    }

    .portal-actions {
        text-align: center;
        padding-top: 2rem;
        border-top: 1px solid var(--color-surface-200);
    }

    @media (max-width: 768px) {
        .owner-portal {
            padding: 1rem;
        }

        .unified-panel {
            max-width: 100%;
        }

        .memorial-section {
            padding: 1.5rem;
        }

        .memorial-header {
            flex-direction: column;
            gap: 1rem;
        }

        .memorial-title h2 {
            font-size: 1.75rem;
        }

        .edit-actions {
            flex-direction: column;
        }

        .invite-form {
            flex-direction: column;
        }

        .portal-header h1 {
            font-size: 2rem;
        }

        .livestream-link {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
        }

        .package-tier {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>