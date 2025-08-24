/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'primary': '#3B82F6', // blue-500
        'primary-hover': '#2563EB', // blue-600
        'secondary': '#6B7280', // gray-500
        'secondary-hover': '#4B5563', // gray-600
        'accent': '#10B981', // emerald-500
        'accent-hover': '#059669', // emerald-600
        'destructive': '#EF4444', // red-500
        'destructive-hover': '#DC2626', // red-600
        'background': '#F9FAFB', // gray-50
        'foreground': '#1F2937', // gray-800
        'card': '#FFFFFF',
        'border': '#E5E7EB', // gray-200
      }
    },
  },
  plugins: [],
}