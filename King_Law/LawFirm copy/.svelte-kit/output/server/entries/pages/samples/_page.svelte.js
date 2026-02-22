import { a9 as head, a4 as ensure_array_like, a2 as attr_class, a3 as stringify } from "../../../chunks/index2.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$renderer) {
  const samples = [
    {
      title: "Classic Traditional",
      description: "Conservative, trustworthy design with traditional law firm aesthetics. Gold accents on deep blue, serif typography, formal structure.",
      href: "/samples/classic",
      color: "bg-king-blue"
    },
    {
      title: "Modern Bold",
      description: "Contemporary, striking design with dynamic layouts. Full-screen hero, gradient backgrounds, bold typography, and animated elements.",
      href: "/samples/modern",
      color: "bg-gradient-to-br from-king-blue to-king-blue-dark"
    },
    {
      title: "Elegant Minimal",
      description: "Sophisticated, refined aesthetic with generous whitespace. Clean lines, subtle animations, editorial typography, luxury feel.",
      href: "/samples/elegant",
      color: "bg-white border-2 border-king-blue"
    }
  ];
  head("erxr18", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>King Law - Brand Samples</title>`);
    });
  });
  $$renderer.push(`<div class="min-h-screen bg-gray-50 py-20"><div class="max-w-6xl mx-auto px-6"><div class="text-center mb-16"><h1 class="font-title text-5xl text-king-blue mb-4">Brand Design Samples</h1> <p class="text-xl text-gray-500">Three distinct design directions for King Law's brand overhaul</p> <div class="flex items-center justify-center gap-4 mt-6"><div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-king-blue"></span> <span class="text-sm text-gray-600">King Blue #1D3047</span></div> <div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-gold"></span> <span class="text-sm text-gray-600">Gold #F2B022</span></div> <div class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-white border"></span> <span class="text-sm text-gray-600">White</span></div></div></div> <div class="grid md:grid-cols-3 gap-8"><!--[-->`);
  const each_array = ensure_array_like(samples);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let sample = each_array[i];
    $$renderer.push(`<a${attr("href", sample.href)} class="group block"><div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"><div${attr_class(`${stringify(sample.color)} h-48 flex items-center justify-center`)}><img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-16 w-auto"/></div> <div class="p-6"><div class="flex items-center gap-2 mb-2"><span class="text-gold font-bold">0${escape_html(i + 1)}</span> <h2 class="font-title text-2xl text-king-blue group-hover:text-gold transition-colors">${escape_html(sample.title)}</h2></div> <p class="text-gray-500 text-sm mb-4">${escape_html(sample.description)}</p> <span class="text-king-blue font-semibold text-sm group-hover:text-gold transition-colors">View Sample →</span></div></div></a>`);
  }
  $$renderer.push(`<!--]--></div> <div class="mt-16 text-center"><a href="/" class="text-gray-400 hover:text-king-blue transition-colors">← Back to Main Site</a></div></div></div>`);
}
export {
  _page as default
};
