import { e as escape_html } from "../../../chunks/escaping.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { form } = $$props;
    $$renderer2.push(`<div class="min-h-screen pt-20"><section class="py-24 bg-king-blue"><div class="max-w-5xl mx-auto px-6 lg:px-8"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Get in Touch</p> <h1 class="font-title text-5xl md:text-6xl text-white leading-tight mb-6">Let's Start a<br/>Conversation</h1> <p class="text-xl text-white/70 max-w-2xl">Every great outcome begins with a conversation. Reach out today for your confidential consultation.</p></div></section> <section class="py-24 bg-white"><div class="max-w-6xl mx-auto px-6 lg:px-8"><div class="grid lg:grid-cols-12 gap-16"><div class="lg:col-span-7"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Send a Message</p> <h2 class="font-title text-3xl text-king-blue mb-8">How Can We Help?</h2> `);
    if (form?.success) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-green-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-r-lg mb-6">Thank you for contacting us. We'll get back to you soon!</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-r-lg mb-6">${escape_html(form.error)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" class="space-y-6"><div class="grid md:grid-cols-2 gap-6"><div><label for="name" class="block text-sm font-medium text-king-blue mb-2">Name *</label> <input type="text" id="name" name="name" required class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div> <div><label for="phone" class="block text-sm font-medium text-king-blue mb-2">Phone</label> <input type="tel" id="phone" name="phone" class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div></div> <div><label for="email" class="block text-sm font-medium text-king-blue mb-2">Email *</label> <input type="email" id="email" name="email" required class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div> <div><label for="subject" class="block text-sm font-medium text-king-blue mb-2">Subject *</label> <input type="text" id="subject" name="subject" required class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"/></div> <div><label for="message" class="block text-sm font-medium text-king-blue mb-2">Message *</label> <textarea id="message" name="message" rows="6" required class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none resize-none"></textarea></div> <button type="submit" class="w-full bg-king-blue hover:bg-king-blue-light text-white font-semibold py-4 px-6 rounded-lg transition-all depth-gold">Send Message</button></form></div> <div class="lg:col-span-5"><div class="bg-king-blue rounded-2xl p-8 text-white sticky top-28 depth-card-dark"><div class="mb-8 rounded-xl overflow-hidden"><img src="https://images1.loopnet.com/i2/Ey6wPQmSPw4GKc2vgW1TWFMUK_CgXKrLqSZeaXBD7RA/110/419-N-Magnolia-Ave-Orlando-FL-Primary-Photo-1-Large.jpg" alt="King Law Firm Office" class="w-full h-48 object-cover"/></div> <div class="space-y-8"><div><p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Address</p> <div class="flex items-center gap-3 mb-1"><p class="text-white font-bold text-lg">King Law Firm</p> <img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-8 w-auto"/></div> <p class="text-white/80">419 N. Magnolia Ave<br/> Orlando, FL 32801</p></div> <div><p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Phone</p> <a href="tel:6893536943" class="text-white hover:text-gold transition-colors text-xl font-semibold">(689) 353-6943</a></div> <div><p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Email</p> <a href="mailto:ben@givekingaring.com" class="text-white/80 hover:text-gold transition-colors">ben@givekingaring.com</a></div> <div><p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Office Hours</p> <p class="text-white/80">Monday - Friday: 9:00 AM - 5:00 PM<br/> Saturday - Sunday: Closed</p></div> <div class="pt-6 border-t border-white/10"><p class="text-white/60 text-sm mb-4">Already a client? Access your case documents and communicate with your attorney.</p> <a href="/login" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-6 py-3 rounded-lg font-semibold transition-all depth-gold">Client Portal →</a></div></div></div></div></div></div></section></div>`);
  });
}
export {
  _page as default
};
