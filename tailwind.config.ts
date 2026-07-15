import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0A1930",
        emerald: "#1F9D6C",
        amber: "#E8A33D",
        canvas: "#F5F7F6",
        ink: "#16232E",
      },
    },
  },
  plugins: [],
};

export default config;
