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
        blue: {
          500: '#86A5CA',
          600: '#86A5CA',
          700: '#9dcef7',
        },
        clinical: {
          50:  '#f0f7ff',
          100: '#dbeeff',
          500: '#86A5CA',
          600: '#86A5CA',
          700: '#9dcef7',
        },
      },
    },
  },
  plugins: [],
};
export default config;
