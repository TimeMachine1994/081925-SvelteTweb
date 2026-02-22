import { a2 as attr_class, a4 as ensure_array_like, a3 as stringify } from "../../../chunks/index2.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import { a as attr } from "../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let formStatus = "idle";
    let touched = {};
    let fieldErrors = {};
    const matterTypes = [
      "Personal Injury",
      "Criminal Defense",
      "Employment Law",
      "Real Estate & Business",
      "Civil Rights",
      "Cannabis Law",
      "Appeals",
      "Property Damage",
      "Other"
    ];
    const urgencyOptions = [
      { value: "immediate", label: "Immediate" },
      { value: "this_week", label: "This Week" },
      { value: "this_month", label: "This Month" },
      { value: "no_rush", label: "No Rush" }
    ];
    function getMinDate() {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }
    $$renderer2.push(`<div class="min-h-screen pt-20"><section class="py-20 bg-king-blue"><div class="max-w-4xl mx-auto px-6 lg:px-8 text-center"><p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Free Consultation</p> <h1 class="font-title text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] mb-6">Request a Confidential<br/> <span class="text-gold">Consultation</span></h1> <p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">Request a confidential consultation below. We review each submission personally.</p></div></section> <section class="py-16 md:py-24 bg-king-blue-dark"><div class="max-w-3xl mx-auto px-6 lg:px-8">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<form class="space-y-8"><div class="grid sm:grid-cols-2 gap-6"><div><label for="firstName" class="block text-sm font-medium text-white/80 mb-2">First Name <span class="text-gold">*</span></label> <input type="text" id="firstName" name="firstName" required${attr_class(`w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all ${stringify(touched["firstName"] && fieldErrors["firstName"] ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : touched["firstName"] && !fieldErrors["firstName"] ? "border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20" : "border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20")}`)} placeholder="John"/> `);
      if (touched["firstName"] && fieldErrors["firstName"]) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-red-400 text-xs mt-1">${escape_html(fieldErrors["firstName"])}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div><label for="lastName" class="block text-sm font-medium text-white/80 mb-2">Last Name <span class="text-gold">*</span></label> <input type="text" id="lastName" name="lastName" required${attr_class(`w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all ${stringify(touched["lastName"] && fieldErrors["lastName"] ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : touched["lastName"] && !fieldErrors["lastName"] ? "border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20" : "border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20")}`)} placeholder="Doe"/> `);
      if (touched["lastName"] && fieldErrors["lastName"]) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-red-400 text-xs mt-1">${escape_html(fieldErrors["lastName"])}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="grid sm:grid-cols-2 gap-6"><div><label for="phone" class="block text-sm font-medium text-white/80 mb-2">Phone</label> <input type="tel" id="phone" name="phone" class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all" placeholder="(689) 353-6943"/></div> <div><label for="email" class="block text-sm font-medium text-white/80 mb-2">Email <span class="text-gold">*</span></label> <input type="email" id="email" name="email" required${attr_class(`w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all ${stringify(touched["email"] && fieldErrors["email"] ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : touched["email"] && !fieldErrors["email"] ? "border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20" : "border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20")}`)} placeholder="john@example.com"/> `);
      if (touched["email"] && fieldErrors["email"]) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-red-400 text-xs mt-1">${escape_html(fieldErrors["email"])}</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="grid sm:grid-cols-2 gap-6"><div><label for="matterType" class="block text-sm font-medium text-white/80 mb-2">Matter Type</label> <select id="matterType" name="matterType" class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer svelte-1gihjje" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;">`);
      $$renderer2.option(
        { value: "", class: "bg-king-blue-dark text-white/50" },
        ($$renderer3) => {
          $$renderer3.push(`Select one`);
        },
        "svelte-1gihjje"
      );
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(matterTypes);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let type = each_array[$$index];
        $$renderer2.option(
          { value: type, class: "bg-king-blue-dark text-white" },
          ($$renderer3) => {
            $$renderer3.push(`${escape_html(type)}`);
          },
          "svelte-1gihjje"
        );
      }
      $$renderer2.push(`<!--]--></select></div> <div><label for="currentlyRepresented" class="block text-sm font-medium text-white/80 mb-2">Currently Represented?</label> <select id="currentlyRepresented" name="currentlyRepresented" class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer svelte-1gihjje" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;">`);
      $$renderer2.option(
        { value: "", class: "bg-king-blue-dark text-white/50" },
        ($$renderer3) => {
          $$renderer3.push(`Select one`);
        },
        "svelte-1gihjje"
      );
      $$renderer2.option(
        { value: "no", class: "bg-king-blue-dark text-white" },
        ($$renderer3) => {
          $$renderer3.push(`No`);
        },
        "svelte-1gihjje"
      );
      $$renderer2.option(
        { value: "yes", class: "bg-king-blue-dark text-white" },
        ($$renderer3) => {
          $$renderer3.push(`Yes`);
        },
        "svelte-1gihjje"
      );
      $$renderer2.option(
        { value: "unsure", class: "bg-king-blue-dark text-white" },
        ($$renderer3) => {
          $$renderer3.push(`Unsure`);
        },
        "svelte-1gihjje"
      );
      $$renderer2.push(`</select></div></div> <div><label for="message" class="block text-sm font-medium text-white/80 mb-2">Brief Description</label> <textarea id="message" name="message" rows="5" class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-y" placeholder="High-level overview only."></textarea></div> <div class="grid sm:grid-cols-2 gap-6"><div><label for="urgency" class="block text-sm font-medium text-white/80 mb-2">Urgency</label> <select id="urgency" name="urgency" class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer svelte-1gihjje" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"><!--[-->`);
      const each_array_1 = ensure_array_like(urgencyOptions);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let opt = each_array_1[$$index_1];
        $$renderer2.option(
          { value: opt.value, class: "bg-king-blue-dark text-white" },
          ($$renderer3) => {
            $$renderer3.push(`${escape_html(opt.label)}`);
          },
          "svelte-1gihjje"
        );
      }
      $$renderer2.push(`<!--]--></select></div> <div><label for="preferredDate" class="block text-sm font-medium text-white/80 mb-2">Preferred Consultation Date</label> <input type="date" id="preferredDate" name="preferredDate"${attr("min", getMinDate())} class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all cursor-pointer [color-scheme:dark]"/></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button type="submit"${attr("disabled", formStatus === "submitting", true)} class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 depth-gold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">${escape_html("Request Consultation")}</button> <p class="text-white/30 text-xs">By submitting, you agree to our privacy policy. Your information is confidential and will only be used to evaluate your legal matter.</p></form>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="py-16 bg-king-blue border-t border-white/5"><div class="max-w-4xl mx-auto px-6 lg:px-8"><div class="grid sm:grid-cols-3 gap-8 text-center"><div><div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div> <h3 class="text-white font-semibold mb-1">100% Confidential</h3> <p class="text-white/40 text-sm">Your information is protected by attorney-client privilege.</p></div> <div><div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <h3 class="text-white font-semibold mb-1">24-Hour Response</h3> <p class="text-white/40 text-sm">We personally review and respond to every submission.</p></div> <div><div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div> <h3 class="text-white font-semibold mb-1">No Obligation</h3> <p class="text-white/40 text-sm">Free initial consultation with no strings attached.</p></div></div></div></section></div>`);
  });
}
export {
  _page as default
};
