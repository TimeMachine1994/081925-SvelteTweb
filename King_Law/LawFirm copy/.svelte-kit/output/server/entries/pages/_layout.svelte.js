import { Z as store_get, _ as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import { a as authStore } from "../../chunks/auth.svelte.js";
import { a as attr } from "../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import { e as escape_html } from "../../chunks/escaping.js";
import "clsx";
function Navigation($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user = null } = $$props;
    $$renderer2.push(`<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 depth-card"><div class="max-w-7xl mx-auto px-6 lg:px-8"><div class="flex items-center h-20"><a href="/" class="flex items-center gap-3 group shrink-0"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-12 w-auto"/> <div class="flex flex-col"><span class="font-title text-xl text-king-blue">King Law, PLLC</span> <span class="text-xs font-semibold text-gold tracking-wide">(689) 353-6943</span></div></a> <div class="hidden lg:flex flex-1 items-center justify-center gap-8"><a href="/meet-ben-king" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Meet Ben King</a> <div class="relative group"><button class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase flex items-center gap-1">Practice Areas <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button> <div class="absolute left-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"><div class="bg-king-blue rounded-lg p-2 min-w-[320px] depth-card-dark"><a href="/services/personal-injury" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Personal Injury</a> <a href="/services/criminal-defense" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Criminal Defense</a> <a href="/services/employment-law" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Employment Law</a> <a href="/services/real-estate-business" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Real Estate &amp; Business</a> <a href="/services/civil-rights" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Civil Rights Violations</a> <a href="/services/cannabis-law" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Medical Marijuana &amp; Cannabis</a> <a href="/services/appeals" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Appeals</a> <a href="/services/property-damage" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Property Damage</a></div></div></div> <a href="/our-team" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Our Team</a> <a href="/schedule" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Schedule</a> <a href="/contact" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Contact</a></div> <div class="hidden lg:flex items-center gap-4">`);
    if (user) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a${attr("href", user.role === "lawyer" || user.role === "admin" ? "/dashboard/lawyer" : "/dashboard/client")} class="bg-gold hover:bg-gold-light text-king-blue px-6 py-2.5 rounded-lg font-semibold transition-all depth-gold">Dashboard</a> <a href="/logout" class="text-king-blue/70 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50" title="Logout"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></a>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<a href="/login" class="border border-king-blue/30 hover:border-king-blue text-king-blue px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:bg-king-blue/5 depth-ghost">Login</a> <a href="/pay-bill" class="bg-gold hover:bg-gold-light text-king-blue px-6 py-2.5 rounded-lg font-semibold transition-all depth-gold">Pay Bill</a>`);
    }
    $$renderer2.push(`<!--]--></div> <button class="lg:hidden text-king-blue p-2" aria-label="Toggle mobile menu">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></nav>`);
  });
}
function Footer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<footer class="bg-king-blue mt-auto depth-inset"><div class="max-w-7xl mx-auto px-6 lg:px-8 py-16"><div class="grid grid-cols-1 lg:grid-cols-12 gap-12"><div class="lg:col-span-5"><div class="flex items-center gap-3 mb-6"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-14 w-auto"/></div> <p class="text-white/60 mb-8 leading-relaxed max-w-md">Providing exceptional legal services with integrity, expertise, and unwavering dedication to achieving the best outcomes for our clients.</p> <div class="flex items-center gap-6"><a href="tel:6893536943" class="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> <span class="font-semibold">(689) 353-6943</span></a></div></div> <div class="lg:col-span-3"><p class="text-gold uppercase tracking-[0.2em] text-xs mb-6">Navigation</p> <ul class="space-y-4"><li><a href="/" class="text-white/70 hover:text-gold transition-colors">Home</a></li> <li><a href="/meet-ben-king" class="text-white/70 hover:text-gold transition-colors">Meet Ben King</a></li> <li><a href="/contact" class="text-white/70 hover:text-gold transition-colors">Contact</a></li> <li><a href="/login" class="text-white/70 hover:text-gold transition-colors">Client Portal</a></li></ul></div> <div class="lg:col-span-4"><p class="text-gold uppercase tracking-[0.2em] text-xs mb-6">Practice Areas</p> <ul class="space-y-3"><li><a href="/services/personal-injury" class="text-white/70 hover:text-gold transition-colors text-sm">Personal Injury</a></li> <li><a href="/services/criminal-defense" class="text-white/70 hover:text-gold transition-colors text-sm">Criminal Defense</a></li> <li><a href="/services/employment-law" class="text-white/70 hover:text-gold transition-colors text-sm">Employment Law</a></li> <li><a href="/services/real-estate-business" class="text-white/70 hover:text-gold transition-colors text-sm">Real Estate &amp; Business</a></li> <li><a href="/services/civil-rights" class="text-white/70 hover:text-gold transition-colors text-sm">Civil Rights Violations</a></li> <li><a href="/services/cannabis-law" class="text-white/70 hover:text-gold transition-colors text-sm">Medical Marijuana &amp; Cannabis</a></li> <li><a href="/services/appeals" class="text-white/70 hover:text-gold transition-colors text-sm">Appeals</a></li> <li><a href="/services/property-damage" class="text-white/70 hover:text-gold transition-colors text-sm">Property Damage</a></li></ul></div></div></div> <div class="border-t border-white/10"><div class="max-w-7xl mx-auto px-6 lg:px-8 py-6"><div class="flex flex-col md:flex-row justify-between items-center gap-4"><p class="text-white/40 text-sm">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} King Law Firm. All rights reserved.</p> <p class="text-white/40 text-sm text-center md:text-right">This website is for informational purposes only and does not constitute legal advice.</p></div></div></div></footer>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    let isDashboard = store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/dashboard");
    if (isDashboard) {
      $$renderer2.push("<!--[-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex flex-col min-h-screen">`);
      Navigation($$renderer2, { user: authStore.user });
      $$renderer2.push(`<!----> <main class="flex-grow">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main> `);
      Footer($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
