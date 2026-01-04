import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
        },
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        border: {
          DEFAULT: "var(--border-default)",
          hover: "var(--border-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
      },
      boxShadow: {
        DEFAULT:
          "0 1px 3px 0 var(--shadow-color), 0 1px 2px 0 var(--shadow-color)",
        md: "0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color)",
        lg: "0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color)",
      },
    },
  },
  plugins: [],
} satisfies Config;
