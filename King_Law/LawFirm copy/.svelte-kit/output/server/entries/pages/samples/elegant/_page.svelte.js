import { a9 as head, a4 as ensure_array_like } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const values = [
      {
        title: "Integrity",
        description: "Ethical practice guides every decision we make."
      },
      {
        title: "Excellence",
        description: "Meticulous attention to detail in every case."
      },
      {
        title: "Dedication",
        description: "Unwavering commitment to your success."
      }
    ];
    const areas = [
      "Personal Injury & Civil Litigation",
      "Family Law & Estate Planning",
      "Corporate & Business Law",
      "Criminal Defense",
      "Real Estate Transactions",
      "Intellectual Property"
    ];
    head("s27eud", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>King Law - Elegant Design Sample</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen bg-white"><header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100"><div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"><span class="font-title text-2xl text-king-blue">King Law</span> <a href="/contact" class="text-sm text-king-blue hover:text-gold transition-colors">Contact →</a></div></header> <section class="min-h-screen flex items-center pt-20"><div class="max-w-7xl mx-auto px-6 w-full"><div class="grid lg:grid-cols-12 gap-12 items-center"><div class="lg:col-span-7"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Attorneys at Law</p> <h1 class="font-title text-6xl md:text-8xl text-king-blue leading-[0.9] mb-8">Thoughtful<br/> Legal<br/> Counsel</h1> <p class="text-xl text-gray-500 max-w-md mb-10 leading-relaxed">Where legal expertise meets genuine care. We guide you through complexity with clarity and purpose.</p> <a href="/contact" class="inline-flex items-center gap-3 text-king-blue hover:text-gold transition-colors group"><span class="font-semibold tracking-wide">Schedule a Consultation</span> <span class="w-12 h-[1px] bg-current transition-all group-hover:w-20"></span></a></div> <div class="lg:col-span-5"><div class="aspect-[4/5] bg-gradient-to-b from-gray-50 to-gray-100 rounded-sm relative overflow-hidden"><div class="absolute inset-0 flex items-center justify-center"><div class="text-center"><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-24 w-auto"/> <p class="text-king-blue/30 text-sm mt-4 tracking-widest uppercase">Est. 1985</p></div></div> <div class="absolute bottom-0 left-0 right-0 h-1 bg-gold"></div></div></div></div></div></section> <section class="py-32 bg-gray-50"><div class="max-w-5xl mx-auto px-6"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Our Values</p> <h2 class="font-title text-4xl text-king-blue mb-16">The Principles That Guide Us</h2> <div class="space-y-12"><!--[-->`);
    const each_array = ensure_array_like(values);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let value = each_array[i];
      $$renderer2.push(`<div class="grid md:grid-cols-12 gap-8 items-start border-t border-gray-200 pt-12"><div class="md:col-span-1"><span class="text-gold text-sm">0${escape_html(i + 1)}</span></div> <div class="md:col-span-4"><h3 class="font-title text-2xl text-king-blue">${escape_html(value.title)}</h3></div> <div class="md:col-span-7"><p class="text-gray-500 text-lg leading-relaxed">${escape_html(value.description)}</p></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></section> <section class="py-32 bg-king-blue"><div class="max-w-5xl mx-auto px-6"><div class="grid md:grid-cols-2 gap-16"><div><p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Practice Areas</p> <h2 class="font-title text-4xl text-white mb-8">Comprehensive Legal Services</h2> <p class="text-gray-400 leading-relaxed">Our attorneys bring decades of combined experience across diverse practice areas, providing sophisticated representation tailored to your unique circumstances.</p></div> <div class="space-y-4"><!--[-->`);
    const each_array_1 = ensure_array_like(areas);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let area = each_array_1[$$index_1];
      $$renderer2.push(`<div class="flex items-center gap-4 py-4 border-b border-white/10 group cursor-pointer"><span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity">→</span> <span class="text-white/80 group-hover:text-white transition-colors">${escape_html(area)}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></section> <section class="py-32 bg-white"><div class="max-w-4xl mx-auto px-6 text-center"><span class="text-gold text-6xl font-title">"</span> <blockquote class="font-title text-3xl md:text-4xl text-king-blue leading-relaxed mb-8">The law is not merely a profession, but a calling to serve those who need guidance through life's most challenging moments.</blockquote> <p class="text-gray-400">— Jonathan King, Founding Partner</p></div></section> <section class="py-24 bg-gray-50"><div class="max-w-3xl mx-auto px-6 text-center"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Begin Your Journey</p> <h2 class="font-title text-4xl text-king-blue mb-6">Let's Discuss Your Needs</h2> <p class="text-gray-500 mb-10">Every great outcome begins with a conversation. Reach out to schedule your confidential consultation.</p> <div class="flex flex-col sm:flex-row gap-6 justify-center"><a href="/contact" class="bg-king-blue hover:bg-king-blue-light text-white px-10 py-4 rounded-sm font-semibold transition-colors">Request Consultation</a> <a href="tel:6893536943" class="border border-king-blue text-king-blue hover:bg-king-blue hover:text-white px-10 py-4 rounded-sm font-semibold transition-colors">(689) 353-6943</a></div></div></section> <footer class="py-12 bg-white border-t border-gray-100"><div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4"><span class="font-title text-xl text-king-blue">King Law</span> <span class="text-gray-400 text-sm">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} All rights reserved.</span></div></footer> <div class="fixed bottom-4 left-4 bg-white border border-king-blue text-king-blue px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Sample 3: Elegant Minimal Design</div></div>`);
  });
}
export {
  _page as default
};
