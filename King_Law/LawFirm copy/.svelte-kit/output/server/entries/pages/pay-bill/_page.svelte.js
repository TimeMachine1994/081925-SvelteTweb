import { a9 as head } from "../../../chunks/index2.js";
import { a as attr } from "../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let name = "";
    let email = "";
    let phone = "";
    let amount = "";
    let memo = "";
    let loading = false;
    head("1yhkk8d", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Pay Your Bill | King Law, P.L.L.C.</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen pt-20"><section class="py-24 bg-king-blue"><div class="max-w-5xl mx-auto px-6 lg:px-8"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Secure Payment</p> <h1 class="font-title text-5xl md:text-6xl text-white leading-tight mb-6">Pay Your Bill</h1> <p class="text-xl text-white/70 max-w-2xl">Make a secure payment toward your legal services. All payments are processed safely through Square.</p></div></section> <section class="py-24 bg-white"><div class="max-w-6xl mx-auto px-6 lg:px-8"><div class="grid lg:grid-cols-12 gap-16"><div class="lg:col-span-7"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Payment Details</p> <h2 class="font-title text-3xl text-king-blue mb-8">Enter Your Information</h2> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form class="space-y-6"><div><label for="amount" class="block text-sm font-medium text-king-blue mb-2">Payment Amount *</label> <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span> <input type="number" id="amount" step="0.01" min="0.01"${attr("value", amount)} required placeholder="0.00" class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg font-semibold"/></div></div> <div class="grid md:grid-cols-2 gap-6"><div><label for="name" class="block text-sm font-medium text-king-blue mb-2">Full Name *</label> <input type="text" id="name"${attr("value", name)} required placeholder="Jane Doe" class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div> <div><label for="phone" class="block text-sm font-medium text-king-blue mb-2">Phone Number</label> <input type="tel" id="phone"${attr("value", phone)} placeholder="(555) 555-5555" class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div></div> <div><label for="email" class="block text-sm font-medium text-king-blue mb-2">Email Address</label> <input type="email" id="email"${attr("value", email)} placeholder="jane@example.com" class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/> <p class="text-xs text-gray-400 mt-1">Please provide either an email or phone number.</p></div> <div><label for="memo" class="block text-sm font-medium text-king-blue mb-2">Memo / Invoice # <span class="text-gray-400 font-normal">(optional)</span></label> <input type="text" id="memo"${attr("value", memo)} placeholder="e.g. Invoice #1234 or case reference" class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div> <button type="submit"${attr("disabled", loading, true)} class="w-full bg-king-blue hover:bg-king-blue-light text-white font-semibold py-4 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`Proceed to Payment`);
    }
    $$renderer2.push(`<!--]--></button></form></div> <div class="lg:col-span-5"><div class="bg-king-blue rounded-2xl p-8 text-white sticky top-28"><div class="flex items-center gap-3 mb-8"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-12 w-auto"/></div> <div class="space-y-8"><div><p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Secure Payments</p> <p class="text-white/80">All payments are processed securely through Square. Your financial information is never stored on our servers.</p></div> <div class="space-y-4"><div class="flex items-start gap-3"><svg class="w-5 h-5 text-gold mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> <div><p class="text-white font-medium text-sm">256-bit SSL Encryption</p> <p class="text-white/60 text-xs">Your data is protected end-to-end</p></div></div> <div class="flex items-start gap-3"><svg class="w-5 h-5 text-gold mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> <div><p class="text-white font-medium text-sm">All Major Cards Accepted</p> <p class="text-white/60 text-xs">Visa, Mastercard, Amex, Discover</p></div></div> <div class="flex items-start gap-3"><svg class="w-5 h-5 text-gold mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg> <div><p class="text-white font-medium text-sm">Instant Confirmation</p> <p class="text-white/60 text-xs">Receive a receipt immediately after payment</p></div></div></div> <div class="pt-6 border-t border-white/10"><p class="text-white/60 text-sm mb-4">Have a question about your bill? Contact us directly.</p> <a href="/contact" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-6 py-3 rounded-lg font-semibold transition-all">Contact Us →</a></div></div></div></div></div></div></section></div>`);
  });
}
export {
  _page as default
};
