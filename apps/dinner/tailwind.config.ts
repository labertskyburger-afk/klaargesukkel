import type { Config } from "tailwindcss";

// Dinner System keeps its own navy/gold identity — a personal tool for
// Albert's family, not the klaargesukkel ink/amber/teal brand palette.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1F3B57",
        navyLight: "#2c5378",
        gold: "#B08D57",
        goldLight: "#e8dcc8",
        bg: "#FAF9F6",
        card: "#FFFFFF",
        line: "#E4E0D8",
        text: "#26282B",
        muted: "#6b6f73",
        green: "#3f7a4f",
        greenBg: "#eaf5ec",
        amber: "#a3711b",
        amberBg: "#fbf1de",
      },
    },
  },
  plugins: [],
};

export default config;
