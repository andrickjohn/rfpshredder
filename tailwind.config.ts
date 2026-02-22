import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: '#1B365D',
          light: '#264573',
          dark: '#122442',
        },
        brand: {
          green: '#10B981',
          'green-dark': '#0D9668',
        },
      },
    },
  },
  plugins: [],
};
export default config;
