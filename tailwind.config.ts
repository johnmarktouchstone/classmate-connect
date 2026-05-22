import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: "#003768",
        "brand-dark": "#00294f",
        ink: "#102033",
        linen: "#f7f9fc"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(0, 55, 104, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
