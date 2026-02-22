import "clsx";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div><div class="flex justify-between items-center mb-8"><div><h1 class="text-3xl font-title">Staff Codes</h1> <p class="text-muted-foreground mt-1">Manage employee registration codes</p></div> <button class="bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-4 rounded-md transition-colors">Create Code</button></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-card border border-border rounded-lg overflow-hidden"><table class="w-full"><thead class="bg-muted"><tr><th class="px-4 py-3 text-left text-sm font-medium">Employee Number</th><th class="px-4 py-3 text-left text-sm font-medium">Role</th><th class="px-4 py-3 text-left text-sm font-medium">Status</th><th class="px-4 py-3 text-left text-sm font-medium">Assigned To</th><th class="px-4 py-3 text-left text-sm font-medium">Actions</th></tr></thead><tbody class="divide-y divide-border">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
