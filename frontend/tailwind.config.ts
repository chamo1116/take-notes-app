import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF1E3",
        brown: "#957139",
        heading: "#88642A",
      },
      fontFamily: {
        "inria-serif": ["var(--font-inria-serif)"],
        inter: ["var(--font-inter)"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.1)" },
        },
      },
      animation: {
        blink: "blink 0.32s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
