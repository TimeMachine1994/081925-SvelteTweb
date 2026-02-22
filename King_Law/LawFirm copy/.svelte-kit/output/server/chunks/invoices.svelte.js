import "clsx";
class InvoicesStore {
  invoices = [];
  loading = false;
  error = null;
  async fetchInvoices() {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      this.invoices = data.invoices || [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      this.loading = false;
    }
  }
  async payInvoice(invoiceId, amount) {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error("Failed to process payment");
      await this.fetchInvoices();
      return { success: true };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to process payment";
      return { success: false, error: this.error };
    } finally {
      this.loading = false;
    }
  }
}
const invoicesStore = new InvoicesStore();
export {
  invoicesStore as i
};
