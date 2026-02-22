import { a2 as attr_class, a3 as stringify } from "./index2.js";
import { e as escape_html } from "./escaping.js";
function Badge($$renderer, $$props) {
  let { variant, class: className = "" } = $$props;
  const variantClasses = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    unpaid: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    lawyer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    staff: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
    client: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    converted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  };
  $$renderer.push(`<span${attr_class(`inline-block text-xs px-2 py-1 rounded-full font-semibold capitalize ${stringify(variantClasses[variant] || "")} ${stringify(className)}`)}>${escape_html(variant)}</span>`);
}
export {
  Badge as B
};
