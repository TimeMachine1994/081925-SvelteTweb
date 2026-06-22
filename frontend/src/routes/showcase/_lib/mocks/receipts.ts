/**
 * Mock receipt data.
 * Re-exported from the consolidated `showcase-data.json` (single source of truth).
 * `receiptData` matches routes/payment/receipt/+page.svelte usage.
 * `adminReceipts` is a simple list for the admin Receipts screen.
 */
import data from '../showcase-data.json';

export const receiptData = data.receipts.receiptData;

export const adminReceipts = data.receipts.adminList;
