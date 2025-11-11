import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        aurora: ["Inter", "var(--font-inter)", "system-ui"],
      },
      colors: {
        aurora: {
          blue: "#3B82F6",
          orange: "#F97316",
        },
      },
    },
  },
  plugins: [],
};

export default config;
