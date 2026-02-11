import { F as ensure_array_like, y as attr_class, z as stringify, G as attr_style, x as bind_props, w as head } from "../../../../chunks/index2.js";
import { B as Button } from "../../../../chunks/Button.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import { a as attr, c as clsx } from "../../../../chunks/attributes.js";
import { p as parseCSV } from "../../../../chunks/csv-parser.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function ColorPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      label = "Color",
      value = "#3B82F6",
      presets = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#6B7280",
        "#1E3A5F"
      ],
      onchange
    } = $$props;
    $$renderer2.push(`<div class="space-y-2">`);
    if (label) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<label class="block text-sm font-medium text-gray-700">${escape_html(label)}</label>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex items-center gap-3"><div class="relative"><input type="color"${attr("value", value)} class="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 overflow-hidden"/></div> <div class="flex gap-2 flex-wrap"><!--[-->`);
    const each_array = ensure_array_like(presets);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let preset = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`w-6 h-6 rounded-full border-2 transition-all ${stringify(value === preset ? "border-gray-900 scale-110" : "border-transparent hover:scale-105")}`)}${attr_style(`background-color: ${stringify(preset)};`)}${attr("title", preset)}></button>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="flex items-center gap-2"><span class="text-xs text-gray-500">Hex:</span> <input type="text"${attr("value", value)} class="text-xs px-2 py-1 border border-gray-300 rounded w-20 font-mono" placeholder="#000000"/></div></div>`);
    bind_props($$props, { value });
  });
}
const DEFAULT_CATEGORIES = [
  {
    name: "Medical Treatment",
    color: "#FFFF00",
    textColor: "#000000",
    strokeColor: "#000000",
    strokeWidth: 1,
    keywords: ["surgery", "clinic", "imaging", "injection", "visit", "consultation", "therapy", "examination", "chiropractic", "physical therapy", "PT", "MRI", "x-ray", "xray"]
  },
  {
    name: "Incident/Accident",
    color: "#CC0000",
    textColor: "#FFFFFF",
    strokeColor: "#7F1D1D",
    strokeWidth: 2,
    keywords: ["MVA", "fall", "accident", "injury", "collision", "crash", "hit", "struck", "motor vehicle"]
  },
  {
    name: "Legal Milestone",
    color: "#FF9900",
    textColor: "#000000",
    strokeColor: "#000000",
    strokeWidth: 1,
    keywords: ["filing", "deposition", "subject accident", "complaint", "settlement", "trial", "hearing", "motion"]
  },
  {
    name: "Gap in Treatment",
    color: "#006600",
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 1,
    keywords: ["no treatment", "gap", "none", "no visits", "no records"]
  }
];
function detectCategory(text, categories) {
  const lowerText = text.toLowerCase();
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return cat;
      }
    }
  }
  return null;
}
const TEMPLATES = [
  {
    id: "legal-medical",
    name: "Legal / Medical",
    description: "Pre-configured for personal injury, medical malpractice, and workers comp timelines.",
    columnHints: {
      date: ["date", "visit date", "event date", "dos", "date of service"],
      title: ["title", "event", "provider", "facility", "description"],
      description: ["description", "notes", "summary", "clinical notes", "details"],
      category: ["category", "type", "event type", "classification"],
      facility: ["facility", "provider", "clinic", "hospital", "doctor"],
      exhibitId: ["exhibit", "exhibit_id", "exhibit id", "ref", "reference"],
      mediaUrl: ["media", "media_url", "url", "link", "attachment"],
      time: ["time", "visit time", "appointment time"]
    },
    categories: DEFAULT_CATEGORIES
  },
  {
    id: "generic",
    name: "Generic Timeline",
    description: "A blank template with no pre-configured categories.",
    columnHints: {
      date: ["date"],
      title: ["title", "name", "event"],
      description: ["description", "notes", "details"],
      category: ["category", "type"],
      time: ["time"]
    },
    categories: []
  }
];
function SchemaEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      projectId,
      columnMapping = {},
      categoryConfig = [...DEFAULT_CATEGORIES],
      availableColumns = [],
      onSave
    } = $$props;
    let selectedTemplate = "legal-medical";
    let isSaving = false;
    let saveMessage = "";
    const FIELDS = [
      {
        key: "date",
        label: "Date",
        required: true,
        description: "Primary sort key — determines year column placement"
      },
      {
        key: "title",
        label: "Title",
        required: true,
        description: "Event heading shown in bold on each record box"
      },
      {
        key: "description",
        label: "Description",
        required: false,
        description: "Clinical summary or event details"
      },
      {
        key: "category",
        label: "Category",
        required: false,
        description: "Maps to color coding (Medical, Accident, Legal, Gap)"
      },
      {
        key: "facility",
        label: "Facility",
        required: false,
        description: "Provider or location name"
      },
      {
        key: "time",
        label: "Time",
        required: false,
        description: "Time of day for the event"
      },
      {
        key: "exhibitId",
        label: "Exhibit ID",
        required: false,
        description: "Evidence reference (e.g., Exhibit A)"
      },
      {
        key: "mediaUrl",
        label: "Media URL",
        required: false,
        description: "Link to image, PDF, or video"
      },
      {
        key: "tooltip",
        label: "Tooltip",
        required: false,
        description: "Custom hover text"
      }
    ];
    const hasRequiredMappings = "date" in columnMapping && columnMapping.date !== "" && "title" in columnMapping && columnMapping.title !== "";
    function handleFieldMapping(field, colName) {
      const newMapping = { ...columnMapping };
      if (field in newMapping) {
        delete newMapping[field];
      }
      for (const [f, col] of Object.entries(newMapping)) {
        if (col === colName) {
          delete newMapping[f];
        }
      }
      if (colName) {
        newMapping[field] = colName;
      }
      columnMapping = newMapping;
    }
    function addCategory() {
      categoryConfig = [
        ...categoryConfig,
        {
          name: "New Category",
          color: "#808080",
          textColor: "#FFFFFF",
          strokeColor: "#000000",
          strokeWidth: 1,
          keywords: []
        }
      ];
    }
    async function save() {
      isSaving = true;
      saveMessage = "";
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: {
              columnMapping: JSON.stringify(columnMapping),
              categoryConfig: JSON.stringify(categoryConfig)
            }
          })
        });
        if (res.ok) {
          saveMessage = "Schema saved!";
          onSave?.(columnMapping, categoryConfig);
          setTimeout(() => saveMessage = "", 2e3);
        } else {
          saveMessage = "Failed to save";
        }
      } catch {
        saveMessage = "Error saving schema";
      }
      isSaving = false;
    }
    $$renderer2.push(`<div class="h-full overflow-y-auto p-6 space-y-8"><div><h2 class="text-xl font-bold text-gray-900">Schema Editor</h2> <p class="text-sm text-gray-500 mt-1">Define how your CSV columns map to timeline fields and configure category colors.</p></div> <section class="space-y-3"><h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Template</h3> <div class="flex gap-3"><!--[-->`);
    const each_array = ensure_array_like(TEMPLATES);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let template = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`flex-1 p-4 rounded-lg border-2 text-left transition-all ${stringify(selectedTemplate === template.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white")}`)}><div class="font-medium text-gray-900">${escape_html(template.name)}</div> <div class="text-xs text-gray-500 mt-1">${escape_html(template.description)}</div></button>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="space-y-3"><h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Column Mapping</h3> `);
    if (availableColumns.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">Import a CSV file in the <strong>Data</strong> tab first to see available columns here.
				You can still configure categories below.</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100"><!--[-->`);
    const each_array_1 = ensure_array_like(FIELDS);
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let field = each_array_1[$$index_2];
      $$renderer2.push(`<div class="flex items-center gap-4 px-4 py-3"><div class="w-40 shrink-0"><div class="flex items-center gap-1.5"><span class="text-sm font-medium text-gray-900">${escape_html(field.label)}</span> `);
      if (field.required) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-red-500 text-xs">*</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <p class="text-xs text-gray-400 mt-0.5">${escape_html(field.description)}</p></div> <div class="flex-1">`);
      if (availableColumns.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.select(
          {
            class: "w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            value: columnMapping[field.key] || "",
            onchange: (e) => handleFieldMapping(field.key, e.currentTarget.value)
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`— Not mapped —`);
            });
            $$renderer3.push(`<!--[-->`);
            const each_array_2 = ensure_array_like(availableColumns);
            for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
              let col = each_array_2[$$index_1];
              $$renderer3.option({ value: col }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(col)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="text-sm text-gray-400 italic">No columns available yet</div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (columnMapping[field.key]) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-green-500 shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="space-y-3"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Categories &amp; Colors</h3> `);
    Button($$renderer2, {
      variant: "ghost",
      size: "sm",
      onclick: addCategory,
      children: ($$renderer3) => {
        $$renderer3.push(`<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Add Category`);
      }
    });
    $$renderer2.push(`<!----></div> <div class="space-y-3"><!--[-->`);
    const each_array_3 = ensure_array_like(categoryConfig);
    for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
      let category = each_array_3[index];
      $$renderer2.push(`<div class="bg-white rounded-lg border border-gray-200 p-4"><div class="flex items-start gap-4"><div class="shrink-0"><div class="w-10 h-10 rounded-lg border-2 border-gray-300"${attr_style(`background-color: ${stringify(category.color)};`)}></div></div> <div class="flex-1 space-y-3"><div class="flex items-center gap-3"><input type="text"${attr("value", category.name)} class="flex-1 text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Category name"/> <input type="color"${attr("value", category.color)} class="w-8 h-8 rounded cursor-pointer border border-gray-300"/> <button type="button" class="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Remove category"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div> <div><label class="text-xs text-gray-500">Auto-detect keywords (comma-separated)</label> <input type="text"${attr("value", category.keywords.join(", "))} class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., surgery, clinic, imaging"/></div> <div class="inline-block text-xs px-3 py-1.5 rounded border"${attr_style(`background-color: ${stringify(category.color)}; color: ${stringify(category.textColor)}; border-color: #000;`)}>Sample: ${escape_html(category.name)}</div></div></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></section> <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between"><div class="flex items-center gap-2">`);
    if (!hasRequiredMappings && availableColumns.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-sm text-amber-600">⚠ Map Date and Title columns to continue</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (saveMessage) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-sm text-green-600">${escape_html(saveMessage)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    Button($$renderer2, {
      variant: "primary",
      onclick: save,
      loading: isSaving,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Save Schema`);
      }
    });
    $$renderer2.push(`<!----></div></div>`);
    bind_props($$props, { columnMapping, categoryConfig });
  });
}
function DataImporter($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      projectId,
      columnMapping = {},
      categoryConfig = [],
      existingEvents = [],
      onEventsLoaded,
      onConfirm
    } = $$props;
    let importState = existingEvents.length > 0 ? "confirmed" : "empty";
    let rawCsvText = "";
    let parsedEvents = existingEvents;
    let parseErrors = [];
    let csvColumns = [];
    let csvRows = [];
    let isSaving = false;
    let fileInputEl = null;
    let editingCell = null;
    let editValue = "";
    function getCategoryColor(categoryName) {
      if (!categoryName) return null;
      const cat = categoryConfig.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      return cat?.color || null;
    }
    async function confirmImport() {
      isSaving = true;
      try {
        const mapping = {};
        for (const [field, colName] of Object.entries(columnMapping)) {
          mapping[field] = colName;
        }
        const result = parseCSV(rawCsvText, Object.keys(mapping).length > 0 ? mapping : void 0);
        let events = result.events;
        if (categoryConfig.length > 0) {
          events = events.map((evt) => {
            if (!evt.category) {
              const searchText = `${evt.title} ${evt.description || ""}`;
              const detected = detectCategory(searchText, categoryConfig);
              if (detected) return { ...evt, category: detected.name };
            }
            return evt;
          });
        }
        const res = await fetch(`/api/projects/${projectId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events, errors: result.errors })
        });
        if (res.ok) {
          parsedEvents = events;
          importState = "confirmed";
          onEventsLoaded?.(events, csvColumns);
          onConfirm?.(events, csvColumns);
        }
      } catch (err) {
        console.error("Failed to save events:", err);
      }
      isSaving = false;
    }
    function resetImport() {
      importState = "empty";
      rawCsvText = "";
      parsedEvents = [];
      parseErrors = [];
      csvColumns = [];
      csvRows = [];
    }
    $$renderer2.push(`<div class="h-full overflow-y-auto">`);
    if (importState === "empty") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center justify-center h-full p-6"><div${attr_class(`w-full max-w-lg p-12 border-2 border-dashed rounded-xl text-center transition-all ${stringify("border-gray-300 bg-white hover:border-gray-400")}`)} role="button" tabindex="0"><svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <h3 class="mt-4 text-lg font-semibold text-gray-900">Add Data</h3> <p class="mt-2 text-sm text-gray-500">Drop a CSV file here, or click to browse your files.</p> <div class="mt-6">`);
      Button($$renderer2, {
        variant: "primary",
        size: "lg",
        onclick: () => fileInputEl?.click(),
        children: ($$renderer3) => {
          $$renderer3.push(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> Browse Files`);
        }
      });
      $$renderer2.push(`<!----></div> <input type="file" accept=".csv" class="hidden"/></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (importState === "preview") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="p-6 space-y-4"><div class="flex items-center justify-between"><div><h2 class="text-xl font-bold text-gray-900">Data Preview</h2> <p class="text-sm text-gray-500 mt-1">Review and edit your data before confirming. Click any cell to edit.</p></div> <div class="flex items-center gap-3">`);
        Button($$renderer2, {
          variant: "ghost",
          onclick: resetImport,
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->Cancel`);
          }
        });
        $$renderer2.push(`<!----> `);
        Button($$renderer2, {
          variant: "primary",
          onclick: confirmImport,
          loading: isSaving,
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->Confirm Import (${escape_html(parsedEvents.length)} events)`);
          }
        });
        $$renderer2.push(`<!----></div></div> <div class="flex gap-4"><div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"><span class="text-sm font-medium text-blue-700">${escape_html(parsedEvents.length)} events parsed</span></div> `);
        if (parseErrors.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="bg-red-50 border border-red-200 rounded-lg px-4 py-2"><span class="text-sm font-medium text-red-700">${escape_html(parseErrors.length)} errors</span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"><span class="text-sm font-medium text-gray-700">${escape_html(csvColumns.length)} columns</span></div></div> `);
        if (parseErrors.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4"><h4 class="text-sm font-semibold text-red-800 mb-2">Parse Errors</h4> <ul class="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto"><!--[-->`);
          const each_array = ensure_array_like(parseErrors);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let error = each_array[$$index];
            $$renderer2.push(`<li>• ${escape_html(error)}</li>`);
          }
          $$renderer2.push(`<!--]--></ul></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="overflow-x-auto border border-gray-200 rounded-lg"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th><!--[-->`);
        const each_array_1 = ensure_array_like(csvColumns);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let col = each_array_1[$$index_1];
          $$renderer2.push(`<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${escape_html(col)}</th>`);
        }
        $$renderer2.push(`<!--]--><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
        const each_array_2 = ensure_array_like(csvRows.slice(0, 50));
        for (let rowIndex = 0, $$length = each_array_2.length; rowIndex < $$length; rowIndex++) {
          let row = each_array_2[rowIndex];
          $$renderer2.push(`<tr${attr_class(clsx(rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"))}><td class="px-3 py-2 text-xs text-gray-400">${escape_html(rowIndex + 1)}</td><!--[-->`);
          const each_array_3 = ensure_array_like(csvColumns);
          for (let colIndex = 0, $$length2 = each_array_3.length; colIndex < $$length2; colIndex++) {
            each_array_3[colIndex];
            $$renderer2.push(`<td class="px-3 py-2 text-sm">`);
            if (editingCell?.row === rowIndex && editingCell?.col === colIndex) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<input type="text"${attr("value", editValue)} class="w-full text-sm border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/>`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<button type="button" class="text-left w-full truncate max-w-[200px] text-gray-700 hover:text-blue-600 cursor-text"${attr("title", row[colIndex] || "—")}>${escape_html(row[colIndex] || "—")}</button>`);
            }
            $$renderer2.push(`<!--]--></td>`);
          }
          $$renderer2.push(`<!--]--><td class="px-3 py-2">`);
          if (parsedEvents[rowIndex]?.category) {
            $$renderer2.push("<!--[-->");
            const color = getCategoryColor(parsedEvents[rowIndex].category);
            $$renderer2.push(`<span class="inline-block text-xs px-2 py-0.5 rounded border border-black/20"${attr_style(`background-color: ${stringify(color || "#e5e7eb")};`)}>${escape_html(parsedEvents[rowIndex].category)}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<span class="text-xs text-gray-400">—</span>`);
          }
          $$renderer2.push(`<!--]--></td></tr>`);
        }
        $$renderer2.push(`<!--]--></tbody></table></div> `);
        if (csvRows.length > 50) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm text-gray-500 text-center">Showing 50 of ${escape_html(csvRows.length)} rows</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (importState === "confirmed") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="flex items-center justify-center h-full p-6"><div class="text-center max-w-md"><div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div> <h3 class="mt-4 text-lg font-semibold text-gray-900">${escape_html(parsedEvents.length)} Events Imported</h3> <p class="mt-2 text-sm text-gray-500">Your data is ready. Switch to the <strong>Timeline Editor</strong> tab to visualize it.</p> `);
          if (categoryConfig.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="mt-6 space-y-2"><!--[-->`);
            const each_array_4 = ensure_array_like(categoryConfig);
            for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
              let cat = each_array_4[$$index_4];
              const count = parsedEvents.filter((e) => e.category === cat.name).length;
              if (count > 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full border border-black/20"${attr_style(`background-color: ${stringify(cat.color)};`)}></div> <span class="text-gray-700">${escape_html(cat.name)}</span></div> <span class="font-medium text-gray-900">${escape_html(count)}</span></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--> `);
            if (parsedEvents.filter((e) => !e.category).length > 0) {
              $$renderer2.push("<!--[-->");
              const uncategorized = parsedEvents.filter((e) => !e.category).length;
              $$renderer2.push(`<div class="flex items-center justify-between text-sm"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-gray-300 border border-black/20"></div> <span class="text-gray-700">Uncategorized</span></div> <span class="font-medium text-gray-900">${escape_html(uncategorized)}</span></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <div class="mt-8 flex gap-3 justify-center">`);
          Button($$renderer2, {
            variant: "ghost",
            onclick: resetImport,
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->Re-Import`);
            }
          });
          $$renderer2.push(`<!----> `);
          Button($$renderer2, {
            variant: "secondary",
            onclick: () => importState = "preview",
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->Edit Data`);
            }
          });
          $$renderer2.push(`<!----></div></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function EditorToolbar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      zoomLevel,
      searchQuery,
      activeFilters,
      canUndo,
      canRedo
    } = $$props;
    const zoomLevels = [
      { value: "macro", label: "Macro", icon: "🔭" },
      { value: "normal", label: "Normal", icon: "👁" },
      { value: "micro", label: "Micro", icon: "🔬" }
    ];
    $$renderer2.push(`<div class="h-10 bg-white border-b border-gray-200 flex items-center px-3 gap-1 shrink-0 overflow-x-auto"><div class="flex items-center bg-gray-100 rounded-md p-0.5"><!--[-->`);
    const each_array = ensure_array_like(zoomLevels);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let level = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`px-2.5 py-1 text-xs rounded transition-all ${stringify(zoomLevel === level.value ? "bg-white shadow text-gray-900 font-medium" : "text-gray-600 hover:text-gray-900")}`)}${attr("title", `${stringify(level.label)} zoom`)}>${escape_html(level.icon)} ${escape_html(level.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="w-px h-6 bg-gray-200 mx-1"></div> <div class="flex items-center bg-gray-100 rounded-md p-0.5"><button type="button"${attr_class(`px-2.5 py-1 text-xs rounded transition-all ${stringify(
      "bg-white shadow text-gray-900 font-medium"
    )}`)} title="Equal spacing between events">Uniform</button> <button type="button"${attr_class(`px-2.5 py-1 text-xs rounded transition-all ${stringify("text-gray-600 hover:text-gray-900")}`)} title="Spacing proportional to time between events">Chrono</button></div> <div class="w-px h-6 bg-gray-200 mx-1"></div> <div class="relative stamp-dropdown"><button type="button"${attr_class(`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${stringify("bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200")}`)} title="Category Stamper — click to select a category, then click events to re-categorize">🖌️ Stamp `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="w-px h-6 bg-gray-200 mx-1"></div> <div class="relative"><svg class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> <input type="text"${attr("value", searchQuery)} placeholder="Search timeline..." class="text-xs pl-7 pr-2 py-1 border border-gray-300 rounded-md w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/> `);
    if (searchQuery) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button" class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="w-px h-6 bg-gray-200 mx-1"></div> <div class="relative filter-dropdown"><button type="button"${attr_class(`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${stringify(activeFilters.size > 0 ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300" : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200")}`)}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg> Filter `);
    if (activeFilters.size > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">${escape_html(activeFilters.size)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1"></div> <div class="flex items-center gap-0.5"><button type="button"${attr_class(`p-1.5 rounded-md text-xs transition-all ${stringify(canUndo ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed")}`)}${attr("disabled", !canUndo, true)} title="Undo"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg></button> <button type="button"${attr_class(`p-1.5 rounded-md text-xs transition-all ${stringify(canRedo ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed")}`)}${attr("disabled", !canRedo, true)} title="Redo"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path></svg></button></div></div>`);
  });
}
function RecordBox($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      event,
      zoomLevel = "normal",
      categoryConfig = [],
      searchQuery = "",
      brushMode = false,
      isSelected = false
    } = $$props;
    const category = () => {
      return categoryConfig.find((c) => c.name.toLowerCase() === (event.category || "").toLowerCase());
    };
    const bgColor = () => category()?.color || "#F3F4F6";
    const textColor = () => category()?.textColor || "#000000";
    const strokeColor = () => category()?.strokeColor || "#000000";
    const strokeWidth = () => category()?.strokeWidth ?? 1;
    const formattedDate = () => {
      try {
        const d = new Date(event.parsedDate);
        return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
      } catch {
        return event.date;
      }
    };
    function highlightText(text) {
      if (!searchQuery || searchQuery.length < 2) return text;
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return text.replace(regex, '<mark class="bg-yellow-300 px-0.5 rounded">$1</mark>');
    }
    $$renderer2.push(`<button type="button"${attr_class(`w-full text-left rounded transition-all ${stringify(brushMode ? "cursor-crosshair hover:ring-2 hover:ring-offset-1 hover:ring-purple-500" : "cursor-pointer hover:shadow-md")} ${stringify(isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "")}`)}${attr_style(`background-color: ${stringify(bgColor())}; color: ${stringify(textColor())}; border: ${stringify(strokeWidth())}px solid ${stringify(strokeColor())};`)}>`);
    if (zoomLevel === "macro") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="px-3 py-2"><span class="text-xs font-bold">${escape_html(formattedDate())}</span> `);
      if (event.title) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-xs ml-1 opacity-80 truncate">${escape_html(event.title)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (zoomLevel === "normal") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="px-3 py-2.5 space-y-1"><div class="font-bold text-sm underline decoration-1">${html(highlightText(formattedDate()))}</div> `);
        if (event.description) {
          $$renderer2.push("<!--[-->");
          const facilityOrTitle = event.title;
          $$renderer2.push(`<div class="text-xs font-semibold opacity-90">${html(highlightText(facilityOrTitle))}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="text-xs font-semibold opacity-90">${html(highlightText(event.title))}</div>`);
        }
        $$renderer2.push(`<!--]--> `);
        if (event.exhibitId) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-1"><span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">📎 ${escape_html(event.exhibitId)}</span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="px-3 py-3 space-y-1.5"><div class="font-bold text-sm underline decoration-1">${html(highlightText(formattedDate()))}</div> <div class="text-xs font-semibold">${html(highlightText(event.title))}</div> `);
        if (event.description) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-xs opacity-80 whitespace-pre-wrap leading-relaxed">${html(highlightText(event.description))}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (event.exhibitId) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-1"><span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">📎 ${escape_html(event.exhibitId)}</span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (event.mediaUrl) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-1"><span class="inline-flex items-center gap-1 text-xs bg-black/10 px-1.5 py-0.5 rounded">🔗 Media</span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (event.category) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-1 text-xs opacity-70 italic">${escape_html(event.category)}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></button>`);
  });
}
function GapIndicator($$renderer, $$props) {
  let { label, daysBetween, spacerMode = "uniform" } = $$props;
  const height = () => {
    if (spacerMode === "uniform" || !daysBetween) return 40;
    return Math.min(120, Math.max(40, Math.round(daysBetween / 365 * 80)));
  };
  $$renderer.push(`<div class="flex items-center justify-center rounded border border-dashed border-green-700 bg-green-800 text-white text-xs font-medium text-center"${attr_style(`min-height: ${stringify(height())}px;`)}>${escape_html(label)}</div>`);
}
function YearColumn($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      year,
      events,
      zoomLevel = "normal",
      spacerMode = "uniform",
      categoryConfig = [],
      searchQuery = "",
      brushMode = false,
      yearStyle,
      selectedEventId = null
    } = $$props;
    const eventsWithGaps = () => {
      if (events.length === 0) return [{ type: "gap", label: "No Treatment" }];
      const items = [];
      for (let i = 0; i < events.length; i++) {
        if (i > 0 && spacerMode === "chronological") {
          const prev = new Date(events[i - 1].parsedDate);
          const curr = new Date(events[i].parsedDate);
          const daysBetween = Math.round((curr.getTime() - prev.getTime()) / (1e3 * 60 * 60 * 24));
          if (daysBetween > 90) {
            items.push({ type: "gap", label: `${daysBetween} day gap`, daysBetween });
          }
        }
        items.push({ type: "event", event: events[i] });
      }
      return items;
    };
    const gapStyle = () => {
      if (spacerMode === "uniform") return "gap-2";
      return "gap-1";
    };
    $$renderer2.push(`<div class="flex flex-col shrink-0" style="width: 280px;"><button type="button"${attr_class(`w-full text-center py-3 font-bold rounded-t-lg sticky top-0 z-10 cursor-pointer hover:opacity-90 transition-opacity ${stringify(yearStyle?.fontSize || "text-lg")}`)}${attr_style(`background-color: ${stringify(yearStyle?.bgColor || "#1F2937")}; color: ${stringify(yearStyle?.textColor || "#FFFFFF")};`)}>${escape_html(year)} <span class="text-xs font-normal opacity-60 ml-1">(${escape_html(events.length)})</span></button> <div${attr_class(`flex flex-col ${stringify(gapStyle())} p-2 bg-gray-100 rounded-b-lg min-h-[200px] border border-t-0 border-gray-300`)}><!--[-->`);
    const each_array = ensure_array_like(eventsWithGaps());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      if (item.type === "gap") {
        $$renderer2.push("<!--[-->");
        GapIndicator($$renderer2, { label: item.label, daysBetween: item.daysBetween, spacerMode });
      } else {
        $$renderer2.push("<!--[!-->");
        if (item.type === "event") {
          $$renderer2.push("<!--[-->");
          if (zoomLevel === "macro" && item.event.category !== "Incident/Accident" && item.event.category !== "Legal Milestone") {
            $$renderer2.push("<!--[-->");
          } else {
            $$renderer2.push("<!--[!-->");
            RecordBox($$renderer2, {
              event: item.event,
              zoomLevel,
              categoryConfig,
              searchQuery,
              brushMode,
              isSelected: selectedEventId === item.event.id
            });
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (zoomLevel === "macro") {
      $$renderer2.push("<!--[-->");
      const criticalEvents = events.filter((e) => e.category === "Incident/Accident" || e.category === "Legal Milestone");
      const otherCount = events.length - criticalEvents.length;
      if (otherCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-center text-xs text-gray-400 py-2">+${escape_html(otherCount)} other event${escape_html(otherCount !== 1 ? "s" : "")}</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function TimelineMinimap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      events,
      categoryConfig = [],
      years = [],
      scrollLeft = 0,
      scrollWidth = 1,
      clientWidth = 1
    } = $$props;
    const viewportFraction = () => clientWidth / Math.max(scrollWidth, 1);
    const scrollFraction = () => scrollLeft / Math.max(scrollWidth - clientWidth, 1);
    function getCategoryColor(categoryName) {
      if (!categoryName) return "#9CA3AF";
      const cat = categoryConfig.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      return cat?.color || "#9CA3AF";
    }
    const yearEventCounts = () => {
      const counts = /* @__PURE__ */ new Map();
      for (const year of years) {
        counts.set(year, { total: 0, categories: /* @__PURE__ */ new Map() });
      }
      for (const event of events) {
        const y = new Date(event.parsedDate).getFullYear();
        const entry = counts.get(y);
        if (entry) {
          entry.total++;
          const cat = event.category || "Uncategorized";
          entry.categories.set(cat, (entry.categories.get(cat) || 0) + 1);
        }
      }
      return counts;
    };
    const maxEvents = () => {
      let max = 1;
      for (const entry of yearEventCounts().values()) {
        max = Math.max(max, entry.total);
      }
      return max;
    };
    $$renderer2.push(`<div class="bg-white border-t border-gray-200 px-4 py-2"><div class="relative h-10 bg-gray-100 rounded-md cursor-pointer overflow-hidden" role="slider" tabindex="0" aria-label="Timeline minimap"${attr("aria-valuemin", 0)}${attr("aria-valuemax", 100)}${attr("aria-valuenow", Math.round(scrollFraction() * 100))}><div class="absolute inset-0 flex items-end gap-px px-1"><!--[-->`);
    const each_array = ensure_array_like(years);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let year = each_array[$$index];
      const entry = yearEventCounts().get(year);
      const barHeight = entry ? Math.max(4, entry.total / maxEvents() * 32) : 2;
      $$renderer2.push(`<div class="flex-1 flex flex-col justify-end"${attr("title", `${stringify(year)}: ${stringify(entry?.total || 0)} events`)}><div class="w-full rounded-t-sm transition-all"${attr_style(`height: ${stringify(barHeight)}px; background-color: ${stringify(entry && entry.total > 0 ? getCategoryColor([...entry.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) : "#D1D5DB")};`)}></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="absolute top-0 h-full bg-blue-500/20 border border-blue-500 rounded-sm transition-[left] duration-75"${attr_style(`left: ${stringify(scrollFraction() * 100)}%; width: ${stringify(viewportFraction() * 100)}%;`)}></div> <div class="absolute bottom-0 left-0 right-0 flex text-center"><!--[-->`);
    const each_array_1 = ensure_array_like(years);
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      let year = each_array_1[i];
      if (i % Math.max(1, Math.floor(years.length / 10)) === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="absolute text-xs text-gray-500 -translate-x-1/2"${attr_style(`left: ${stringify((i + 0.5) / years.length * 100)}%;`)}>${escape_html(year)}</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
  });
}
function ColumnTimeline($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      events,
      zoomLevel = "normal",
      spacerMode = "uniform",
      categoryConfig = [],
      searchQuery = "",
      activeFilters = /* @__PURE__ */ new Set(),
      brushMode = false,
      brushCategory = null,
      showMinimap = true,
      yearStyles = /* @__PURE__ */ new Map(),
      selectedEventId = null,
      onStamp,
      onEventClick,
      onYearClick
    } = $$props;
    let scrollLeft = 0;
    let scrollWidth = 1;
    let clientWidth = 1;
    const filteredEvents = () => {
      let filtered = events;
      if (activeFilters.size > 0) {
        filtered = filtered.filter((e) => {
          const cat = e.category || "Uncategorized";
          return activeFilters.has(cat);
        });
      }
      if (searchQuery && searchQuery.length >= 2) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q) || e.date.toLowerCase().includes(q));
      }
      return filtered;
    };
    const eventsByYear = () => {
      const map = /* @__PURE__ */ new Map();
      for (const event of filteredEvents()) {
        const year = new Date(event.parsedDate).getFullYear();
        if (!map.has(year)) map.set(year, []);
        map.get(year).push(event);
      }
      for (const events2 of map.values()) {
        events2.sort((a, b) => new Date(a.parsedDate).getTime() - new Date(b.parsedDate).getTime());
      }
      return map;
    };
    const years = () => {
      const allYears = [...eventsByYear().keys()].sort((a, b) => a - b);
      if (allYears.length < 2) return allYears;
      const filled = [];
      for (let y = allYears[0]; y <= allYears[allYears.length - 1]; y++) {
        filled.push(y);
      }
      return filled;
    };
    $$renderer2.push(`<div class="flex flex-col h-full">`);
    if (
      // Update dimensions on mount
      events.length === 0
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex-1 flex items-center justify-center text-gray-400"><div class="text-center"><svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> <p class="mt-4 text-sm">No events to display. Import data in the <strong>Data</strong> tab.</p></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex-1 overflow-x-auto overflow-y-auto p-4"><div class="flex gap-4 min-h-full"><!--[-->`);
      const each_array = ensure_array_like(years());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let year = each_array[$$index];
        const yearEvents = eventsByYear().get(year) || [];
        YearColumn($$renderer2, {
          year,
          events: yearEvents,
          zoomLevel,
          spacerMode,
          categoryConfig,
          searchQuery,
          brushMode,
          yearStyle: yearStyles.get(year),
          selectedEventId
        });
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (showMinimap && years().length > 0) {
        $$renderer2.push("<!--[-->");
        TimelineMinimap($$renderer2, {
          events,
          categoryConfig,
          years: years(),
          scrollLeft,
          scrollWidth,
          clientWidth
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="bg-gray-50 border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500"><span>${escape_html(filteredEvents().length)} of ${escape_html(events.length)} events `);
      if (activeFilters.size > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`• ${escape_html(activeFilters.size)} filter${escape_html(activeFilters.size !== 1 ? "s" : "")} active`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (searchQuery) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`• searching "${escape_html(searchQuery)}"`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span> <span>${escape_html(years().length)} year${escape_html(years().length !== 1 ? "s" : "")}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function PreviewMode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { events, categoryConfig = [], projectTitle = "Timeline" } = $$props;
    let selectedEvent = null;
    let showLightbox = false;
    function handleEventClick(event) {
      selectedEvent = event;
      showLightbox = true;
    }
    function handlePrint() {
      window.print();
    }
    $$renderer2.push(`<div class="h-full flex flex-col"><div class="absolute top-2 right-2 z-20 flex items-center gap-2 print:hidden">`);
    Button($$renderer2, {
      variant: "secondary",
      size: "sm",
      onclick: handlePrint,
      children: ($$renderer3) => {
        $$renderer3.push(`<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Print`);
      }
    });
    $$renderer2.push(`<!----></div> <div class="hidden print:block print:mb-4"><h1 class="text-2xl font-bold text-gray-900">${escape_html(projectTitle)}</h1> <p class="text-sm text-gray-500">Generated ${escape_html((/* @__PURE__ */ new Date()).toLocaleDateString())}</p> `);
    if (categoryConfig.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex gap-4 mt-2 text-xs"><!--[-->`);
      const each_array = ensure_array_like(categoryConfig);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cat = each_array[$$index];
        $$renderer2.push(`<div class="flex items-center gap-1"><div class="w-3 h-3 rounded border border-black/20"${attr_style(`background-color: ${stringify(cat.color)};`)}></div> <span>${escape_html(cat.name)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1 relative">`);
    ColumnTimeline($$renderer2, {
      events,
      zoomLevel: "normal",
      spacerMode: "uniform",
      categoryConfig,
      searchQuery: "",
      activeFilters: /* @__PURE__ */ new Set(),
      brushMode: false,
      brushCategory: null,
      showMinimap: true,
      onEventClick: handleEventClick
    });
    $$renderer2.push(`<!----></div></div> `);
    if (showLightbox && selectedEvent) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true"><div class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"><div class="flex items-center justify-between p-4 border-b border-gray-200"><div><h3 class="font-bold text-gray-900">${escape_html(selectedEvent.title)}</h3> <p class="text-sm text-gray-500">${escape_html(selectedEvent.date)}</p></div> <button type="button" class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <div class="p-4 space-y-3">`);
      if (selectedEvent.category) {
        $$renderer2.push("<!--[-->");
        const cat = categoryConfig.find((c) => c.name.toLowerCase() === (selectedEvent?.category || "").toLowerCase());
        $$renderer2.push(`<div><span class="inline-block text-xs px-2.5 py-1 rounded border border-black/20"${attr_style(`background-color: ${stringify(cat?.color || "#e5e7eb")}; color: ${stringify(cat?.textColor || "#000")};`)}>${escape_html(selectedEvent.category)}</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedEvent.description) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4> <p class="text-sm text-gray-700 whitespace-pre-wrap">${escape_html(selectedEvent.description)}</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedEvent.exhibitId) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Exhibit</h4> <p class="text-sm text-gray-700">${escape_html(selectedEvent.exhibitId)}</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedEvent.mediaUrl) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><h4 class="text-xs font-medium text-gray-500 uppercase mb-1">Media</h4> `);
        if (selectedEvent.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", selectedEvent.mediaUrl)}${attr("alt", selectedEvent.title)} class="max-w-full rounded-lg border border-gray-200"/>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (selectedEvent.mediaUrl.match(/\.pdf$/i)) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<iframe${attr("src", selectedEvent.mediaUrl)} class="w-full h-96 rounded-lg border border-gray-200"${attr("title", selectedEvent.exhibitId || selectedEvent.title)}></iframe>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<a${attr("href", selectedEvent.mediaUrl)} target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline">Open media →</a>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function PropertiesPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      selection,
      categoryConfig,
      events,
      yearStyles,
      onCategoryStyleChange,
      onEventDataChange,
      onYearStyleChange
    } = $$props;
    const isOpen = selection !== null;
    const selectedCategory = () => {
      if (selection?.type !== "event") return null;
      return categoryConfig.find((c) => c.name.toLowerCase() === (selection.event.category || "").toLowerCase()) || null;
    };
    const sameCategoryCount = () => {
      if (selection?.type !== "event") return 0;
      const cat = selection.event.category || "";
      return events.filter((e) => (e.category || "").toLowerCase() === cat.toLowerCase()).length;
    };
    const selectedYearStyle = () => {
      if (selection?.type !== "year") return null;
      return yearStyles.get(selection.year) || {
        bgColor: "#1F2937",
        textColor: "#FFFFFF",
        fontSize: "text-lg"
      };
    };
    let editTitle = "";
    let editDate = "";
    let editDescription = "";
    let editExhibitId = "";
    let editCategory = "";
    function commitEventData() {
      if (selection?.type !== "event") return;
      onEventDataChange(selection.event.id, {
        title: editTitle,
        date: editDate,
        description: editDescription,
        exhibitId: void 0,
        category: void 0
      });
    }
    const fontSizeOptions = [
      { value: "text-sm", label: "Small" },
      { value: "text-base", label: "Medium" },
      { value: "text-lg", label: "Large" },
      { value: "text-xl", label: "X-Large" },
      { value: "text-2xl", label: "2X-Large" }
    ];
    if (isOpen) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button" class="fixed inset-0 z-30" aria-label="Close properties panel"></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`absolute top-0 right-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${stringify(isOpen ? "translate-x-0" : "translate-x-full")}`)}><div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0"><div class="flex items-center gap-2"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg> <h3 class="text-sm font-semibold text-gray-900">`);
    if (selection?.type === "event") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`Event Properties`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (selection?.type === "year") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`Year Header Style`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`Properties`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></h3></div> <button type="button" class="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <div class="flex-1 overflow-y-auto">`);
    if (selection?.type === "event") {
      $$renderer2.push("<!--[-->");
      const cat = selectedCategory();
      const count = sameCategoryCount();
      $$renderer2.push(`<div class="border-b border-gray-100"><div class="px-4 py-3 bg-gray-50"><div class="flex items-center gap-2">`);
      if (cat) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="w-3 h-3 rounded-full border border-black/20 shrink-0"${attr_style(`background-color: ${stringify(cat.color)};`)}></span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Type Style — ${escape_html(selection.event.category || "Uncategorized")}</span></div> `);
      if (count > 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-xs text-gray-500 mt-1">Changes apply to all ${escape_html(count)} boxes of this type</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (cat) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="px-4 py-4 space-y-5">`);
        ColorPicker($$renderer2, {
          label: "Background",
          value: cat.color,
          onchange: (color) => onCategoryStyleChange(cat.name, { color })
        });
        $$renderer2.push(`<!----> `);
        ColorPicker($$renderer2, {
          label: "Text Color",
          value: cat.textColor,
          presets: [
            "#000000",
            "#FFFFFF",
            "#1F2937",
            "#374151",
            "#991B1B",
            "#1E3A8A"
          ],
          onchange: (color) => onCategoryStyleChange(cat.name, { textColor: color })
        });
        $$renderer2.push(`<!----> `);
        ColorPicker($$renderer2, {
          label: "Stroke Color",
          value: cat.strokeColor,
          presets: [
            "#000000",
            "#7F1D1D",
            "#1E3A8A",
            "#065F46",
            "#92400E",
            "#6B21A8"
          ],
          onchange: (color) => onCategoryStyleChange(cat.name, { strokeColor: color })
        });
        $$renderer2.push(`<!----> <div class="space-y-2"><label class="block text-sm font-medium text-gray-700">Stroke Width</label> <div class="flex items-center gap-3"><input type="range" min="0" max="5" step="0.5"${attr("value", cat.strokeWidth)} class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/> <span class="text-xs text-gray-600 font-mono w-8 text-right">${escape_html(cat.strokeWidth)}px</span></div> <div class="mt-2 flex items-center justify-center"><div class="w-full h-8 rounded"${attr_style(`background-color: ${stringify(cat.color)}; border: ${stringify(cat.strokeWidth)}px solid ${stringify(cat.strokeColor)};`)}></div></div></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="px-4 py-4"><p class="text-xs text-gray-500 italic">This event has no category assigned. Assign a category below to enable type styles.</p></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="px-4 py-3 bg-gray-50 border-b border-gray-100"><span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Event Data</span> <p class="text-xs text-gray-500 mt-0.5">Individual to this box only</p></div> <div class="px-4 py-4 space-y-4"><div class="space-y-1"><label for="prop-category" class="block text-sm font-medium text-gray-700">Category</label> `);
      $$renderer2.select(
        {
          id: "prop-category",
          value: editCategory,
          onchange: commitEventData,
          class: "w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`Uncategorized`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(categoryConfig);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let cat2 = each_array[$$index];
            $$renderer3.option({ value: cat2.name }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(cat2.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div> <div class="space-y-1"><label for="prop-date" class="block text-sm font-medium text-gray-700">Date</label> <input id="prop-date" type="text"${attr("value", editDate)} class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/></div> <div class="space-y-1"><label for="prop-title" class="block text-sm font-medium text-gray-700">Title</label> <input id="prop-title" type="text"${attr("value", editTitle)} class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/></div> <div class="space-y-1"><label for="prop-desc" class="block text-sm font-medium text-gray-700">Description</label> <textarea id="prop-desc" rows="3" class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y">`);
      const $$body = escape_html(editDescription);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> <div class="space-y-1"><label for="prop-exhibit" class="block text-sm font-medium text-gray-700">Exhibit ID</label> <input id="prop-exhibit" type="text"${attr("value", editExhibitId)} class="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. EX-001"/></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (selection?.type === "year") {
        $$renderer2.push("<!--[-->");
        const style = selectedYearStyle();
        if (style) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="px-4 py-3 bg-gray-50 border-b border-gray-100"><span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Year ${escape_html(selection.year)} Header</span></div> <div class="px-4 py-4 space-y-5"><div class="space-y-2"><label class="block text-sm font-medium text-gray-700">Preview</label> <div${attr_class(`text-center py-3 font-bold rounded-lg ${stringify(style.fontSize)}`)}${attr_style(`background-color: ${stringify(style.bgColor)}; color: ${stringify(style.textColor)};`)}>${escape_html(selection.year)}</div></div> `);
          ColorPicker($$renderer2, {
            label: "Background",
            value: style.bgColor,
            presets: [
              "#1F2937",
              "#1E3A5F",
              "#7F1D1D",
              "#065F46",
              "#4C1D95",
              "#000000",
              "#FFFFFF",
              "#F3F4F6"
            ],
            onchange: (color) => onYearStyleChange(selection.year, { bgColor: color })
          });
          $$renderer2.push(`<!----> `);
          ColorPicker($$renderer2, {
            label: "Text Color",
            value: style.textColor,
            presets: [
              "#FFFFFF",
              "#000000",
              "#F3F4F6",
              "#FDE68A",
              "#A5F3FC",
              "#C4B5FD"
            ],
            onchange: (color) => onYearStyleChange(selection.year, { textColor: color })
          });
          $$renderer2.push(`<!----> <div class="space-y-2"><label class="block text-sm font-medium text-gray-700">Font Size</label> <div class="flex flex-wrap gap-1"><!--[-->`);
          const each_array_1 = ensure_array_like(fontSizeOptions);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let opt = each_array_1[$$index_1];
            $$renderer2.push(`<button type="button"${attr_class(`px-3 py-1.5 text-xs rounded-md border transition-all ${stringify(style.fontSize === opt.value ? "bg-blue-50 border-blue-300 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50")}`)}>${escape_html(opt.label)}</button>`);
          }
          $$renderer2.push(`<!--]--></div></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let title = data.project.title;
    let activeTab = "data";
    let columnMapping = data.settings?.columnMapping ? JSON.parse(data.settings.columnMapping) : {};
    let categoryConfig = data.settings?.categoryConfig ? JSON.parse(data.settings.categoryConfig) : [...DEFAULT_CATEGORIES];
    let availableColumns = [];
    let events = data.events?.events ? data.events.events.map((e) => ({ ...e, parsedDate: new Date(e.parsedDate) })) : [];
    let zoomLevel = "normal";
    let spacerMode = "uniform";
    let brushMode = false;
    let brushCategory = null;
    let searchQuery = "";
    let activeFilters = /* @__PURE__ */ new Set();
    let undoStack = [];
    let redoStack = [];
    let selection = null;
    let yearStyles = /* @__PURE__ */ new Map();
    const selectedEventId = () => {
      if (selection?.type === "event") return selection.event.id;
      return null;
    };
    const tabs = [
      {
        id: "data",
        label: "Data",
        icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      },
      {
        id: "schema",
        label: "Schema",
        icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      },
      {
        id: "editor",
        label: "Editor",
        icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
      },
      {
        id: "preview",
        label: "Preview",
        icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      }
    ];
    function handleSchemaSave(mapping, categories) {
      columnMapping = mapping;
      categoryConfig = categories;
      activeTab = "editor";
    }
    function handleEventsLoaded(newEvents, columns) {
      events = newEvents;
      availableColumns = columns;
    }
    function handleEventsConfirmed(newEvents, columns) {
      events = newEvents;
      availableColumns = columns;
      activeTab = "schema";
    }
    function handleStamp(eventId) {
      return;
    }
    function handleEventClick(event) {
      selection = { type: "event", event };
    }
    function handleYearClick(year) {
      selection = { type: "year", year };
    }
    function handleCategoryStyleChange(categoryName, updates) {
      categoryConfig = categoryConfig.map((c) => c.name === categoryName ? { ...c, ...updates } : c);
    }
    function handleEventDataChange(eventId, updates) {
      events = events.map((e) => e.id === eventId ? { ...e, ...updates } : e);
      if (selection?.type === "event" && selection.event.id === eventId) {
        const updated = events.find((e) => e.id === eventId);
        if (updated) selection = { type: "event", event: updated };
      }
    }
    function handleYearStyleChange(year, updates) {
      const current = yearStyles.get(year) || {
        bgColor: "#1F2937",
        textColor: "#FFFFFF",
        fontSize: "text-lg"
      };
      const newStyles = new Map(yearStyles);
      newStyles.set(year, { ...current, ...updates });
      yearStyles = newStyles;
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("ffmenf", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>${escape_html(title)} - TimelineCreator</title>`);
        });
      });
      $$renderer3.push(`<div class="h-screen flex flex-col bg-gray-100 print:bg-white"><header class="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 print:hidden"><div class="flex items-center gap-3 flex-1 min-w-0"><a href="/" class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Back to projects"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></a> `);
      {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<button type="button" class="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate cursor-text px-2 py-1 rounded hover:bg-gray-50 transition-colors" title="Click to edit title">${escape_html(title)}</button>`);
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="ml-4 text-xs text-gray-400 capitalize">${escape_html(activeTab)}</div></div></header> `);
      if (activeTab === "editor") {
        $$renderer3.push("<!--[-->");
        EditorToolbar($$renderer3, {
          zoomLevel,
          searchQuery,
          activeFilters,
          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="flex flex-1 overflow-hidden"><aside class="w-48 bg-white border-r border-gray-200 shrink-0 flex flex-col print:hidden"><nav class="flex-1 p-2 space-y-1"><!--[-->`);
      const each_array = ensure_array_like(tabs);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tab = each_array[$$index];
        $$renderer3.push(`<button type="button"${attr_class(`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${stringify(activeTab === tab.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}`)}><svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"${attr("d", tab.icon)}></path></svg> ${escape_html(tab.label)} `);
        if (tab.id === "schema" && Object.keys(columnMapping).length > 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="ml-auto w-2 h-2 rounded-full bg-green-400"></span>`);
        } else {
          $$renderer3.push("<!--[!-->");
          if (tab.id === "data" && events.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<span class="ml-auto text-xs text-gray-400">${escape_html(events.length)}</span>`);
          } else {
            $$renderer3.push("<!--[!-->");
            if (tab.id === "editor" && events.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="ml-auto w-2 h-2 rounded-full bg-gray-300"></span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></button>`);
      }
      $$renderer3.push(`<!--]--></nav> <div class="p-3 border-t border-gray-100"><div class="space-y-2"><div class="flex items-center gap-2 text-xs"><div${attr_class(`w-4 h-4 rounded-full flex items-center justify-center ${stringify(events.length > 0 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500")}`)}>`);
      if (events.length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`✓`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`1`);
      }
      $$renderer3.push(`<!--]--></div> <span class="text-gray-500">Data imported</span></div> <div class="flex items-center gap-2 text-xs"><div${attr_class(`w-4 h-4 rounded-full flex items-center justify-center ${stringify(Object.keys(columnMapping).length > 0 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500")}`)}>`);
      if (Object.keys(columnMapping).length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`✓`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`2`);
      }
      $$renderer3.push(`<!--]--></div> <span class="text-gray-500">Schema configured</span></div> <div class="flex items-center gap-2 text-xs"><div class="w-4 h-4 rounded-full flex items-center justify-center bg-gray-200 text-gray-500">3</div> <span class="text-gray-500">Timeline ready</span></div></div></div> <div class="p-3 border-t border-gray-100"><a href="/" class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> All Projects</a></div></aside> <main class="flex-1 overflow-hidden relative">`);
      if (activeTab === "schema") {
        $$renderer3.push("<!--[-->");
        SchemaEditor($$renderer3, {
          projectId: data.project.id,
          availableColumns,
          onSave: handleSchemaSave,
          get columnMapping() {
            return columnMapping;
          },
          set columnMapping($$value) {
            columnMapping = $$value;
            $$settled = false;
          },
          get categoryConfig() {
            return categoryConfig;
          },
          set categoryConfig($$value) {
            categoryConfig = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[!-->");
        if (activeTab === "data") {
          $$renderer3.push("<!--[-->");
          DataImporter($$renderer3, {
            projectId: data.project.id,
            columnMapping,
            categoryConfig,
            existingEvents: events,
            onEventsLoaded: handleEventsLoaded,
            onConfirm: handleEventsConfirmed
          });
        } else {
          $$renderer3.push("<!--[!-->");
          if (activeTab === "editor") {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="flex flex-col h-full"><div class="flex-1 overflow-hidden">`);
            ColumnTimeline($$renderer3, {
              events,
              zoomLevel,
              spacerMode,
              categoryConfig,
              searchQuery,
              activeFilters,
              brushMode,
              brushCategory,
              yearStyles,
              selectedEventId: selectedEventId(),
              onStamp: handleStamp,
              onEventClick: handleEventClick,
              onYearClick: handleYearClick
            });
            $$renderer3.push(`<!----></div> <div class="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-end print:hidden"><button type="button" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> Save Timeline → Preview</button></div> `);
            PropertiesPanel($$renderer3, {
              selection,
              categoryConfig,
              events,
              yearStyles,
              onCategoryStyleChange: handleCategoryStyleChange,
              onEventDataChange: handleEventDataChange,
              onYearStyleChange: handleYearStyleChange
            });
            $$renderer3.push(`<!----></div>`);
          } else {
            $$renderer3.push("<!--[!-->");
            if (activeTab === "preview") {
              $$renderer3.push("<!--[-->");
              PreviewMode($$renderer3, { events, categoryConfig, projectTitle: title });
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></main></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
