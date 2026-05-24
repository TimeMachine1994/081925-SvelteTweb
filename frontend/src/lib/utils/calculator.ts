// ------------------------------
// Helpers
// ------------------------------
export const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

// Simple slug for demo link
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");