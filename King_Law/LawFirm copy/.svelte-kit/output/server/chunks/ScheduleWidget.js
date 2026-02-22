import { a2 as attr_class, a4 as ensure_array_like, a3 as stringify } from "./index2.js";
import { a as attr } from "./attributes.js";
import { e as escape_html } from "./escaping.js";
function ScheduleWidget($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { variant = "dark" } = $$props;
    let isDark = variant === "dark";
    let selectedDate = "";
    let weekOffset = 0;
    function getWeekDays(offset) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(startOfWeek.getDate() + diff + offset * 7);
      const days = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        days.push({
          date: dateStr,
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
          isToday: d.getTime() === today.getTime(),
          isPast: d < today,
          isWeekend: d.getDay() === 0 || d.getDay() === 6
        });
      }
      return days;
    }
    let weekDays = getWeekDays(weekOffset);
    let weekLabel = (() => {
      const days = getWeekDays(weekOffset);
      if (days.length === 0) return "";
      const first = new Date(days[0].date);
      const last = new Date(days[days.length - 1].date);
      const opts = { month: "long", day: "numeric" };
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${first.toLocaleDateString("en-US", opts)} – ${last.toLocaleDateString("en-US", opts)}, ${last.getFullYear()}`;
    })();
    $$renderer2.push(`<div>`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class(`${stringify(isDark ? "bg-white/5 border-white/10 depth-card-dark" : "bg-gray-50 border-gray-200 depth-card")} backdrop-blur-sm border rounded-2xl p-6 md:p-10`)}><h2${attr_class(`font-title text-2xl md:text-3xl ${stringify(isDark ? "text-white" : "text-king-blue")} mb-2`)}>Select a Date &amp; Time</h2> <p${attr_class(`${stringify(isDark ? "text-white/50" : "text-gray-400")} text-sm mb-8`)}>Monday – Friday, 9:00 AM – 5:00 PM Eastern</p> <div class="flex items-center justify-between mb-6"><button${attr("disabled", weekOffset <= 0, true)} aria-label="Previous week"${attr_class(`p-2 rounded-lg border ${stringify(isDark ? "border-white/10 text-white/60 hover:text-gold hover:border-gold" : "border-gray-200 text-gray-400 hover:text-gold hover:border-gold")} transition-all disabled:opacity-30 disabled:cursor-not-allowed`)}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button> <span${attr_class(`${stringify(isDark ? "text-white/80" : "text-gray-700")} font-semibold text-sm md:text-base`)}>${escape_html(weekLabel)}</span> <button${attr("disabled", weekOffset >= 8, true)} aria-label="Next week"${attr_class(`p-2 rounded-lg border ${stringify(isDark ? "border-white/10 text-white/60 hover:text-gold hover:border-gold" : "border-gray-200 text-gray-400 hover:text-gold hover:border-gold")} transition-all disabled:opacity-30 disabled:cursor-not-allowed`)}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div> <div class="grid grid-cols-5 gap-2 md:gap-3 mb-8"><!--[-->`);
      const each_array = ensure_array_like(weekDays);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let day = each_array[$$index];
        $$renderer2.push(`<button${attr("disabled", day.isPast, true)}${attr_class(`flex flex-col items-center py-3 md:py-4 rounded-xl border transition-all ${stringify(selectedDate === day.date ? "bg-gold/20 border-gold text-gold" : day.isPast ? (isDark ? "border-white/5 text-white/20" : "border-gray-100 text-gray-300") + " cursor-not-allowed" : day.isToday ? isDark ? "border-gold/40 text-white hover:border-gold hover:bg-gold/10" : "border-gold/40 text-gray-700 hover:border-gold hover:bg-gold/10" : isDark ? "border-white/10 text-white/60 hover:border-gold/50 hover:text-white hover:bg-white/5" : "border-gray-200 text-gray-500 hover:border-gold/50 hover:text-gray-800 hover:bg-gold/5")}`)}><span class="text-xs uppercase tracking-wider mb-1">${escape_html(day.dayName)}</span> <span class="text-lg md:text-xl font-bold">${escape_html(day.label)}</span> `);
        if (day.isToday) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-[10px] text-gold mt-1">Today</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></button>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div${attr_class(`text-center py-12 border-t ${stringify(isDark ? "border-white/10" : "border-gray-200")}`)}><svg${attr_class(`w-12 h-12 ${stringify(isDark ? "text-white/15" : "text-gray-200")} mx-auto mb-4`)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> <p${attr_class(isDark ? "text-white/30" : "text-gray-300")}>Select a date above to see available times</p></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  ScheduleWidget as S
};
